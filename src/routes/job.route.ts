import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import authorizeRole from "../middlewares/role.middleware";
import { createJob, deleteJob, getJobs, getJobMatchScore, getMyJobs, getSingleJob, toggleJobStatus, updateJob } from "../controllers/job.controller";

const jobRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Missions
 *   description: Strategic mission management and matching protocols
 */

/**
 * @swagger
 * /api/job/create:
 *   post:
 *     summary: Deploy a new mission node
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category, location, type]
 *             properties:
 *               title: { type: string, example: "Lead Cloud Architect" }
 *               description: { type: string, example: "Orchestrate multi-region cloud infrastructure..." }
 *               category: { type: string, example: "Engineering" }
 *               location: { type: string, example: "Kigali, Rwanda" }
 *               type: { type: string, enum: [full-time, part-time, contract, internship, remote, hybrid], example: "full-time" }
 *               salaryMin: { type: number, example: 5000 }
 *               salaryMax: { type: number, example: 8000 }
 *               requirements: { type: string, example: "<p>10+ years AWS</p>" }
 *               skillsRequired: { type: array, items: { type: string }, example: ["AWS", "Node.js", "Docker"] }
 *               experienceLevel: { type: string, enum: [junior, mid, senior, lead], example: "senior" }
 *     responses:
 *       201: { description: Mission deployed successfully }
 *       403: { description: Only employers can deploy mission nodes }
 */
jobRoute.post('/create',authenticateToken,authorizeRole('employer'),createJob);

/**
 * @swagger
 * /api/job:
 *   get:
 *     summary: Query the mission node network
 *     tags: [Missions]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         description: Search by title or description keywords
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: location
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [full-time, part-time, contract, internship, remote, hybrid] }
 *       - in: query
 *         name: experienceLevel
 *         schema: { type: string, enum: [junior, mid, senior, lead] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Mission stream retrieved
 */
jobRoute.get('/',authenticateToken,getJobs);

/**
 * @swagger
 * /api/job/me:
 *   get:
 *     summary: Get mission nodes owned by the current employer
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Employer's missions retrieved }
 *       401: { description: Unauthorized }
 */
jobRoute.get('/me', authenticateToken, getMyJobs); 

/**
 * @swagger
 * /api/job/{id}/match:
 *   get:
 *     summary: Retrieve AI match analytics for a specific mission
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: AI matching stats retrieved }
 *       404: { description: Mission node not found }
 */
jobRoute.get('/:id/match', authenticateToken, getJobMatchScore);

/**
 * @swagger
 * /api/job/{id}:
 *   get:
 *     summary: Retrieve comprehensive mission node details
 *     tags: [Missions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mission details retrieved }
 *       404: { description: Mission node not found }
 */
jobRoute.get('/:id', authenticateToken, getSingleJob);

/**
 * @swagger
 * /api/job/delete/{id}:
 *   delete:
 *     summary: Terminate a mission node
 *     tags: [Missions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mission terminated successfully }
 *       403: { description: Not authorized to terminate }
 */
jobRoute.delete('/delete/:id',authenticateToken,deleteJob);

/**
 * @swagger
 * /api/job/edit/{id}:
 *   patch:
 *     summary: Reconfigure mission node parameters
 *     tags: [Missions]
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
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               salaryMin: { type: number }
 *     responses:
 *       200: { description: Mission reconfigured successfully }
 *       403: { description: Not authorized to modify }
 */
jobRoute.patch('/edit/:id',authenticateToken,updateJob);

/**
 * @swagger
 * /api/job/status/{id}:
 *   patch:
 *     summary: Toggle mission node operational status
 *     tags: [Missions]
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
 *             properties:
 *               isClosed: { type: boolean }
 *     responses:
 *       200: { description: Operational status toggled }
 *       403: { description: Not authorized }
 */
jobRoute.patch('/status/:id',authenticateToken,toggleJobStatus);

export default jobRoute;