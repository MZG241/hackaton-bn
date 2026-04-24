import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/user.model";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

async function runDiagnostic() {
  console.log("--- STARTING AKAZI DIAGNOSTIC ---");
  
  // 1. Env Variables Check
  console.log("1. Checking Environment Variables:");
  console.log("PORT:", process.env.PORT);
  console.log("SECRET_KEY length:", process.env.SECRET_KEY?.length);
  console.log("SECRET_KEY value:", process.env.SECRET_KEY);
  console.log("MONGO_URL exists:", !!process.env.MONGO_URL);
  
  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.error("CRITICAL: SECRET_KEY is missing from environment!");
  }
  
  // 2. Database Connection Test
  console.log("\n2. Testing Database Connection:");
  try {
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log("SUCCESS: Connected to MongoDB cluster.");
    
    // 3. User Query Test
    console.log("\n3. Testing User Collection Query:");
    const userCount = await User.countDocuments();
    console.log(`SUCCESS: Found ${userCount} users in the database.`);
    
    if (userCount > 0) {
        const firstUser = await User.findOne().select('+password');
        if (firstUser) {
            console.log("Sample User found:", firstUser.email, "Role:", firstUser.role, "Verified:", firstUser.isVerified);
            
            // 4. Test Bcrypt (Simulation)
            console.log("\n4. Testing Bcrypt Comparison:");
            if (firstUser.password) {
                try {
                    // We don't know the password, but we can test if the function crashes
                    const dummyCompare = await bcryptjs.compare("dummy", firstUser.password);
                    console.log("SUCCESS: Bcrypt compare executed without crash. Result:", dummyCompare);
                } catch (bErr) {
                    console.error("FAILURE: Bcrypt compare crashed!", bErr);
                }
            }
            
            // 5. Test JWT Sign (Simulation)
            console.log("\n5. Testing JWT Sign:");
            try {
                const token = jwt.sign(
                    { id: firstUser._id, role: firstUser.role },
                    secretKey as string,
                    { expiresIn: '24h' }
                );
                console.log("SUCCESS: JWT token generated successfully. Length:", token.length);
            } catch (jErr) {
                console.error("FAILURE: JWT sign crashed!", jErr);
            }
        }
    }
    
    await mongoose.disconnect();
    console.log("\n--- DIAGNOSTIC COMPLETE ---");
  } catch (error) {
    console.error("\nCRITICAL FAILURE:", error);
    process.exit(1);
  }
}

runDiagnostic();
