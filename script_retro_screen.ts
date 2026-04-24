import mongoose from "mongoose";
import dotenv from "dotenv";
import Applicant from "./src/models/applicant.model";
import ScreeningResult from "./src/models/screening.model";
import { aiController } from "./src/controllers/ai.controller";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to DB");

        // Find applications that do not have a corresponding screening result
        const applicants = await Applicant.find({});
        const screenings = await ScreeningResult.find({});
        const screenedAppIds = screenings.map(s => s.application?.toString() || "");

        console.log(`Found ${applicants.length} total applications.`);

        let processed = 0;
        for (const app of applicants) {
            if (!screenedAppIds.includes(app._id.toString())) {
                console.log(`Screening missing for application: ${app._id}. Triggering AI...`);
                await aiController.runFullScreening(app._id.toString());
                console.log(`Successfully screened application: ${app._id}`);
                processed++;
            }
        }

        console.log(`Finished processing. Backfilled ${processed} missing AI screenings.`);
        process.exit(0);
    } catch (err) {
        console.error("Error during retroactive screening:", err);
        process.exit(1);
    }
};

run();
