import mongoose, { Schema, Model } from "mongoose";
import { IJobMatch } from "../types";

const jobMatchSchema = new Schema<IJobMatch>({
    candidate: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    job: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    analysis: {
        type: Schema.Types.Mixed,
        required: true
    },
    profileSnapshotDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Compound index to quickly find a match for a specific user and job
jobMatchSchema.index({ candidate: 1, job: 1 }, { unique: true });

const JobMatch: Model<IJobMatch> = mongoose.model<IJobMatch>("JobMatch", jobMatchSchema);

export default JobMatch;
