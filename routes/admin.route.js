import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { getCompanyJob, getEmployer, getJobs, getJobSeeker} from "../controllers/user.controller.js";

const adminRoute = express.Router();

adminRoute.get('/employers',authenticateToken,authorizeRole('admin'),getEmployer);
adminRoute.get('/jobseekers',authenticateToken,authorizeRole('admin'),getJobSeeker);
adminRoute.get('/jobs',authenticateToken,authorizeRole('admin'),getJobs);
adminRoute.get('/jobs/company/:id',authenticateToken,authorizeRole('admin'),getCompanyJob);


export default adminRoute;