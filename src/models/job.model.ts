import mongoose, { Schema, Model } from "mongoose";
import { IJob } from "../types";

const jobSchema = new Schema<IJob>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: String },
    location: { type: String },
    category: { type: String },
    type: {
        type: String, enum: ['full-time', 'part-time',
            'contract', 'internship', 'remote', 'hybrid'],
        default: 'full-time',
        required: true
    },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    isClosed: { type: Boolean, default: false },

    // AI & Advanced Filtering
    skillsRequired: [{ type: String }],
    experienceLevel: { type: String, enum: ['entry', 'mid', 'senior', 'lead'], default: 'mid' },
    educationLevel: { type: String },
    aiAnalysis: {
        proposals: [String], // Store 3 AI generated proposals
        lastGenerated: Date
    }
}, {
    timestamps: true
})

const Job: Model<IJob> = mongoose.model<IJob>("Job", jobSchema);

export default Job;