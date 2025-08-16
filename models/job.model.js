import mongoose from "mongoose";


const jobSchema = new mongoose.Schema({
title:{type:String,required:true},
description:{type:String,required:true},
requirements:[{type:String}],
location:{type:String},
category:{type:String},
type:{
type:String,enum:['full-time','part-time',
'contract','internship','remote','hybrid'],
default:'full-time',
required:true
},
postedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
salaryMin:{type:Number},
salaryMax:{type:Number},
isClosed:{type:Boolean,default:false}
},{
timestamps:true
})

const Job = mongoose.model("Job",jobSchema);

export default Job;