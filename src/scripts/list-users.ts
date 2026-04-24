import mongoose from "mongoose";
import User from "../models/user.model";
import dotenv from "dotenv";
dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URL || "");
        const users = await User.find({}).select('email role fullname');
        console.log("Registered Users:");
        users.forEach(u => {
            console.log(`- ${u.fullname} (${u.email}) [Role: ${u.role}]`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error("Error listing users:", err);
    }
}

listUsers();
