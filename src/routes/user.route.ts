import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import authorizeRole from "../middlewares/role.middleware";
import { getUserProfile, getCompanyJob } from "../controllers/user.controller";

const userRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and entity management
 */

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     summary: Get a specific user/entity profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User profile retrieved }
 *       404: { description: User not found }
 */
userRoute.get('/:id',authenticateToken,authorizeRole('employer','admin','jobseeker'),getUserProfile);

/**
 * @swagger
 * /api/user/jobs/{id}:
 *   get:
 *     summary: Get all missions belonging to a specific employer
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of missions retrieved }
 *       404: { description: Employer not found }
 */
userRoute.get('/jobs/:id',authenticateToken,authorizeRole('employer','admin','jobseeker'),getCompanyJob);

export default userRoute;