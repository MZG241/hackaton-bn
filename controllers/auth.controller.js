import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../nodemailer/emails.js";
import crypto from 'crypto';
import { generateVerificationCode } from "../utils/codeVerification.js";

dotenv.config()


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
  api_key: process.env.CLOUDINARY_API_KEY,      
  api_secret: process.env.CLOUDINARY_API_SECRET,  
});




export const Register = async (req, res) => {
  try {
    const { fullname, email, role, password, terms } = req.body;

    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required" 
      });
    }

  
    if (!terms) {
      return res.status(400).json({ 
        success: false, 
        message: "You must accept the terms and conditions" 
      });
    }

    
    const isExisting = await User.findOne({ email });
    if (isExisting) {
      return res.status(400).json({ 
        success: false, 
        message: "This email is already taken" 
      });
    }

    
    const authorizedRoles = ["employer", "jobseeker"];
    if (!authorizedRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: "Only employer or jobseeker are authorized as role." 
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

   const verificationCode = generateVerificationCode();

    // Create user
    const user = new User({
      fullname,
      role,
      email,
      verificationCode,
      password: hashedPassword,
      verificationCodeExpireAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await user.save();

    // Generate token payload
    const payload = {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role
    };

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Remove password from response
    user.password = undefined;


     await sendVerificationEmail(user.email, verificationCode);

    return res.status(201).json({
      success: true,
      message: `Dear ${user.fullname} your account has been created successfully`,
      token,
      role: user.role,
      user: payload
    });

  } catch (error) {
    console.log("Error while creating account: ", error);
    res.status(500).json({ 
      success: false,
      message: error.message || "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}




export const verifyEmail = async (req, res) => {
  try {
    const { code:verificationCode , email } = req.body;

  

    if (!verificationCode) {
      return res.status(400).json({ success: false, message: "Verification code is required" });
    }

    if (verificationCode.length !== 6) {
      return res.status(400).json({ success: false, message: "Verification code must be exactly 6 characters" });
    }


    const user = await User.findOne({
      verificationCode,
      email,
      verificationCodeExpireAt: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    user.verificationCode = undefined;
    user.verificationCodeExpireAt = undefined;
    user.isVerified = true;
    await user.save();

    await sendWelcomeEmail(user.email,user.fullname,user.role);

    return res.status(200).json({
      success: true,
      message: "Account actived successfully",
      data: {
        _id: user._id,
        fullname: user.fullname,
        role:user.role,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("ERROR WHILE VERIFYING EMAIL:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying email",
      error: error.message
    });
  }
};





export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required"
      });
    }


    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, we reveal if user doesn't exist
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a new code has been sent"
      });
    }


   
      
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is already actived"
      });
    }  
      

    
    const verificationCode = generateVerificationCode();
    const verificationCodeExpireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    
    user.verificationCode = verificationCode;
    user.verificationCodeExpireAt = verificationCodeExpireAt;
    await user.save();

    
    await sendVerificationEmail(user.email, verificationCode);


    return res.status(200).json({
      success: true,
      message: "New verification code sent to your email ",
      data: {
        email: user.email,
        expiresAt: verificationCodeExpireAt
      }
    });

  } catch (error) {
    console.error("Resend Verification Code Error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: "Failed to resend verification code"
    });
  }
};




// Login Controller
export const Login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }



      
    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: "Account not activated" });
    }  
      
     


    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.SECRET_KEY,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    // Return full user data including profileImage and fullname
    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullname}`,
      data: {
        token,
        user: {
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        }
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};


export const getMe = async(req,res)=>{
try {

const Me = await User.findById(req.user?._id).select("-password");

if(!Me){
return res.status(400).json({success:false,message:"Profile not found"});
}

return res.status(200).json({success:true,data:Me});
    
} catch (error) {
console.log("Error while getting profile : ",error);
res.status(500).json({success:false,message:"Error Internal Server : ",error});    
}
}




export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { 
      fullname, 
      email,
      bio,
      location,
      phone,
      position,
      skills,
      companyName,
      companyDescription
    } = req.body;
    
    const { profileImage, resume, companyLogo } = req.files || {}; 

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updateData = { 
      fullname,
      email,
      bio,
      position,
      location,
      phone,
      skills: skills ? skills : []
    };

    // --- Handle Jobseeker Fields ---
    if (user.role === "jobseeker" && resume) {
      // Delete old resume if exists
      if (user.resume) {
        const publicId = user.resume.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`akazi/resumes/${publicId}`, {
          resource_type: "raw",
        });
      }

      // Upload new resume
      const result = await cloudinary.uploader.upload(resume[0].path, {
        folder: "akazi/resumes",
        resource_type: "raw", // For PDF/DOC files
      });
      updateData.resume = result.secure_url;
    }

    // --- Handle Employer Fields ---
    if (user.role === "employer") {
      updateData.companyName = companyName;
      updateData.companyDescription = companyDescription;

      if (companyLogo) {
        // Delete old logo if exists
        if (user.companyLogo) {
          const publicId = user.companyLogo.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`akazi/logos/${publicId}`);
        }

        // Upload new logo
        const result = await cloudinary.uploader.upload(companyLogo[0].path, {
          folder: "akazi/logos",
        });
        updateData.companyLogo = result.secure_url;
      }
    }

    // --- Handle Profile Image (Common for all roles) ---
    if (profileImage) {
      // Delete old profile image if exists
      if (user.profileImage) {
        const publicId = user.profileImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`akazi/profiles/${publicId}`);
      }

      // Upload new profile image
      const result = await cloudinary.uploader.upload(profileImage[0].path, {
        folder: "akazi/profiles",
      });
      updateData.profileImage = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists in our system, you will receive a password reset link'
      });
    }


    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    
    const resetTokenExpires = Date.now() + 10 * 60 * 1000;


    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiresAt = resetTokenExpires;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await  sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
    }


    return res.status(200).json({
      success: true,
      message: 'If this email exists in our system, you will receive a password reset link',
      // Only include these in development for debugging
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          resetToken,
          resetUrl
        }
      })
    });

  } catch (error) {
    console.error('Password reset error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      code: 'PASSWORD_RESET_ERROR',
      message: 'An error occurred while processing your request'
    });
  }
};




export const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: Date.now() } 
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }

    const isSamePassword = await bcryptjs.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    try {
      await  sendResetSuccessEmail(user.email) 
    } catch (emailError) {
      console.error('Password reset confirmation email failed:', emailError);
    }

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated',
      data: {
        userId: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Password reset error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password'
    });
  }
};

