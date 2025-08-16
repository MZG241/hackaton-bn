import User from "../models/user.model.js";
import jwt from "jsonwebtoken"


export const authenticateToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("No token provided or invalid format");
    return res.status(401).send("Access Denied");
  }

  const token = authHeader.replace("Bearer ", "");


  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const user = await User.findById(decoded.id).select('-password');
   
  
      
    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Account is not activated"
      });
    }     
    



    req.user = user;
    next();
  } catch (err) {

// Handle token expiration specifically
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Session expired",
        expired: true  
      });
    }


    console.error("Token verification error:", err.message);
    res.status(400).send("Invalid Token");
  }
};