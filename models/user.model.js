import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
fullname:{type:String,required:true},
email:{type:String,required:true,unique:true},
password:{type:String,required:true},
profileImage:{type:String},
position:{type:String},
bio:{type:String},
location:{type:String},
phone:{type:String},
skills:[{type:String}],
role:{type:String,enum:["admin","jobseeker","employer"],default:"jobseeker",required:true},
avatar:{type:String},
resume:{type:String},
isVerified: { type: Boolean, default: false },
resetPasswordToken:String,
resetPasswordExpiresAt:Date,
verificationCode:String,
verificationCodeExpireAt:Date,

//For Employer
companyName:String,
companyDescription:String,
companyLogo:String
},{
timestamps:true
})

const User = mongoose.model("User",userSchema);

export default User;