import { Document, Types } from 'mongoose';

// ============================================================
// TALENT PROFILE SCHEMA SPECIFICATION — Full Type Definitions
// ============================================================

// 3.2 Skills
export interface ISkill {
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    yearsOfExperience?: number;
}

// 3.2 Languages
export interface ILanguage {
    name: string;
    proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

// 3.3 Work Experience
export interface IExperience {
    role?: string;
    title?: string; // backward compat alias for 'role'
    company?: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
    technologies?: string[];
    isCurrent?: boolean;
}

// 3.4 Education
export interface IEducation {
    institution?: string;
    degree?: string;
    fieldOfStudy?: string;
    startYear?: number;
    endYear?: number;
    graduationYear?: number; // backward compat
    certificateUrl?: string; // diploma file/image
}

// 3.5 Certifications
export interface ICertification {
    name: string;
    issuer?: string;
    issueDate?: string; // YYYY-MM
    expiryDate?: string; // YYYY-MM
    credentialUrl?: string;
}

// 3.6 Projects
export interface IProject {
    name: string;
    description?: string;
    technologies?: string[];
    role?: string;
    link?: string;
    startDate?: string; // YYYY-MM
    endDate?: string;   // YYYY-MM or 'Present'
    isHighlighted?: boolean; // AI recommendation: flag top projects
    image?: string;    // portfolio image
}

// 3.7 Availability
export interface IAvailability {
    status: 'Available' | 'Open to Opportunities' | 'Not Available';
    type?: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship';
    startDate?: string; // YYYY-MM-DD
    preferredLocations?: string[]; // Extra: preferred work locations
}

// 3.8 Social Links
export interface ISocialLinks {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
    behance?: string;
    dribbble?: string;
    other?: string;
}

// Extension: AI-generated scores per profile
export interface IAIScores {
    overallScore?: number;
    skillMatchScore?: number;
    experienceScore?: number;
    projectScore?: number;
    completenessScore?: number;
    lastScoredAt?: Date;
}

export interface IUser extends Document {
    // 3.1 Basic Information
    fullname: string;
    email: string;
    password?: string;
    profileImage?: string;
    headline?: string;     // e.g. "Backend Engineer – Node.js & AI Systems"
    position?: string;     // legacy / alias for headline
    bio?: string;
    location?: string;
    phone?: string;
    role: 'admin' | 'jobseeker' | 'employer';
    avatar?: string;
    resume?: string;
    isVerified: boolean;
    isActive?: boolean;
    resetPasswordToken?: string;
    resetPasswordExpiresAt?: Date;
    verificationCode?: string;
    verificationCodeExpireAt?: Date;

    // Employer specific
    companyName?: string;
    companyDescription?: string;
    companyLogo?: string;
    companyPhone?: string;
    companyLocation?: string;

    // Email Change Security
    newEmailPending?: string;
    emailChangeCodeOld?: string;
    emailChangeCodeNew?: string;

    // 3.2 Skills & Languages
    skills?: ISkill[];
    languages?: ILanguage[];

    // 3.3 Work Experience
    experience?: IExperience[];

    // 3.4 Education
    education?: IEducation[];

    // 3.5 Certifications
    certifications?: ICertification[];

    // 3.6 Projects
    projects?: IProject[];

    // 3.7 Availability
    availability?: IAvailability;

    // 3.8 Social Links
    socialLinks?: ISocialLinks;

    // AI Extensions
    aiSummary?: string;
    aiScores?: IAIScores;
    resumeContent?: string;

    createdAt: Date;
    updatedAt: Date;
}

export interface IAiAnalysis {
    marketDemand?: string;
    requiredSkills?: string[];
    suggestedSalary?: string;
}

export interface IJob extends Document {
    title: string;
    description: string;
    requirements?: string;
    location?: string;
    category?: string;
    type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote' | 'hybrid';
    postedBy: Types.ObjectId | IUser;
    salaryMin?: number;
    salaryMax?: number;
    isClosed: boolean;

    // AI & Advanced Filtering
    skillsRequired?: string[];
    experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
    educationLevel?: string;
    aiAnalysis?: {
        proposals?: string[];
        lastGenerated?: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface ISkillGapAnalysis {
    matchingSkills?: string[];
    missingSkills?: string[];
    partialSkills?: string[];
    overqualifiedIn?: string[];
    gapSeverity?: 'Low' | 'Medium' | 'High';
    recommendation?: string;
    estimatedTrainingTime?: string;
}

export interface IScreeningResult extends Document {
    application: Types.ObjectId | IApplicant;
    candidate: Types.ObjectId | IUser;
    job: Types.ObjectId | IJob;
    score: number;
    category: 'Strong' | 'Potential' | 'Weak';
    strengths: string[];
    gaps: string[];
    risks: string[];
    recommendation: string;
    whyNotSelected?: string;
    insights: {
        strengths_summary?: string;
        weaknesses_summary?: string;
        final_recommendation?: string;
    };
    interviewQuestions?: string[];
    skillGapAnalysis?: ISkillGapAnalysis;
    careerRecommendations?: string[];
    jobMatchScore?: number;
    hiringSuccessProbability?: number;
    cultureFitScore?: number;
    aiSummary?: string;
    rank?: number;
    yearsOfExperience?: number;
    isFavorite?: boolean;
    isShortlisted?: boolean;
    applicationStatus?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
    user?: IUser;
}

export interface IApplicant extends Document {
    job: Types.ObjectId | IJob;
    applicant: Types.ObjectId | IUser;
    status: 'Applied' | 'In Review' | 'Accepted' | 'Rejected';
    aiScreening?: Types.ObjectId | IScreeningResult;
    createdAt: Date;
    updatedAt: Date;
}

export interface IJobMatch extends Document {
    candidate: Types.ObjectId | IUser;
    job: Types.ObjectId | IJob;
    score: number;
    analysis: any; // Using any for now to store the full AI response
    profileSnapshotDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
