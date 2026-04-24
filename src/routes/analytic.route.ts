import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import authorizeRole from "../middlewares/role.middleware";
import { GetAdminDashboard, GetEmployerDashboard, GetJobSeekerDashboard } from "../controllers/analytic.controller";


const analyticRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: High-level data visualization for all roles
 */

/**
 * @swagger
 * /api/analytic/employer:
 *   get:
 *     summary: Get mission and recruitment analytics for an employer
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Employer dashboard analytics retrieved }
 *       401: { description: Unauthorized }
 */
analyticRoute.get('/employer',authenticateToken,authorizeRole('employer'),GetEmployerDashboard);

/**
 * @swagger
 * /api/analytic/jobseeker:
 *   get:
 *     summary: Get application and match analytics for a jobseeker
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Jobseeker dashboard analytics retrieved }
 *       401: { description: Unauthorized }
 */
analyticRoute.get('/jobseeker',authenticateToken,authorizeRole('jobseeker'),GetJobSeekerDashboard);

/**
 * @swagger
 * /api/analytic/administrator:
 *   get:
 *     summary: Get platform-wide operational analytics for admins
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Administrator dashboard analytics retrieved }
 *       401: { description: Unauthorized }
 */
analyticRoute.get('/administrator',authenticateToken,authorizeRole('admin'),GetAdminDashboard);

export default analyticRoute;