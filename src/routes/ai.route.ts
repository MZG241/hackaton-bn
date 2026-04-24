import express from "express";
import { aiController } from "../controllers/ai.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

/**
 * @swagger
 * tags:
 *   name: Intelligent Systems
 *   description: Neural recruitment, automated analysis, and AI career guidance protocols
 */

/**
 * @swagger
 * /api/ai/parse-cv:
 *   post:
 *     summary: Extract structured intelligence from a resume
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume: { type: string, format: binary }
 *     responses:
 *       200: { description: Resume parsed into structured node data }
 */
router.post("/parse-cv", authenticateToken, upload.single("resume"), aiController.parseCV);

/**
 * @swagger
 * /api/ai/generate-job:
 *   post:
 *     summary: Generate mission node proposals from natural language
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idea]
 *             properties:
 *               idea: { type: string, example: "Senior Frontend Dev for Fintech" }
 *     responses:
 *       200: { description: Set of mission proposals generated }
 */
router.post("/generate-job", authenticateToken, aiController.generateJob);

/**
 * @swagger
 * /api/ai/screen/{applicationId}:
 *   post:
 *     summary: Execute deep neural screening on a specific application
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Application screened }
 *       404: { description: Application not found }
 */
router.post("/screen/:applicationId", authenticateToken, aiController.screenApplication);

/**
 * @swagger
 * /api/ai/screening/{jobId}:
 *   get:
 *     summary: Retrieve aggregate screening data for a mission node
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Screening data retrieved }
 *       404: { description: Job not found }
 */
router.get("/screening/:jobId", authenticateToken, aiController.getJobScreening);

/**
 * @swagger
 * /api/ai/rescan/{jobId}:
 *   post:
 *     summary: Refresh neural analysis for all candidates in a mission pool
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Neural analysis refreshed }
 *       404: { description: Mission node not found }
 */
router.post("/rescan/:jobId", authenticateToken, aiController.rescanJob);

/**
 * @swagger
 * /api/ai/rank/{jobId}:
 *   get:
 *     summary: Rank candidates based on multi-dimensional match vectors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Candidates ranked }
 *       404: { description: Mission node not found }
 */
router.get("/rank/:jobId", authenticateToken, aiController.rankCandidates);

/**
 * @swagger
 * /api/ai/compare:
 *   post:
 *     summary: Side-by-side technical comparison of candidate nodes
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidateAId, candidateBId, jobId]
 *             properties:
 *               candidateAId: { type: string }
 *               candidateBId: { type: string }
 *               jobId: { type: string }
 *     responses:
 *       200: { description: Candidates compared successfully }
 *       400: { description: Invalid parameters }
 */
router.post("/compare", authenticateToken, aiController.compareCandidates);

/**
 * @swagger
 * /api/ai/recommend-candidates:
 *   post:
 *     summary: Neural search across the entire talent pool
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string, example: "React expert with experience in banking" }
 *     responses:
 *       200: { description: Recommended candidates retrieved }
 */
router.post("/recommend-candidates", authenticateToken, aiController.recommendCandidates);

/**
 * @swagger
 * /api/ai/career-coach:
 *   post:
 *     summary: Initialize interactive career guidance session
 *     tags: [Intelligent Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: "How can I improve my Cloud skills?" }
 *     responses:
 *       200: { description: Coach responded }
 */
router.post("/career-coach", authenticateToken, aiController.chatWithCoach);

/**
 * @swagger
 * /api/ai/questions/{applicationId}:
 *   get:
 *     summary: Get AI-generated interview questions for an application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Questions retrieved }
 */
router.get("/questions/:applicationId", authenticateToken, aiController.getInterviewQuestions);

/**
 * @swagger
 * /api/ai/skill-gap/{applicationId}:
 *   get:
 *     summary: Get deep skill gap analysis for an application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Analysis retrieved }
 */
router.get("/skill-gap/:applicationId", authenticateToken, aiController.getSkillGap);

/**
 * @swagger
 * /api/ai/favorite/{screeningId}:
 *   patch:
 *     summary: Toggle favorite status for a screening result
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screeningId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Favorite status toggled }
 */
router.patch("/favorite/:screeningId", authenticateToken, aiController.toggleFavorite);

/**
 * @swagger
 * /api/ai/shortlist/{screeningId}:
 *   patch:
 *     summary: Toggle shortlist status for a screening result
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: screeningId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Shortlist status toggled }
 */
router.patch("/shortlist/:screeningId", authenticateToken, aiController.toggleShortlist);

/**
 * @swagger
 * /api/ai/decision/{applicationId}:
 *   post:
 *     summary: Quick hire/reject decision
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [Accepted, Rejected] }
 *     responses:
 *       200: { description: Decision recorded }
 */
router.post("/decision/:applicationId", authenticateToken, aiController.quickDecision);

/**
 * @swagger
 * /api/ai/dashboard/{jobId}:
 *   get:
 *     summary: Get AI dashboard analytics for a job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Analytics data retrieved }
 */
router.get("/dashboard/:jobId", authenticateToken, aiController.getDashboard);

export default router;
