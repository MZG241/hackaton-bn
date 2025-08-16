import express from "express";
import { forgotPassword, getMe, Login, Register, resendVerificationCode, resetPassword, updateProfile, verifyEmail } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const authRoute = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Improved Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif","image/avif"];
  const allowedDocTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (file.fieldname === "profileImage" || file.fieldname === "companyLogo") {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
  } else if (file.fieldname === "resume") {
    if (allowedDocTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
  }
  
  cb(new Error("Invalid file type"), false);
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Enhanced role-based upload middleware
const roleBasedUpload = (req, res, next) => {
  try {
    let fields = [{ name: "profileImage", maxCount: 1 }];

    if (req.user?.role === "jobseeker") {
      fields.push({ name: "resume", maxCount: 1 });
    } else if (req.user?.role === "employer") {
      fields.push({ name: "companyLogo", maxCount: 1 });
    }

    return upload.fields(fields)(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "File too large (max 5MB)" });
        }
        if (err.message === "Invalid file type") {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: "File upload failed" });
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Cleanup uploaded files after response
const cleanupFiles = (req, res, next) => {
  res.on("finish", () => {
    if (req.files) {
      Object.values(req.files).forEach(files => {
        files.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error("Error deleting temp file:", err);
          }
        });
      });
    }
  });
  next();
};


// Routes
authRoute.post("/create-account", Register);
authRoute.post("/login", Login);
authRoute.post('/verify', verifyEmail);
authRoute.post('/resend-code', resendVerificationCode);
authRoute.post('/forgot-password', forgotPassword);
authRoute.post('/reset-password/:resetToken', resetPassword);
authRoute.get("/profile", authenticateToken, getMe);
authRoute.patch(
  "/edit/profile",
  authenticateToken,
  roleBasedUpload,
  cleanupFiles,
  updateProfile
);

export default authRoute;