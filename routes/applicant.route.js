import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { applyJob, getApplicantsByJob, getMyApplications, updateApplicantStatus } from "../controllers/applicant.controller.js";

const applicantRoute = express.Router();

applicantRoute.get('/',authenticateToken,authorizeRole('jobseeker'),getMyApplications);
applicantRoute.post('/apply/:id',authenticateToken,authorizeRole('jobseeker'),applyJob);
applicantRoute.get('/view/:id',authenticateToken,authorizeRole('employer'),getApplicantsByJob);
applicantRoute.patch('/status/:id',authenticateToken,authorizeRole('employer'),updateApplicantStatus);

export default applicantRoute;