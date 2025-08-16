import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { createJob, deleteJob, getJobs, getMyJobs, getSingleJob, toggleJobStatus, updateJob } from "../controllers/job.controller.js";


const jobRoute = express.Router();

jobRoute.post('/create',authenticateToken,authorizeRole('employer'),createJob);
jobRoute.get('/me', authenticateToken, getMyJobs); 
jobRoute.get('/:id', authenticateToken, getSingleJob);
jobRoute.get('/',authenticateToken,getJobs);
jobRoute.delete('/delete/:id',authenticateToken,deleteJob);
jobRoute.put('/edit/:id',authenticateToken,updateJob);
jobRoute.patch('/status/:id',authenticateToken,toggleJobStatus);

export default jobRoute ;