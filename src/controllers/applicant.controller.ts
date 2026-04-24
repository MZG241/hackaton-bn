import { Request, Response } from "express";
import Applicant from "../models/applicant.model";
import Job from "../models/job.model";
import User from "../models/user.model";
import ScreeningResult from "../models/screening.model";
import mongoose from "mongoose";
import { aiController } from "./ai.controller";

export const applyJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // 1. Verify job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // 2. Check if user has a resume
    const user = await User.findById(userId).select('resume');
    if (!user?.resume) {
      return res.status(400).json({
        success: false,
        message: "Please upload your resume before applying"
      });
    }

    // 3. Check for existing application
    const existingApplication = await Applicant.findOne({
      applicant: userId,
      job: id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You've already applied to this job"
      });
    }

    // 4. Create new application
    const application = await Applicant.create({
      applicant: userId,
      job: id,
      status: 'Applied'
    }) as any;

    // 4.5 Trigger AI Screening in background
    aiController.runFullScreening(application._id.toString()).catch(err => {
      console.error("[Background AI Screening Error]:", err);
    });

    // 5. Return success response
    return res.status(201).json({
      success: true,
      message: `Application for the position of ${job.title} submitted successfully`,
      data: {
        applicationId: application._id,
        jobTitle: job.title,
        company: (job.postedBy as any).companyName,
        appliedAt: (application as any).createdAt
      }
    });

  } catch (error: any) {
    console.error("[ApplyJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    const applications = await Applicant.find({ applicant: userId })
      .populate({
        path: 'job',
        select: 'title description type location isClosed postedBy salaryMin salaryMax skillsRequired',
        populate: {
          path: 'postedBy',
          select: 'companyName companyLogo companyDescription'
        }
      })
      .sort({ createdAt: -1 });

    if (!applications.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No applications found"
      });
    }

    // Format response
    const formattedApplications = applications.map(app => {
      const job = app.job as any;
      const postedBy = job?.postedBy as any;

      return {
        _id: app._id,
        status: app.status,
        appliedAt: (app as any).createdAt,
        updatedAt: (app as any).updatedAt,
        job: {
          _id: job?._id,
          title: job?.title,
          description: job?.description,
          skillsRequired: job?.skillsRequired,
          type: job?.type,
          location: job?.location,
          isClosed: job?.isClosed,
          salaryRange: {
            min: job?.salaryMin,
            max: job?.salaryMax
          },
          company: {
            _id: postedBy?._id,
            name: postedBy?.companyName,
            logo: postedBy?.companyLogo,
            description: postedBy?.companyDescription
          }
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: formattedApplications
    });

  } catch (error: any) {
    console.error("[GetMyApplications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getApplicantsByJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, minScore, maxScore } = req.query as any;
    const userId = req.user?._id;

    // Verify job exists and user is owner
    const job = await Job.findOne({
      _id: id,
      postedBy: userId
    }).select('title category location type');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not authorized"
      });
    }

    // Build Screening filter
    const screenQuery: any = { job: id as string };
    if (category) screenQuery.category = category as string;
    if (minScore || maxScore) {
      screenQuery.score = {};
      if (minScore) screenQuery.score.$gte = parseInt(minScore as string);
      if (maxScore) screenQuery.score.$lte = parseInt(maxScore as string);
    }

    // Get screening results first to filter applicants
    const screeningResults = await ScreeningResult.find(screenQuery)
      .populate('candidate', 'fullname email profileImage resume skills experience education')
      .sort({ score: -1 });

    // Get all applicants for this job
    const allApplicants = await Applicant.find({ job: id })
      .populate('applicant', 'fullname email profileImage resume skills experience education');

    // Merge screening data with applicants
    const applicantsWithAI = allApplicants.map(app => {
      const applicant = app.applicant as any;
      const screening = screeningResults.find(r => (r.candidate as any)?._id.toString() === applicant?._id.toString());
      return {
        _id: app._id,
        status: app.status,
        appliedAt: (app as any).createdAt,
        user: {
          _id: applicant?._id,
          fullname: applicant?.fullname,
          email: applicant?.email,
          profileImage: applicant?.profileImage,
          resume: applicant?.resume,
          skills: applicant?.skills,
          experience: applicant?.experience,
          education: applicant?.education
        },
        aiScreening: screening || null
      };
    });

    // Apply filtering if specified
    let filteredApplicants = applicantsWithAI;
    if (category || minScore || maxScore) {
      filteredApplicants = applicantsWithAI.filter(app => app.aiScreening !== null);
    }

    return res.status(200).json({
      success: true,
      data: {
        count: filteredApplicants.length,
        job,
        applicants: filteredApplicants
      }
    });

  } catch (error: any) {
    console.error("[GetApplicantsByJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateApplicantStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?._id;

    // Validate status
    const validStatuses = ['Applied', 'In Review', 'Rejected', 'Accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // First find the application to verify ownership
    const application = await Applicant.findById(id)
      .populate({
        path: 'job',
        select: 'postedBy',
        match: { postedBy: userId }
      })
      .populate({
        path: 'applicant',
        select: 'fullname email profileImage resume'
      });

    if (!application || !application.job) {
      return res.status(404).json({
        success: false,
        message: "Application not found or not authorized"
      });
    }

    // Now update the status
    const updatedApplication = await Applicant.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'applicant',
      select: 'fullname email profileImage resume'
    });

    if (!updatedApplication) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const applicant = updatedApplication.applicant as any;

    return res.status(200).json({
      success: true,
      message: "Application status updated",
      data: {
        _id: updatedApplication._id,
        status: updatedApplication.status,
        appliedAt: (updatedApplication as any).createdAt,
        applicant: {
          _id: applicant?._id,
          name: applicant?.fullname,
          email: applicant?.email,
          profileImage: applicant?.profileImage,
          resume: applicant?.resume
        },
        jobId: (application.job as any)?._id
      }
    });

  } catch (error: any) {
    console.error("[UpdateApplicantStatus Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};