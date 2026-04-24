import mongoose from "mongoose";


const savedJobSchema = new mongoose.Schema({
jobseeker:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
job:{type:mongoose.Schema.Types.ObjectId,ref:'Job',required:true},
},{
timestamps:true
})

const savedJob = mongoose.model("SavedJobs",savedJobSchema);

export default savedJob;