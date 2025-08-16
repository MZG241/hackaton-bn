import mongoose from "mongoose";


const applicantSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'In Review', 'Rejected', 'Accepted'],
    default: 'Applied',
    required: true
  }
}, {
  timestamps: true
});

const Applicant = mongoose.model("Applicant",applicantSchema);

export default Applicant;