import express from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { getUserProfile } from "../controllers/user.controller.js";

const userRoute = express.Router();

userRoute.get('/:id',authenticateToken,authorizeRole('employer','admin'),getUserProfile);


export default userRoute;