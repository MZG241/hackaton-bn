import mongoose, { Schema, Model } from "mongoose";
import { IApplicant } from "../types";

const applicantSchema = new Schema<IApplicant>({
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'In Review', 'Rejected', 'Accepted'],
    default: 'Applied',
    required: true
  },
  aiScreening: {
    type: Schema.Types.ObjectId,
    ref: 'ScreeningResult'
  }
}, {
  timestamps: true
});

const Applicant: Model<IApplicant> = mongoose.model<IApplicant>("Applicant", applicantSchema);

export default Applicant;