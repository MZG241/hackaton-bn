import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import authorizeRole from "../middlewares/role.middleware";
import { getCompanyJob, getEmployer, getJobs, getJobSeeker, getJobSeekerStats, getJobStats, getEmployerStats, updateUser, deleteUser, getJobSeekerApplications, getJobApplicants } from "../controllers/user.controller";

const adminRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Administration
 *   description: High-level platform governance and operational oversight
 */

/**
 * @swagger
 * /api/admin/employers:
 *   get:
 *     summary: Retrieve the employer node directory
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Employer nodes retrieved }
 *       401: { description: Unauthorized }
 */
adminRoute.get('/employers',authenticateToken,authorizeRole('admin'),getEmployer);

/**
 * @swagger
 * /api/admin/employers/stats:
 *   get:
 *     summary: Retrieve aggregate analytics for employer nodes
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Employer stats retrieved }
 *       401: { description: Unauthorized }
 */
adminRoute.get('/employers/stats',authenticateToken,authorizeRole('admin'),getEmployerStats);

/**
 * @swagger
 * /api/admin/jobseekers:
 *   get:
 *     summary: Retrieve the talent node directory
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Talent nodes retrieved }
 *       401: { description: Unauthorized }
 */
adminRoute.get('/jobseekers',authenticateToken,authorizeRole('admin', 'employer'),getJobSeeker);

/**
 * @swagger
 * /api/admin/jobseekers/stats:
 *   get:
 *     summary: Retrieve aggregate analytics for talent nodes
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Talent stats retrieved }
 *       401: { description: Unauthorized }
 */
adminRoute.get('/jobseekers/stats',authenticateToken,authorizeRole('admin', 'employer'),getJobSeekerStats);

/**
 * @swagger
 * /api/admin/jobs:
 *   get:
 *     summary: Retrieve the global mission node stream
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Mission nodes retrieved }
 *       401: { description: Unauthorized }
 */
adminRoute.get('/jobs',authenticateToken,authorizeRole('admin'),getJobs);

/**
 * @swagger
 * /api/admin/jobs/stats:
 *   get:
 *     summary: Retrieve aggregate analytics for mission nodes
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Mission stats retrieved }
 *       401: { description: Unauthorized }
 */
adminRoute.get('/jobs/stats',authenticateToken,authorizeRole('admin'),getJobStats);

/**
 * @swagger
 * /api/admin/jobs/company/{id}:
 *   get:
 *     summary: Retrieve mission nodes associated with a specific company
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Company mission nodes retrieved }
 *       404: { description: Company not found }
 */
adminRoute.get('/jobs/company/:id',authenticateToken,authorizeRole('admin'),getCompanyJob);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Modify node profile parameters
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname: { type: string }
 *               email: { type: string }
 *               role: { type: string }
 *     responses:
 *       200: { description: Node modified }
 *       404: { description: Node not found }
 *   delete:
 *     summary: Decommission a node from the network
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Node decommissioned }
 *       404: { description: Node not found }
 */
adminRoute.patch('/users/:id', authenticateToken, authorizeRole('admin'),updateUser);
adminRoute.delete('/users/:id', authenticateToken, authorizeRole('admin'), deleteUser);

/**
 * @swagger
 * /api/admin/jobseekers/{id}/applications:
 *   get:
 *     summary: Retrieve deployment history for a specific talent node
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deployment history retrieved }
 *       404: { description: Node not found }
 */
adminRoute.get('/jobseekers/:id/applications', authenticateToken, authorizeRole('admin'), getJobSeekerApplications);

/**
 * @swagger
 * /api/admin/jobs/{id}/applicants:
 *   get:
 *     summary: Retrieve candidates deployed to a specific mission node
 *     tags: [Administration]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Mission applicants retrieved }
 *       404: { description: Mission not found }
 */
adminRoute.get('/jobs/:id/applicants', authenticateToken, authorizeRole('admin', 'employer'), getJobApplicants);

export default adminRoute;