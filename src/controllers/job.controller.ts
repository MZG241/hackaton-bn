import { Request, Response } from "express";
import Job from "../models/job.model";
import Applicant from "../models/applicant.model";
import savedJob from "../models/savedjob.model";
import JobMatch from "../models/jobmatch.model";
import { aiService } from "../services/ai.service";
import mongoose from "mongoose";

export const createJob = async (req: Request, res: Response) => {
  try {
    const postedBy = req.user?._id;

    const {
      title,
      description,
      type,
      category,
      location,
      salaryMin,
      salaryMax,
      requirements,
      skillsRequired,
      experienceLevel,
      educationLevel
    } = req.body;

    if (!title || !description || !type || !location || !category) {
      return res.status(400).json({ success: false, message: "Title, description, type, location, category fields are required" });
    }

    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return res.status(400).json({
        success: false,
        message: "Minimum salary cannot be greater than maximum salary"
      });
    }

    const allowedType = ['full-time', 'part-time', 'contract', 'internship', 'remote', 'hybrid'];

    if (!allowedType.includes(type)) {
      return res.status(400).json({ success: false, message: "Job type is not allowed" });
    }

    const job = new Job({
      title,
      description,
      type,
      location,
      category,
      requirements: Array.isArray(requirements) ? requirements.join('\n') : (requirements || ''),
      salaryMin: salaryMin || null,
      salaryMax: salaryMax || null,
      postedBy,
      skillsRequired: skillsRequired || [],
      experienceLevel: experienceLevel || 'mid',
      educationLevel: educationLevel || ''
    });

    await job.save();

    return res.status(201).json({ success: true, message: `Job posted successfully`, data: job });

  } catch (error: any) {
    console.log("Error while posting job : ", error);
    res.status(500).json({ success: false, message: "Error Internal Server : ", error: error.message });
  }
}

export const getSingleJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID"
      });
    }

    // Parallel database queries
    const [job, applicantCount, userApplication] = await Promise.all([
      Job.findById(id as string).populate('postedBy', 'companyName companyDescription companyLogo'),
      Applicant.countDocuments({ job: new mongoose.Types.ObjectId(id as string) }),
      userId ? Applicant.findOne({ job: new mongoose.Types.ObjectId(id as string), applicant: userId }) : null
    ]);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // Enhanced response
    const response = {
      ...job.toObject(),
      stats: {
        applicantCount,
        hasApplied: !!userApplication,
        applicationStatus: userApplication?.status || null
      }
    };

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error: any) {
    console.error("[GetSingleJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const { title, location, category, type, page = 1, limit = 20 } = req.query;

    const query: any = { isClosed: false };

    if (title) query.title = { $regex: title, $options: 'i' };
    if (location) query.location = { $regex: location, $options: 'i' };
    if (category) query.category = category;
    if (type) query.type = type;

    if (req.query.onlySaved === 'true' && req.user) {
      const userSavedJobs = await savedJob.find({ applicant: req.user._id });
      const savedJobIds = userSavedJobs.map(sj => sj.job);
      query._id = { $in: savedJobIds };
      if (savedJobIds.length === 0) {
        return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
      }
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [jobs, totalCount] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'companyName companyLogo companyDescription')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      Job.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      }
    });

  } catch (error: any) {
    console.error("Error while getting all jobs:", error);
    res.status(500).json({ success: false, message: "Error Internal Server", error: error.message });
  }
}

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const updates = req.body;

    // Validate job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Authorization check
    if (!(job.postedBy as any).equals(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this job"
      });
    }

    // Prevent certain fields from being updated
    const restrictedUpdates = ['postedBy', 'createdAt', '_id'];
    Object.keys(updates).forEach(key => {
      if (restrictedUpdates.includes(key)) {
        delete updates[key];
      }
    });

    // Handle requirements if it's an array
    if (updates.requirements && Array.isArray(updates.requirements)) {
        updates.requirements = updates.requirements.join('\n');
    }

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      id as string,
      updates,
      { new: true, runValidators: true }
    ).populate('postedBy', 'companyName companyLogo');

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob
    });

  } catch (error: any) {
    console.error("[UpdateJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // 1. Verify job exists
    const job = await Job.findById(id).session(session);
    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // 2. Authorization check (owner OR admin)
    if (!(job.postedBy as any).equals(userId) && req.user?.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job"
      });
    }

    await savedJob.deleteMany({ job: new mongoose.Types.ObjectId(id as string) }).session(session);

    // 3. Delete all related applicants in single transaction
    await Applicant.deleteMany({ job: new mongoose.Types.ObjectId(id as string) }).session(session);

    // 4. Delete the job itself
    await Job.deleteOne({ _id: id as string }).session(session);

    // 5. Commit the transaction
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Job and all associated applications deleted successfully"
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error("[DeleteJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job",
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

export const getMyJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // 1. Find all jobs posted by the user
    const jobs = await Job.find({ postedBy: userId })
      .populate('postedBy', 'companyName companyLogo companyDescription')
      .sort({ createdAt: -1 });

    // 2. If no jobs found, return empty array
    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No jobs posted",
        data: []
      });
    }

    // 3. Get applicant counts for all jobs in a single query
    const jobIds = jobs.map(job => (job._id as any));
    const applicantCounts = await Applicant.aggregate([
      {
        $match: { job: { $in: jobIds } }
      },
      {
        $group: {
          _id: "$job",
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Create a map of jobId -> applicant count
    const applicantCountMap: { [key: string]: number } = {};
    applicantCounts.forEach(item => {
      applicantCountMap[item._id.toString()] = item.count;
    });

    // 5. Enhance jobs with applicant count
    const jobsWithApplicantCounts = jobs.map(job => ({
      ...job.toObject(),
      applicantCount: applicantCountMap[(job._id as any).toString()] || 0
    }));

    return res.status(200).json({
      success: true,
      data: jobsWithApplicantCounts
    });

  } catch (error: any) {
    console.error("Error while getting my jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const toggleJobStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    //Verify job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    //Authorization check (owner or admin)
    if (!(job.postedBy as any).equals(userId) && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this job"
      });
    }

    //Toggle the status
    const updatedJob = await Job.findByIdAndUpdate(
      id as string,
      { isClosed: !job.isClosed },
      { new: true, runValidators: true }
    ).populate('postedBy', 'companyName companyLogo');

    if (!updatedJob) {
      return res.status(404).json({ success: false, message: "Job not found after update" });
    }

    //Determine status message
    const statusMessage = updatedJob.isClosed
      ? "Job closed successfully"
      : "Job reopened successfully";

    return res.status(200).json({
      success: true,
      message: statusMessage,
      data: updatedJob
    });

  } catch (error: any) {
    console.error("[ToggleJobStatus Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle job status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

interface IJobQuery {
  keyword?: string;
  category?: string;
  type?: string;
  location?: string;
  skills?: string | string[];
  experienceLevel?: string;
  educationLevel?: string;
  page?: string;
  limit?: string;
}

export const getJobs = async (req: Request, res: Response) => {
  try {
    const {
      keyword,
      category,
      type,
      location,
      skills,
      experienceLevel,
      educationLevel,
      page = "1",
      limit = "10"
    } = req.query as any;

    const userId = req.user?._id;

    // Build the query object
    const query: any = { isClosed: false };

    // Text search (requires text index in schema)
    if (keyword) {
      query.$text = { $search: keyword as string };
    }

    // Exact match filters
    if (category) query.category = category;
    if (type) query.type = type;

    // Partial match filters (case-insensitive)
    if (location) query.location = { $regex: location as string, $options: 'i' };

    // New Advanced Filters
    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : (skills as string).split(',').map(s => s.trim());
      query.skillsRequired = { $in: skillsArray };
    }
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (educationLevel) query.educationLevel = { $regex: educationLevel as string, $options: 'i' };

    if (req.query.onlySaved === 'true' && userId) {
      const userSavedJobs = await savedJob.find({ jobseeker: userId });
      const savedJobIds = userSavedJobs.map((sj: any) => sj.job);
      query._id = { $in: savedJobIds };
      if (savedJobIds.length === 0) {
        return res.status(200).json({ success: true, count: 0, totalJobs: 0, totalPages: 0, currentPage: parseInt(page as string), data: [] });
      }
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Execute parallel queries
    const [jobs, totalJobs, savedJobs, applications] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'companyName companyLogo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),

      Job.countDocuments(query),

      userId ? savedJob.find({ jobseeker: userId }) : Promise.resolve([]),

      userId ? Applicant.find({ applicant: userId }) : Promise.resolve([])
    ]);

    // Create lookup maps
    const savedJobIds = savedJobs.map(job => (job as any).job.toString());
    const applicationStatusMap: { [key: string]: string } = {};
    applications.forEach(app => {
      applicationStatusMap[(app as any).job.toString()] = (app as any).status;
    });

    // Enhance jobs with user-specific data
    const enhancedJobs = jobs.map(job => ({
      ...job.toObject(),
      isSaved: savedJobIds.includes((job._id as any).toString()),
      applicationStatus: applicationStatusMap[(job._id as any).toString()] || null,
      hasApplied: (job._id as any).toString() in applicationStatusMap
    }));

    return res.status(200).json({
      success: true,
      count: jobs.length,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: pageNum,
      data: enhancedJobs
    });

  } catch (error: any) {
    console.error('[GetJobs Error]:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getJobMatchScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ success: false, message: "Invalid job ID" });
    }

    // 1. Check for existing cached match
    let match = await JobMatch.findOne({ candidate: user._id, job: id });

    // 2. Determine if recalculation is needed
    const needsRecalculation = !match || (user.updatedAt && new Date(match.profileSnapshotDate) < new Date(user.updatedAt));

    if (needsRecalculation) {
      // Fetch job details for screening
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({ success: false, message: "Job not found" });
      }

      // Perform AI screening
      const aiResponse = await aiService.screenCandidate(user, job);

      // 3. Upsert the match
      if (match) {
        match.score = aiResponse.score || aiResponse.jobMatchScore || 0;
        match.analysis = aiResponse;
        match.profileSnapshotDate = user.updatedAt || new Date();
        await match.save();
      } else {
        match = new JobMatch({
          candidate: user._id,
          job: id,
          score: aiResponse.score || aiResponse.jobMatchScore || 0,
          analysis: aiResponse,
          profileSnapshotDate: user.updatedAt || new Date()
        });
        await match.save();
      }
    }

    if (!match) {
      return res.status(500).json({ success: false, message: "Failed to generate match data" });
    }

    return res.status(200).json({
      success: true,
      data: {
        score: match.score,
        analysis: match.analysis
      }
    });

  } catch (error: any) {
    console.error('[GetJobMatchScore Error]:', error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate job match",
      error: error.message
    });
  }
};