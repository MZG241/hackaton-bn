import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import authorizeRole from "../middlewares/role.middleware";
import { applyJob, getApplicantsByJob, getMyApplications, updateApplicantStatus } from "../controllers/applicant.controller";

const applicantRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Mission application and candidate lifecycle
 */

/**
 * @swagger
 * /api/applicant:
 *   get:
 *     summary: Get mission applications for the current jobseeker
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: List of jobseeker's applications retrieved }
 *       401: { description: Unauthorized }
 */
applicantRoute.get('/',authenticateToken,authorizeRole('jobseeker'),getMyApplications);

/**
 * @swagger
 * /api/applicant/apply/{id}:
 *   post:
 *     summary: Apply for a specific mission node
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Application submitted }
 *       400: { description: Already applied or mission closed }
 *       404: { description: Mission not found }
 */
applicantRoute.post('/apply/:id',authenticateToken,authorizeRole('jobseeker'),applyJob);

/**
 * @swagger
 * /api/applicant/view/{id}:
 *   get:
 *     summary: View all applicants for a mission (Employer only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Applicants retrieved }
 *       403: { description: Not authorized }
 *       404: { description: Mission not found }
 */
applicantRoute.get('/view/:id',authenticateToken,authorizeRole('employer'),getApplicantsByJob);

/**
 * @swagger
 * /api/applicant/status/{id}:
 *   patch:
 *     summary: Update application status (In Review, Accepted, etc.)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Applied, "In Review", Rejected, Accepted] }
 *     responses:
 *       200: { description: Status updated successfully }
 *       400: { description: Invalid status value }
 *       404: { description: Application not found }
 */
applicantRoute.patch('/status/:id',authenticateToken,authorizeRole('employer'),updateApplicantStatus);

export default applicantRoute;