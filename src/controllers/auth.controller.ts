import { Request, Response } from "express";
import User from "../models/user.model";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { 
  sendPasswordResetEmail, 
  sendResetSuccessEmail, 
  sendVerificationEmail, 
  sendWelcomeEmail,
  sendEmailChangeCodeOld,
  sendEmailChangeCodeNew
} from "../nodemailer/emails";
import crypto from 'crypto';
import { generateVerificationCode } from "../utils/codeVerification";
import fs from "fs";

export const uploadAsset = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const { path, mimetype } = req.file;
    const isImage = mimetype.startsWith("image/");
    const folder = isImage ? "akazi/portfolio" : "akazi/documents";

    const uploadOptions: any = {
      folder,
      resource_type: isImage ? "image" : "raw",
    };

    const result = await cloudinary.uploader.upload(path, uploadOptions);

    // Clean up temporary file
    try {
      fs.unlinkSync(path);
    } catch (err) {
      console.error("[UPLOAD_ASSET] Error deleting temp file:", err);
    }

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error("[UPLOAD_ASSET] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload asset",
    });
  }
};

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const Register = async (req: Request, res: Response) => {
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
      process.env.SECRET_KEY as string,
      { expiresIn: '24h' }
    );

    // Remove password from response
    (user as any).password = undefined;

    await sendVerificationEmail(user.email, verificationCode);

    return res.status(201).json({
      success: true,
      message: `Dear ${user.fullname} your account has been created successfully`,
      token,
      role: user.role,
      user: payload
    });

  } catch (error: any) {
    console.log("Error while creating account: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}




export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { code: verificationCode, email } = req.body;

    if (!verificationCode) {
      return res.status(400).json({ success: false, message: "Verification code is required" });
    }

    if (verificationCode.length !== 6) {
      return res.status(400).json({ success: false, message: "Verification code must be exactly 6 characters" });
    }

    const user = await User.findOne({
      verificationCode,
      email,
      verificationCodeExpireAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    user.verificationCode = undefined;
    user.verificationCodeExpireAt = undefined;
    user.isVerified = true;
    await user.save();

    await sendWelcomeEmail(user.email, user.fullname, user.role);

    return res.status(200).json({
      success: true,
      message: "Account activated successfully",
      data: {
        _id: user._id,
        fullname: user.fullname,
        role: user.role,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error: any) {
    console.error("ERROR WHILE VERIFYING EMAIL:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying email",
      error: error.message
    });
  }
};





export const resendVerificationCode = async (req: Request, res: Response) => {
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
        message: "Account is already activated"
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

  } catch (error: any) {
    console.error("Resend Verification Code Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resend verification code"
    });
  }
};




// Login Controller
export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    console.log("[LOGIN] Authenticating:", email);
    
    const user = await User.findOne({ email }).select('+password');
    console.log("[LOGIN] User found:", !!user);

    if (!user || !user.password) {
      console.log("[LOGIN] User search failed or password missing");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log("[LOGIN] Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!user.isVerified) {
      console.log("[LOGIN] User not verified:", email);
      return res.status(400).json({ success: false, message: "Account not activated" });
    }

    console.log("[LOGIN] Generating token for user ID:", user._id, "Role:", user.role);

    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        throw new Error("SECRET_KEY is missing from environment variables");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      secretKey as string,
      { expiresIn: rememberMe ? '7d' : '24h' }
    );

    console.log("[LOGIN] Success. Sending response.");

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

  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const getMe = async (req: Request, res: Response) => {
  try {

    const Me = await User.findById(req.user?._id).select("-password");

    if (!Me) {
      return res.status(400).json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({ success: true, data: Me });

  } catch (error: any) {
    console.log("Error while getting profile : ", error);
    res.status(500).json({ success: false, message: "Error Internal Server", error: error.message });
  }
}




export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      fullname,
      bio,
      headline,
      location,
      phone,
      position,
      skills,
      languages,
      companyName,
      companyDescription,
      companyPhone,
      companyLocation,
      experience,
      education,
      certifications,
      projects,
      availability,
      socialLinks,
      phoneNumber
    } = req.body;

    console.log("[UPDATE_PROFILE] Body:", req.body);
    console.log("[UPDATE_PROFILE] Files:", req.files);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const { profileImage, resume, companyLogo } = files || {};

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Note: 'email' is intentionally excluded from updateData.
    // Email changes must go through the dedicated /auth/change-email flow.
    const updateData: any = {
      fullname,
      bio,
      headline,
      position,
      location,
      phone: phone || phoneNumber,
    };

    // --- Parse JSON array fields helper ---
    const parseJSONArray = (val: any, fieldName: string) => {
      if (!val) return undefined;
      try {
        const parsed = typeof val === 'string' ? JSON.parse(val) : val;
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error(`[UPDATE_PROFILE] Error parsing ${fieldName}:`, e);
        return undefined;
      }
    };

    // Skills — support both plain strings (legacy) and structured objects
    if (skills) {
      const parsed = parseJSONArray(skills, 'skills');
      if (parsed) {
        // Normalize: if plain string array, convert to skill objects
        updateData.skills = parsed.map((s: any) =>
          typeof s === 'string' ? { name: s, level: 'Intermediate' } : s
        );
      }
    }

    const parsedLanguages = parseJSONArray(languages, 'languages');
    if (parsedLanguages) updateData.languages = parsedLanguages;

    const parsedExperience = parseJSONArray(experience, 'experience');
    if (parsedExperience) updateData.experience = parsedExperience;

    const parsedEducation = parseJSONArray(education, 'education');
    if (parsedEducation) updateData.education = parsedEducation;

    const parsedCertifications = parseJSONArray(certifications, 'certifications');
    if (parsedCertifications) updateData.certifications = parsedCertifications;

    const parsedProjects = parseJSONArray(projects, 'projects');
    if (parsedProjects) updateData.projects = parsedProjects;

    // Availability — object (not array)
    if (availability) {
      try {
        updateData.availability = typeof availability === 'string' ? JSON.parse(availability) : availability;
      } catch (e) {
        console.error('[UPDATE_PROFILE] Error parsing availability:', e);
      }
    }

    // Social Links — object (not array)
    if (socialLinks) {
      try {
        updateData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      } catch (e) {
        console.error('[UPDATE_PROFILE] Error parsing socialLinks:', e);
      }
    }

    // --- Handle Jobseeker Fields ---
    if (user.role === "jobseeker" && resume) {
      // Delete old resume if exists
      if (user.resume) {
        const publicId = user.resume.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`akazi/resumes/${publicId}`, {
            resource_type: "raw",
          });
        }
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
      updateData.companyPhone = companyPhone;
      updateData.companyLocation = companyLocation;

      if (companyLogo) {
        // Delete old logo if exists
        if (user.companyLogo) {
          const publicId = user.companyLogo.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`akazi/logos/${publicId}`);
          }
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
        const publicId = user.profileImage.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`akazi/profiles/${publicId}`);
        }
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

  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const forgotPassword = async (req: Request, res: Response) => {
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


    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);


    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiresAt = resetTokenExpires;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
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

  } catch (error: any) {
    console.error('Password reset error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
};




export const resetPassword = async (req: Request, res: Response) => {
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
      .update(resetToken as string)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() }
    }).select('+password');

    if (!user || !user.password) {
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
      await sendResetSuccessEmail(user.email, user.fullname)
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

  } catch (error: any) {
    console.error('Password reset error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password'
    });
  }
};


// Change Password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    user.password = await bcryptjs.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request Email Change (Phase 1: Old Email)
export const requestEmailChange = async (req: Request, res: Response) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "This email is already associated with another account" });
    }

    const codeOld = generateVerificationCode();
    user.newEmailPending = newEmail;
    user.emailChangeCodeOld = codeOld;
    await user.save();

    await sendEmailChangeCodeOld(user.email, codeOld);

    res.status(200).json({ success: true, message: "Verification code sent to your current email" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm Email Change (Phase 2: Old Code)
export const confirmEmailOld = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user || user.emailChangeCodeOld !== code) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    const codeNew = generateVerificationCode();
    user.emailChangeCodeOld = undefined;
    user.emailChangeCodeNew = codeNew;
    await user.save();

    if (user.newEmailPending) {
        await sendEmailChangeCodeNew(user.newEmailPending, codeNew);
    }

    res.status(200).json({ success: true, message: "Code verified. Now check your new email for a final verification code." });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Email Change (Phase 3: New Code & Finalize)
export const verifyEmailNew = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user?._id;

    const user = await User.findById(userId);
    if (!user || user.emailChangeCodeNew !== code) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    if (user.newEmailPending) {
        user.email = user.newEmailPending;
    }
    user.newEmailPending = undefined;
    user.emailChangeCodeNew = undefined;
    await user.save();

    res.status(200).json({ 
        success: true, 
        message: "Email updated successfully",
        data: { email: user.email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
