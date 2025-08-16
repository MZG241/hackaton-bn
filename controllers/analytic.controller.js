import Applicant from "../models/applicant.model.js";
import Job from "../models/job.model.js";
import savedJob from "../models/savedjob.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";


export const GetEmployerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Validate user ID and role
    if (!mongoose.Types.ObjectId.isValid(userId) || req.user.role !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    // Get all job IDs
    const jobs = await Job.find({ postedBy: userId }).select('_id');
    const jobIds = jobs.map(job => job._id);

    // Parallel data fetching with null checks
    const [
      openedJobsCount,
      closedJobsCount,
      recentApplications,
      acceptedApplicationsCount
    ] = await Promise.all([
      Job.countDocuments({ postedBy: userId, isClosed: false }),
      Job.countDocuments({ postedBy: userId, isClosed: true }),
      Applicant.find({ job: { $in: jobIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate({
          path: 'applicant',
          select: 'fullname email profileImage',
          match: { _id: { $exists: true }} // Ensure applicant exists
  })
        .populate({
          path: 'job',
          select: 'title',
          match: { _id: { $exists: true } // Ensure job exists
        }}),
      Applicant.countDocuments({ 
        status: 'Accepted',
        job: { $in: jobIds }
      })
    ]);
  

    // Get recent jobs with null checks
    const recentJobs = await Job.find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'postedBy',
        select: 'companyName companyLogo',
        match: { _id: { $exists: true }}
      });

    // Calculate match percentage
    const totalApplications = await Applicant.countDocuments({
      job: { $in: jobIds }
    });
    const matchPercentage = totalApplications > 0 
      ? Math.round((acceptedApplicationsCount / totalApplications) * 100)
      : 0;

    // Safely format recent applications
    const formattedRecentApplications = recentApplications
      .filter(app => app.applicant && app.job) // Filter out null references
      .map(app => ({
        id: app._id,
        applicantName: app.applicant?.fullname || 'Deleted User',
        applicantEmail: app.applicant?.email || '',
        applicantImage: app.applicant?.profileImage || '',
        jobTitle: app.job?.title || 'Deleted Job',
        status: app.status,
        appliedAt: app.createdAt
      }));

    // Safely format recent jobs
    const formattedRecentJobs = recentJobs
      .filter(job => job.postedBy) // Filter out null references
      .map(job => ({
        id: job._id,
        title: job.title,
        companyLogo: job.postedBy?.companyLogo || '',
        postedAt: job.createdAt,
        isClosed: job.isClosed
      }));

    return res.status(200).json({
      success: true,
      data: {
        jobStats: {
          opened: openedJobsCount,
          closed: closedJobsCount,
          total: openedJobsCount + closedJobsCount
        },
        matchPercentage,
        recentApplications: formattedRecentApplications,
        recentJobs: formattedRecentJobs
      }
    });

  } catch (error) {
    console.error("[GetEmployerDashboard Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const GetJobSeekerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all data in parallel for better performance
    const [
      appliedJobsCount,
      savedJobsCount,
      acceptedOffersCount,
      recentApplications,
      recommendedJobs
    ] = await Promise.all([
      Applicant.countDocuments({ applicant: userId }),
      savedJob.countDocuments({ jobseeker: userId }),
      Applicant.countDocuments({ applicant: userId, status: 'Accepted' }),
      Applicant.find({ applicant: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('job', 'title company salaryMin salaryMax'),
      Job.find({ isClosed: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('postedBy', 'companyName companyLogo')
    ]);

    // Calculate application status distribution
    const applicationStats = await Applicant.aggregate([
      { $match: { applicant: new mongoose.Types.ObjectId(userId) } },
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

    // Format recommended jobs
    const formattedRecommendedJobs = recommendedJobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.postedBy.companyName,
      logo: job.postedBy.companyLogo,
      salaryRange: {
        min: job.salaryMin,
        max: job.salaryMax
      },
      postedAt: job.createdAt
    }));

    // Format recent applications
    const formattedRecentApplications = recentApplications.map(app => ({
      id: app._id,
      jobTitle: app.job.title,
      company: app.job.postedBy?.companyName || 'Unknown',
      salaryRange: {
        min: app.job.salaryMin,
        max: app.job.salaryMax
      },
      status: app.status,
      appliedAt: app.createdAt
    }));

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

  } catch (error) {
    console.error("[GetJobSeekerDashboard Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const GetAdminDashboard = async (req, res) => {
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
    const statusPercentages = {};
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

  

   

    const information = {
      jobClosed,
      jobOpened,
      jobseekers,
      employers,
      applications: {
        total: totalApplications,
        statuses: statusPercentages
      },
      recentJobSeekers: recentJobSeekers.map(user => ({
        id: user._id,
        name: user.fullname,
        email: user.email,
        avatar: user.profileImage,
        createdAt: user.createdAt
      })),
      recentEmployers: recentEmployers.map(employer => ({
        id: employer._id,
        name: employer.companyName,
        email: employer.email,
        logo: employer.companyLogo,
        createdAt: employer.createdAt
      })),
    };

    return res.status(200).json({ success: true, data: information });

  } catch (error) {
    console.error("[GetAdminDashboard Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};