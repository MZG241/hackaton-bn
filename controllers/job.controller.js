import Job from "../models/job.model.js";
import Applicant from "../models/applicant.model.js";
import savedJob from "../models/savedjob.model.js";
import mongoose from "mongoose";

export const createJob = async(req,res)=>{
try {

const postedBy = req.user?._id;

const {title,description,type,category,location,salaryMin,salaryMax,requirements} = req.body;

if(!title || !description || !type ||!location || !category ){
return res.status(400).json({success:false,message:"Title,description,type,location,category fields are required"});
}

if (salaryMin && salaryMax && salaryMin > salaryMax) {
return res.status(400).json({
success: false,
 message: "Minimum salary cannot be greater than maximum salary"
});
}


const allowedType = ['full-time','part-time',
'contract','internship','remote','hybrid'];

if(!allowedType.includes(type)){
return res.status(400).json({success:false,message:"Job type is not allowed"});
}

const job = new Job({
title,description,type,
location,category,
requirements,
salaryMin: salaryMin || null,
salaryMax: salaryMax || null,
postedBy
})

await job.save();

return res.status(201).json({success:true,message:`Job posted successfully`,data:job});

} catch (error) {
 console.log("Error while posting job : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});     
}
}


export const getSingleJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid job ID" 
      });
    }

    // Parallel database queries
    const [job, applicantCount, userApplication] = await Promise.all([
      Job.findById(id).populate('postedBy', 'companyName companyDescription companyLogo'),
      Applicant.countDocuments({ job: id }),
      userId ? Applicant.findOne({ job: id, applicant: userId }) : null
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

  } catch (error) {
    console.error("[GetSingleJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job details",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const getAllJobs = async(req,res)=>{
try {
const jobs = await Job.find({isClosed:false}).populate('postedBy','companyName companyLogo companyDescription').sort({createdAt:-1});

if(!jobs || jobs.length === 0){
return res.status(200).json({success:true,message:"No job posted",data:[]});
}

return res.status(200).json({success:true,data:jobs});

} catch (error) {
 console.log("Error while getting all jobs : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});    
}
}


export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    // Validate job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Authorization check
    if (!job.postedBy.equals(userId) && req.user.role !== 'admin') {
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

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('postedBy', 'companyName companyLogo');

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob
    });

  } catch (error) {
    console.error("[UpdateJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};


export const deleteJob = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const userId = req.user._id;

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
    if (!job.postedBy.equals(userId) && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this job"
      });
    }

    await savedJob.deleteMany({ job: id }).session(session);

    // 3. Delete all related applicants in single transaction
    await Applicant.deleteMany({ job: id }).session(session);
    
    // 4. Delete the job itself
    await Job.deleteOne({ _id: id }).session(session);

    // 5. Commit the transaction
    await session.commitTransaction();
    
    return res.status(200).json({ 
      success: true, 
      message: "Job and all associated applications deleted successfully" 
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("[DeleteJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete job"
    });
  } finally {
    session.endSession();
  }
};

export const getMyJobs = async (req, res) => {
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
    const jobIds = jobs.map(job => job._id);
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
    const applicantCountMap = {};
    applicantCounts.forEach(item => {
      applicantCountMap[item._id.toString()] = item.count;
    });

    // 5. Enhance jobs with applicant count
    const jobsWithApplicantCounts = jobs.map(job => ({
      ...job.toObject(),
      applicantCount: applicantCountMap[job._id.toString()] || 0
    }));

    return res.status(200).json({
      success: true,
      data: jobsWithApplicantCounts
    });

  } catch (error) {
    console.error("Error while getting my jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    //Verify job exists
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    //Authorization check (owner or admin)
    if (!job.postedBy.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this job"
      });
    }

    //Toggle the status
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { isClosed: !job.isClosed }, 
      { new: true, runValidators: true }
    ).populate('postedBy', 'companyName companyLogo');

    //Determine status message
    const statusMessage = updatedJob.isClosed 
      ? "Job closed successfully" 
      : "Job reopened successfully";

    return res.status(200).json({
      success: true,
      message: statusMessage,
      data: updatedJob
    });

  } catch (error) {
    console.error("[ToggleJobStatus Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle job status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};



export const getJobs = async (req, res) => {
  try {
    const { keyword, category, type, location, page = 1, limit = 10 } = req.query;
    const userId = req.user?._id; 

    // Build the query object
    const query = { isClosed: false };

    // Text search (requires text index in schema)
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Exact match filters
    if (category) query.category = category;
    if (type) query.type = type;
    
    // Partial match filters (case-insensitive)
    if (location) query.location = { $regex: location, $options: 'i' };

    // Pagination
    const skip = (page - 1) * limit;

    // Execute parallel queries
    const [jobs, totalJobs, savedJobs, applications] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'companyName companyLogo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      
      Job.countDocuments(query),
      
      userId ? savedJob.find({ jobseeker: userId }) : Promise.resolve([]),
      
      userId ? Applicant.find({ applicant: userId }) : Promise.resolve([])
    ]);

    // Create lookup maps
    const savedJobIds = savedJobs.map(job => job.job.toString());
    const applicationStatusMap = {};
    applications.forEach(app => {
      applicationStatusMap[app.job.toString()] = app.status;
    });

    // Enhance jobs with user-specific data
    const enhancedJobs = jobs.map(job => ({
      ...job.toObject(),
      isSaved: savedJobIds.includes(job._id.toString()),
      applicationStatus: applicationStatusMap[job._id.toString()] || null,
      hasApplied: job._id.toString() in applicationStatusMap
    }));

    return res.status(200).json({
      success: true,
      count: jobs.length,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: parseInt(page),
      data: enhancedJobs
    });

  } catch (error) {
    console.error('[GetJobs Error]:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};