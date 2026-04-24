import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import jwt from "jsonwebtoken";

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("No token provided or invalid format");
    return res.status(401).send("Access Denied");
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as any;

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      console.warn(`[Auth Middleware] 400 - Account not activated for: ${user.email}`);
      return res.status(400).json({
        success: false,
        message: "Account is not activated",
      });
    }

    (req as any).user = user;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired",
        expired: true,
      });
    }
    console.error("Token verification error:", err.message);
    res.status(400).send("Invalid Token");
  }
};