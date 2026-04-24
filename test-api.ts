import axios from "axios";
import mongoose from "mongoose";
import User from "./src/models/user.model";
import { DbConnection } from "./src/DbConfig/Database";
import jwt from "jsonwebtoken";

async function run() {
  await DbConnection();
  const user = await User.findOne({ role: "jobseeker" });
  if (!user) {
    console.log("No jobseeker found");
    process.exit(0);
  }

  const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "7d" });
  
  try {
    const res = await axios.patch("http://localhost:5000/api/auth/edit/profile", {
      fullname: user.fullname,
      position: "API Test",
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    console.log("API Success:", res.data.message);
  } catch (err: any) {
    console.log("API Error Status:", err.response?.status);
    console.log("API Error Body:", err.response?.data);
  }
  process.exit(0);
}
run();
