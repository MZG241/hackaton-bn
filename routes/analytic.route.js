import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { GetAdminDashboard, GetEmployerDashboard, GetJobSeekerDashboard } from "../controllers/analytic.controller.js";


const analyticRoute = express.Router();

analyticRoute.get('/employer',authenticateToken,authorizeRole('employer'),GetEmployerDashboard);
analyticRoute.get('/jobseeker',authenticateToken,authorizeRole('jobseeker'),GetJobSeekerDashboard);
analyticRoute.get('/administrator',authenticateToken,authorizeRole('admin'),GetAdminDashboard);

export default analyticRoute;