import express from "express";
import { 
  changePassword,
  confirmEmailOld,
  forgotPassword, 
  getMe, 
  Login, 
  Register, 
  requestEmailChange,
  resendVerificationCode, 
  resetPassword, 
  updateProfile, 
  uploadAsset,
  verifyEmail, 
  verifyEmailNew
} from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import multer from "multer";
import fs from "fs";
import path from "path";

const authRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Security and identity management protocols
 */

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Improved Multer configuration
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/avif"];
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

const roleBasedUpload = (req: any, res: any, next: any) => {
  try {
    let fields = [{ name: "profileImage", maxCount: 1 }];

    if (req.user?.role === "jobseeker") {
      fields.push({ name: "resume", maxCount: 1 });
    } else if (req.user?.role === "employer") {
      fields.push({ name: "companyLogo", maxCount: 1 });
    }

    return upload.fields(fields)(req, res, (err: any) => {
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

const cleanupFiles = (req: any, res: any, next: any) => {
  res.on("finish", () => {
    if (req.files) {
      Object.values(req.files).forEach((files: any) => {
        files.forEach((file: any) => {
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

/**
 * @swagger
 * /api/auth/create-account:
 *   post:
 *     summary: Register a new talent or employer node
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullname, email, password, role]
 *             properties:
 *               fullname: { type: string, example: "John Doe" }
 *               email: { type: string, format: email, example: "john@nexus.com" }
 *               password: { type: string, format: password, example: "Secret123!" }
 *               role: { type: string, enum: [jobseeker, employer], example: "jobseeker" }
 *     responses:
 *       201:
 *         description: Node registered. Verification code dispatched.
 *       400:
 *         description: Email already synchronized or invalid parameters.
 */
authRoute.post("/create-account", Register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Initialize session and retrieve access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "john@nexus.com" }
 *               password: { type: string, format: password, example: "Secret123!" }
 *     responses:
 *       200:
 *         description: Session established.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 token: { type: string }
 *                 user: { type: object }
 *       401:
 *         description: Authentication failed.
 */
authRoute.post("/login", Login);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify email using 6-digit synchronization code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 */
authRoute.post('/verify', verifyEmail);

/**
 * @swagger
 * /api/auth/resend-code:
 *   post:
 *     summary: Dispatch a new synchronization code to email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: "user@nexus.com" }
 *     responses:
 *       200: { description: Code dispatched }
 *       400: { description: Invalid email or already verified }
 */
authRoute.post('/resend-code', resendVerificationCode);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a reset token via email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: "user@nexus.com" }
 *     responses:
 *       200: { description: Reset token dispatched }
 *       404: { description: User not found }
 */
authRoute.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{resetToken}:
 *   post:
 *     summary: Update password using reset token
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, example: "NewSecret123!" }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
authRoute.post('/reset-password/:resetToken', resetPassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get high-level profile of authenticated node
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
authRoute.get("/profile", authenticateToken, getMe as any);

/**
 * @swagger
 * /api/auth/edit/profile:
 *   patch:
 *     summary: Update node profile and upload assets (Avatar, Resume, Logo)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullname: { type: string }
 *               bio: { type: string }
 *               location: { type: string }
 *               profileImage: { type: string, format: binary }
 *               resume: { type: string, format: binary }
 *               companyLogo: { type: string, format: binary }
 */
authRoute.patch("/edit/profile", authenticateToken, roleBasedUpload as any, cleanupFiles as any, updateProfile as any);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Rotate session credentials (Security Protocol)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200: { description: Password rotated successfully }
 *       401: { description: Invalid current credentials }
 */
authRoute.patch("/change-password", authenticateToken, changePassword as any);

/**
 * @swagger
 * /api/auth/request-email-change:
 *   post:
 *     summary: Initialize email rotation protocol
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newEmail]
 *             properties:
 *               newEmail: { type: string, format: email }
 */
authRoute.post("/request-email-change", authenticateToken, requestEmailChange as any);

/**
 * @swagger
 * /api/auth/confirm-email-old:
 *   post:
 *     summary: Step 1 of email rotation - Verify old email access
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Code verified }
 *       400: { description: Invalid code }
 */
authRoute.post("/confirm-email-old", authenticateToken, confirmEmailOld as any);

/**
 * @swagger
 * /api/auth/verify-email-new:
 *   post:
 *     summary: Step 2 of email rotation - Verify new email synchronization
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Email updated }
 *       400: { description: Invalid code }
 */
authRoute.post("/verify-email-new", authenticateToken, verifyEmailNew as any);

/**
 * @swagger
 * /api/auth/upload-asset:
 *   post:
 *     summary: Direct asset injection to cloud storage
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 */
authRoute.post("/upload-asset", authenticateToken, upload.single("file"), uploadAsset as any);

export default authRoute;