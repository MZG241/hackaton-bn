import mongoose, { Schema, Model } from "mongoose";
import { IUser } from "../types/index";

// ============================================================
// SUB-SCHEMAS — Talent Profile Schema Specification
// ============================================================

const SkillSchema = new Schema({
  name: { type: String, required: true },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  yearsOfExperience: { type: Number, min: 0 }
}, { _id: false });

const LanguageSchema = new Schema({
  name: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
    default: 'Conversational'
  }
}, { _id: false });

const ExperienceSchema = new Schema({
  role: { type: String },          // spec field name
  title: { type: String },         // backward compat alias
  company: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  description: { type: String },
  technologies: [{ type: String }],
  isCurrent: { type: Boolean, default: false }
}, { _id: true });

const EducationSchema = new Schema({
  institution: { type: String },
  degree: { type: String },
  fieldOfStudy: { type: String },
  startYear: { type: Number },
  endYear: { type: Number },
  graduationYear: { type: Number }, // backward compat
  certificateUrl: { type: String }   // diploma file/image
}, { _id: true });

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String },
  issueDate: { type: String },   // YYYY-MM
  expiryDate: { type: String },  // YYYY-MM
  credentialUrl: { type: String }
}, { _id: true });

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  technologies: [{ type: String }],
  role: { type: String },
  link: { type: String },
  startDate: { type: String },   // YYYY-MM
  endDate: { type: String },     // YYYY-MM or 'Present'
  isHighlighted: { type: Boolean, default: false },
  image: { type: String }         // portfolio image
}, { _id: true });

const AvailabilitySchema = new Schema({
  status: {
    type: String,
    enum: ['Available', 'Open to Opportunities', 'Not Available'],
    default: 'Available'
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship']
  },
  startDate: { type: String },    // YYYY-MM-DD
  preferredLocations: [{ type: String }]
}, { _id: false });

const SocialLinksSchema = new Schema({
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String },
  twitter: { type: String },
  behance: { type: String },
  dribbble: { type: String },
  other: { type: String }
}, { _id: false });

const AIScoresSchema = new Schema({
  overallScore: { type: Number, min: 0, max: 100 },
  skillMatchScore: { type: Number, min: 0, max: 100 },
  experienceScore: { type: Number, min: 0, max: 100 },
  projectScore: { type: Number, min: 0, max: 100 },
  completenessScore: { type: Number, min: 0, max: 100 },
  lastScoredAt: { type: Date }
}, { _id: false });

// ============================================================
// MAIN USER SCHEMA
// ============================================================

const userSchema = new Schema<IUser>({
  // 3.1 Basic Information
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  profileImage: { type: String },
  headline: { type: String },    // 3.1 — "Backend Engineer – Node.js & AI Systems"
  position: { type: String },    // legacy alias for headline
  bio: { type: String },
  location: { type: String },
  phone: { type: String },
  role: {
    type: String,
    enum: ["admin", "jobseeker", "employer"],
    default: "jobseeker",
    required: true
  },
  avatar: { type: String },
  resume: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  verificationCode: String,
  verificationCodeExpireAt: Date,

  // Employer Fields
  companyName: String,
  companyDescription: String,
  companyLogo: String,
  companyPhone: String,
  companyLocation: String,

  // Email Change Security
  newEmailPending: String,
  emailChangeCodeOld: String,
  emailChangeCodeNew: String,

  // 3.2 Skills & Languages
  skills: [SkillSchema],
  languages: [LanguageSchema],

  // 3.3 Work Experience
  experience: [ExperienceSchema],

  // 3.4 Education
  education: [EducationSchema],

  // 3.5 Certifications
  certifications: [CertificationSchema],

  // 3.6 Projects
  projects: [ProjectSchema],

  // 3.7 Availability
  availability: { type: AvailabilitySchema },

  // 3.8 Social Links
  socialLinks: { type: SocialLinksSchema },

  // AI Extensions
  aiSummary: String,
  aiScores: { type: AIScoresSchema },
  resumeContent: String,

}, {
  timestamps: true
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;