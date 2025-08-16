import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { GetJobSaved, toggleSaveJob } from "../controllers/saved.controller.js";

const savedRoute = express.Router();

savedRoute.get('/',authenticateToken,authorizeRole('jobseeker'),GetJobSaved);
savedRoute.patch('/:id',authenticateToken,authorizeRole('jobseeker'),toggleSaveJob);

export default savedRoute;