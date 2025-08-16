import savedJob from "../models/savedjob.model.js";
import Job from "../models/job.model.js";
import mongoose from "mongoose";

export const GetJobSaved = async(req,res)=>{
try {

const userId = req.user?._id;
   
const saved = await savedJob.find({jobseeker:userId})
.populate({
 path: 'job',
 select: 'title description type location isClosed postedBy salaryMin salaryMax',
 populate: {
path: 'postedBy',
select: 'companyName companyLogo companyDescription'
}
}).sort({createdAt:-1});

if(!saved){
return res.status(200).json({success:true,message:"No job saved",data:[]});
}

return res.status(200).json({success:true,data:saved});

} catch (error) {
 console.error("[GetMySavedJobs Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch my saved jobs",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });    
}
}


export const toggleSaveJob = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate job ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid job ID" 
      });
    }

    // Check if job exists first
    const jobExists = await Job.findById(id);
    if (!jobExists) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // Check current save status
    const existingSave = await savedJob.findOne({
      jobseeker: userId,
      job: id
    });

    let action;
    let savedJobData;

    if (existingSave) {
      // Unsave the job
      await savedJob.deleteOne({ _id: existingSave._id });
      action = 'unsaved';
    } else {
      // Save the job
      savedJobData = await savedJob.create({
        jobseeker: userId,
        job: id
      });
      action = 'saved';
    }

    return res.status(200).json({
      success: true,
      action,
      message: `Job ${action} successfully`,
      data: action === 'saved' ? {
        savedAt: savedJobData.createdAt,
        savedJobId: savedJobData._id
      } : null
    });

  } catch (error) {
    console.error("[ToggleSaveJob Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle save status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};