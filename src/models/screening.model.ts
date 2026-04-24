import mongoose, { Schema, Model } from "mongoose";
import { IScreeningResult } from "../types";

const screeningResultSchema = new Schema<IScreeningResult>({
    application: {
        type: Schema.Types.ObjectId,
        ref: 'Applicant',
        required: true,
        unique: true
    },
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
        min: 0,
        max: 100,
        required: true
    },
    category: {
        type: String,
        enum: ['Strong', 'Potential', 'Weak'],
        required: true
    },
    strengths: [String],
    gaps: [String],
    risks: [String],
    recommendation: String,
    whyNotSelected: String,
    insights: {
        strengths_summary: String,
        weaknesses_summary: String,
        final_recommendation: String
    },
    // Advanced AI Fields
    interviewQuestions: [String],
    skillGapAnalysis: {
        matchingSkills: [String],
        missingSkills: [String],
        partialSkills: [String],
        overqualifiedIn: [String],
        gapSeverity: { type: String, enum: ['Low', 'Medium', 'High'] },
        recommendation: String,
        estimatedTrainingTime: String,
    },
    careerRecommendations: [String],
    jobMatchScore: { type: Number, min: 0, max: 100 },
    hiringSuccessProbability: { type: Number, min: 0, max: 100 },
    cultureFitScore: { type: Number, min: 0, max: 100 },
    aiSummary: String,
    yearsOfExperience: Number,
    rank: Number,
    // Smart Features
    isFavorite: { type: Boolean, default: false },
    isShortlisted: { type: Boolean, default: false },
    applicationStatus: { type: String, default: 'Applied' },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Index pour accélérer les tris par score
screeningResultSchema.index({ job: 1, score: -1 });
screeningResultSchema.index({ job: 1, rank: 1 });
screeningResultSchema.index({ job: 1, isFavorite: 1 });
screeningResultSchema.index({ job: 1, isShortlisted: 1 });

const ScreeningResult: Model<IScreeningResult> = mongoose.model<IScreeningResult>("ScreeningResult", screeningResultSchema);

export default ScreeningResult;
