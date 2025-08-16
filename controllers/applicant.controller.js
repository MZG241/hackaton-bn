import Applicant from "../models/applicant.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";


export const applyJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

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
    });

    // 5. Return success response
    return res.status(201).json({
      success: true,
      message: `Application for the position of ${job.title} submitted successfully`,
      data: {
        applicationId: application._id,
        jobTitle: job.title,
        company: job.postedBy.companyName,
        appliedAt: application.createdAt
      }
    });

  } catch (error) {
    console.error("[ApplyJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user._id;

    const applications = await Applicant.find({ applicant: userId })
      .populate({
        path: 'job',
        select: 'title description type location isClosed postedBy salaryMin salaryMax',
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

    // Format response - status is now guaranteed by schema
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      status: app.status, 
      appliedAt: app.createdAt,
      updatedAt: app.updatedAt,
      job: {
        _id: app.job._id,
        title: app.job.title,
        type: app.job.type,
        location: app.job.location,
        isClosed: app.job.isClosed,
        salaryRange: {
          min: app.job.salaryMin,
          max: app.job.salaryMax
        },
        company: {
          name: app.job.postedBy.companyName,
          logo: app.job.postedBy.companyLogo,
          description: app.job.postedBy.companyDescription
        }
      }
    }));

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: formattedApplications
    });

  } catch (error) {
    console.error("[GetMyApplications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getApplicantsByJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Verify job exists and user is owner, including the title
    const job = await Job.findOne({ 
      _id: id,
      postedBy: userId 
    }).select('title category location type'); // Select only the title field

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or not authorized"
      });
    }

    // Get applicants with user details
    const applicants = await Applicant.find({ job: id })
      .populate('applicant', 'fullname email profileImage resume')
      .sort({ createdAt: -1 });

    // Format response including job title in both places
    const response = {
      success: true,
      count: applicants.length,
      job: {
        _id: id,
        title: job.title,
        category:job.category,
        location:job.location,
        type:job.type
      },
      applicants: applicants.map(app => ({
        _id: app._id,
        status: app.status,
        appliedAt: app.createdAt,
        jobTitle: job.title, // Included in each applicant object
        user: {
          _id: app.applicant._id,
          name: app.applicant.fullname,
          email: app.applicant.email,
          profileImage: app.applicant.profileImage,
          resume: app.applicant.resume
        }
      }))
    };

    return res.status(200).json({success:true,data:response});

  } catch (error) {
    console.error("[GetApplicantsByJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applicants",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateApplicantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

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

    return res.status(200).json({
      success: true,
      message: "Application status updated",
      data: {
        _id: updatedApplication._id,
        status: updatedApplication.status,
        appliedAt: updatedApplication.createdAt,
        applicant: {
          _id: updatedApplication.applicant._id,
          name: updatedApplication.applicant.fullname,
          email: updatedApplication.applicant.email,
          profileImage: updatedApplication.applicant.profileImage,
          resume: updatedApplication.applicant.resume
        },
        jobId: application.job._id
      }
    });

  } catch (error) {
    console.error("[UpdateApplicantStatus Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};