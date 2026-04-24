import mongoose from "mongoose";
import User from "../models/user.model";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

async function resetPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URL || "");
        const emails = [
            "jeanpaul.mugisha@rwandatech.rw",
            "angelique.umutoni@kigali-inn.rw",
            "fabrice.niyomugabo@talent.rw",
            "solange.uwase@talent.rw"
        ];

        const hashedPassword = await bcryptjs.hash("password123", 12);

        for (const email of emails) {
            await User.findOneAndUpdate({ email }, { 
                password: hashedPassword,
                isVerified: true 
            });
            console.log(`✅ Password reset for ${email}`);
        }

        await mongoose.disconnect();
        console.log("\n--- All passwords set to 'password123' ---");
    } catch (err) {
        console.error("Error resetting passwords:", err);
    }
}

resetPasswords();
