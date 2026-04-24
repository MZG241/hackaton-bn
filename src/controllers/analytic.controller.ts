import { Request, Response } from "express";
import Applicant from "../models/applicant.model";
import Job from "../models/job.model";
import savedJob from "../models/savedjob.model";
import mongoose from "mongoose";
import User from "../models/user.model";
import ScreeningResult from "../models/screening.model";

export const GetEmployerDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Validate user ID and role
    if (!mongoose.Types.ObjectId.isValid(userId as string) || req.user?.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    // Get all job IDs
    const jobs = await Job.find({ postedBy: userId }).select('_id category');
    const jobIds = jobs.map(job => job._id);

    // Parallel data fetching
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      openedJobsCount,
      closedJobsCount,
      recentApplications,
      acceptedApplicationsCount,
      totalApplicantsCount,
      interviewsCount,
      pipelineStats,
      weeklyApplications,
      highAffinityMatches
    ] = await Promise.all([
      Job.countDocuments({ postedBy: userId, isClosed: false }),
      Job.countDocuments({ postedBy: userId, isClosed: true }),
      Applicant.find({ job: { $in: jobIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'applicant',
          select: 'fullname email profileImage resume',
          match: { _id: { $exists: true } }
        })
        .populate({
          path: 'job',
          select: 'title',
          match: { _id: { $exists: true } }
        }),
      Applicant.countDocuments({
        status: 'Accepted',
        job: { $in: jobIds }
      }),
      Applicant.countDocuments({ job: { $in: jobIds } }),
      Applicant.countDocuments({
        job: { $in: jobIds },
        status: { $in: ['In Review', 'Interviewing', 'Interview'] }
      }),
      // Pipeline Distribution
      Applicant.aggregate([
        { $match: { job: { $in: jobIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      // Weekly Flux (Applications per day)
      Applicant.aggregate([
        { 
          $match: { 
            job: { $in: jobIds },
            createdAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      // High Affinity Matches (Score > 80)
      ScreeningResult.find({ 
        job: { $in: jobIds },
        score: { $gte: 80 }
      })
      .sort({ score: -1 })
      .limit(5)
      .populate('candidate', 'fullname email profileImage')
      .populate('job', 'title')
    ]);

    // Format Weekly Flux for Recharts
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyFlux = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const found = weeklyApplications.find(a => a._id === dateStr);
      return {
        name: dayNames[d.getDay()],
        value: found ? found.count : 0
      };
    });

    // Format Pipeline Distribution
    const pipelineDistribution = pipelineStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { Applied: 0, 'In Review': 0, Rejected: 0, Accepted: 0 });

    // Format Category Distribution
    const categoryCounts = jobs.reduce((acc: any, job: any) => {
      const cat = job.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const categoryDistribution = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Format High Affinity Matches
    const formattedHighAffinity = highAffinityMatches.map((res: any) => ({
      id: res._id,
      name: res.candidate?.fullname || 'Candidate',
      avatar: res.candidate?.profileImage || '',
      jobTitle: res.job?.title || 'Mission',
      score: res.score
    }));

    // Get recent jobs (as before)
    const recentJobs = await Job.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'postedBy',
        select: 'companyName companyLogo',
        match: { _id: { $exists: true } }
      });

    // Calculate match percentage (as before)
    const totalApplications = await Applicant.countDocuments({
      job: { $in: jobIds }
    });
    const matchPercentage = totalApplications > 0
      ? Math.round((acceptedApplicationsCount / totalApplications) * 100)
      : 0;

    // Safely format recent applications
    const formattedRecentApplications = recentApplications
      .filter(app => app.applicant && app.job)
      .map(app => {
        const applicant = app.applicant as any;
        const job = app.job as any;
        return {
          _id: app._id,
          applicantName: applicant?.fullname || 'Deleted User',
          applicantEmail: applicant?.email || '',
          applicantImage: applicant?.profileImage || '',
          applicantResume: applicant?.resume || '',
          jobTitle: job?.title || 'Deleted Job',
          status: app.status,
          appliedAt: (app as any).createdAt
        };
      });

    // Safely format recent jobs
    const formattedRecentJobs = await Promise.all(recentJobs
      .filter(job => job.postedBy)
      .map(async job => {
        const postedBy = job.postedBy as any;
        const applicantsCount = await Applicant.countDocuments({ job: job._id });
        return {
          _id: job._id,
          title: job.title,
          type: job.type,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          companyLogo: postedBy?.companyLogo || '',
          postedAt: (job as any).createdAt,
          isClosed: job.isClosed,
          applicantsCount
        };
      }));

    return res.status(200).json({
      success: true,
      data: {
        jobStats: {
          opened: openedJobsCount,
          closed: closedJobsCount,
          total: openedJobsCount + closedJobsCount,
          total_applicants: totalApplicantsCount,
          interviews: interviewsCount
        },
        matchPercentage,
        weeklyFlux,
        pipelineDistribution,
        categoryDistribution,
        highAffinityMatches: formattedHighAffinity,
        recentApplications: formattedRecentApplications,
        recentJobs: formattedRecentJobs
      }
    });

  } catch (error: any) {
    console.error("[GetEmployerDashboard Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const GetJobSeekerDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    // Get all data in parallel for better performance
    const [
      appliedJobsCount,
      savedJobsCount,
      acceptedOffersCount,
      recentApplications,
      recommendedJobs,
      savedJobsData
    ] = await Promise.all([
      Applicant.countDocuments({ applicant: userId }),
      savedJob.countDocuments({ jobseeker: userId }),
      Applicant.countDocuments({ applicant: userId, status: 'Accepted' }),
      Applicant.find({ applicant: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'job',
          select: 'title postedBy salaryMin salaryMax',
          populate: {
            path: 'postedBy',
            select: 'companyName'
          }
        }),
      Job.find({ isClosed: false })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('postedBy', 'companyName companyLogo companyLocation'),
      savedJob.find({ jobseeker: userId })
    ]);

    // Calculate application status distribution
    const applicationStats = await Applicant.aggregate([
      { $match: { applicant: new mongoose.Types.ObjectId(userId as string) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert stats to object format
    const statusCounts = applicationStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { Applied: 0, 'In Review': 0, Rejected: 0, Accepted: 0 });

    const savedJobIds = (savedJobsData || []).map((sj: any) => sj.job.toString());

    // Format recommended jobs
    const formattedRecommendedJobs = recommendedJobs.map(job => {
      const postedBy = job.postedBy as any;
      return {
        id: job._id,
        title: job.title,
        company: postedBy?.companyName,
        logo: postedBy?.companyLogo,
        location: job.location || postedBy?.companyLocation,
        salaryRange: {
          min: job.salaryMin,
          max: job.salaryMax
        },
        skillsRequired: (job as any).skillsRequired || [],
        type: job.type,
        postedAt: (job as any).createdAt,
        isSaved: savedJobIds.includes((job as any)._id.toString())
      };
    });

    // Format recent applications
    const formattedRecentApplications = recentApplications.map(app => {
      const job = app.job as any;
      const employer = job?.postedBy as any;
      return {
        id: app._id,
        jobTitle: job?.title,
        company: employer?.companyName || 'Akazi Partner',
        salaryRange: {
          min: job?.salaryMin,
          max: job?.salaryMax
        },
        status: app.status,
        appliedAt: (app as any).createdAt
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        applicationStats: {
          total: appliedJobsCount,
          byStatus: statusCounts,
          acceptedOffers: acceptedOffersCount
        },
        savedJobsCount,
        recentApplications: formattedRecentApplications,
        recommendedJobs: formattedRecommendedJobs
      }
    });

  } catch (error: any) {
    console.error("[GetJobSeekerDashboard Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const GetAdminDashboard = async (req: Request, res: Response) => {
  try {
    // Count documents
    const employers = await User.countDocuments({ role: 'employer' });
    const jobseekers = await User.countDocuments({ role: 'jobseeker' });
    const jobOpened = await Job.countDocuments({ isClosed: false });
    const jobClosed = await Job.countDocuments({ isClosed: true });
    const totalApplications = await Applicant.countDocuments();

    // Get count for each application status
    const statusCounts = await Applicant.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate percentages for each status
    const statusPercentages: any = {};
    statusCounts.forEach(status => {
      statusPercentages[status._id] = {
        count: status.count,
        percentage: Math.round((status.count / totalApplications) * 100)
      };
    });

    // Ensure all statuses are represented even if count is 0
    const allStatuses = ['Applied', 'In Review', 'Rejected', 'Accepted'];
    allStatuses.forEach(status => {
      if (!statusPercentages[status]) {
        statusPercentages[status] = {
          count: 0,
          percentage: 0
        };
      }
    });

    // Get recent job seekers (last 5 registered)
    const recentJobSeekers = await User.find({ role: 'jobseeker' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id fullname email profileImage createdAt')
      .lean();

    // Get recent employers (last 5 registered)
    const recentEmployers = await User.find({ role: 'employer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id companyName email companyLogo createdAt')
      .lean();

    // AI Specific Metrics
    const [aiJobsCount, aiScreenedAppsCount] = await Promise.all([
      Job.countDocuments({ aiAnalysis: { $exists: true } }),
      Applicant.countDocuments({ aiScreening: { $exists: true } })
    ]);

    // Average AI Score
    const avgScoreResult = await Applicant.aggregate([
      { $match: { "aiScreening.score": { $exists: true } } },
      { $group: { _id: null, avg: { $avg: "$aiScreening.score" } } }
    ]);
    const averageAiScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg) : 0;

    // Top Skills in Demand (Aggregated from all jobs)
    const topSkills = await Job.aggregate([
      { $unwind: "$skillsRequired" },
      { $group: { _id: "$skillsRequired", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const information = {
      jobClosed,
      jobOpened,
      jobseekers,
      employers,
      aiMetrics: {
        aiJobsCount,
        aiScreenedAppsCount,
        averageAiScore,
        topSkills: topSkills.map(s => ({ name: s._id, count: s.count }))
      },
      applications: {
        total: totalApplications,
        statuses: statusPercentages
      },
      recentJobSeekers: recentJobSeekers.map((user: any) => ({
        id: user._id,
        name: user.fullname,
        email: user.email,
        avatar: user.profileImage,
        createdAt: user.createdAt
      })),
      recentEmployers: recentEmployers.map((employer: any) => ({
        id: employer._id,
        name: employer.companyName,
        email: employer.email,
        logo: employer.companyLogo,
        createdAt: employer.createdAt
      })),
    };

    return res.status(200).json({ success: true, data: information });

  } catch (error: any) {
    console.error("[GetAdminDashboard Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};