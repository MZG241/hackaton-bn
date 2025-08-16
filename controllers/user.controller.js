import Job from "../models/job.model.js";
import User from "../models/user.model.js";


export const getUserProfile = async(req,res)=>{

try {
 
const {id} = req.params;

const user = await User.findById(id).select('-password');

if(!user){
return res.status(404).json({success:false,message:"User profile not found"})
}

return res.status(200).json({success:true,data:user});
    
} catch (error) {
 console.log("Error while getting user profile : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});         
}
}



export const getJobSeeker = async(req,res)=>{
try {
const jobseekers = await User.find({role:"jobseeker"}).sort({created:-1});

if(jobseekers.length === 0){
return res.status(200).json({success:true,message:"No jobseeker found"});
}

return res.status(200).json({success:true,data:jobseekers});
} catch (error) {
 console.log("Error while getting jobseekers : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});         
}
}




export const getEmployer = async(req,res)=>{
try {

const employers = await User.find({role:"employer"}).sort({created:-1});

if(employers.length === 0){
return res.status(200).json({success:true,message:"No employers found"});
}

return res.status(200).json({success:true,data:employers});
} catch (error) {
 console.log("Error while getting employers : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});         
}
}



export const getJobs = async(req,res)=>{
try {

const jobs = await Job.find({}).sort({created:-1}).populate('postedBy','companyName companyLogo fullname');

if(jobs.length === 0){
return res.status(200).json({success:true,message:"No jobs found"});
}

return res.status(200).json({success:true,data:jobs});
} catch (error) {
 console.log("Error while getting jobs : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});         
}
}


export const getCompanyJob = async(req,res)=>{
try {
const {id} = req.params;

const jobs = await Job.find({postedBy:id}).sort({created:-1}).populate('postedBy','companyName companyDescription companyLogo');

if(jobs.length === 0){
return res.status(200).json({success:true,message:"No jobs found"});
}


return res.status(200).json({success:true,data:jobs});

} catch (error) {
  console.log("Error while getting jobs by company : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});      
}
}