import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import authorizeRole from "../middlewares/role.middleware";
import { GetJobSaved, toggleSaveJob } from "../controllers/saved.controller";

const savedRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: Saved missions for jobseekers
 */

/**
 * @swagger
 * /api/saved:
 *   get:
 *     summary: Get all missions saved by the current jobseeker
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Bookmarked missions retrieved }
 *       401: { description: Unauthorized }
 */
savedRoute.get('/',authenticateToken,authorizeRole('jobseeker'),GetJobSaved);

/**
 * @swagger
 * /api/saved/{id}:
 *   patch:
 *     summary: Save or unsave a mission node
 *     tags: [Bookmarks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bookmark toggled }
 *       404: { description: Mission not found }
 */
savedRoute.patch('/:id',authenticateToken,authorizeRole('jobseeker'),toggleSaveJob);

export default savedRoute;