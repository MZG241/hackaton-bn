import { Request, Response } from "express";
import { aiService } from "../services/ai.service";
import { parserService } from "../utils/parser.service";
import { sanitizeCVText } from "../utils/ai.security";
import User from "../models/user.model";
import Job from "../models/job.model";
import Applicant from "../models/applicant.model";
import ScreeningResult from "../models/screening.model";
import axios from "axios";

export const aiController = {

    // ============================================================
    // 1. PARSE CV — Upload + extraction structurée
    // ============================================================
    async parseCV(req: Request, res: Response) {
        try {
            console.log("[AI Controller] Received request to parse CV");
            const file = (req as any).file;
            if (!file) {
                console.error("[AI Controller] No file found in request");
                return res.status(400).json({ message: "No file uploaded" });
            }

            console.log(`[AI Controller] File found: ${file.originalname}, size: ${file.size} bytes`);
            
            const rawText = await parserService.parseResume(file.buffer, file.originalname);
            console.log(`[AI Controller] Resume text extracted successfully, characters: ${rawText?.length || 0}`);
            
            if (!rawText || rawText.trim().length < 10) {
                console.warn("[AI Controller] Raw text extracted from PDF is too short or empty");
            }

            const parsedData = await aiService.parseCV(rawText);
            console.log("[AI Controller] AI successfully parsed CV data");

            // Only save the raw extracted text (resumeContent) — NEVER auto-apply profile fields.
            // Profile fields (name, email, experience...) require explicit user confirmation via the modal.
            const userId = req.user?._id;
            if (userId) {
                console.log(`[AI Controller] Saving resume text extraction for user ${userId}`);
                await User.findByIdAndUpdate(userId, {
                    resumeContent: sanitizeCVText(rawText),
                });
            }

            // Return parsed data for the frontend confirmation modal.
            // The user must click "Sync Profile" before any profile fields are updated.
            res.status(200).json(parsedData);
        } catch (error: any) {
            console.error("[AI Controller] parseCV failed:", error.message);
            console.error(error.stack);
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 2. GENERATE JOB PROPOSALS
    // ============================================================
    async generateJob(req: Request, res: Response) {
        try {
            const { idea, jobDetails } = req.body;
            if (!idea && (!jobDetails || !jobDetails.title)) {
                return res.status(400).json({ message: "Idea or Job Title is required" });
            }

            // Fetch Employer Info to inject into the proposal
            const userId = req.user?._id;
            let employerData = {};
            if (userId) {
                const employer = await User.findById(userId).select("companyName email phone location companyDescription");
                if (employer) {
                    employerData = {
                        companyName: employer.companyName,
                        email: employer.email,
                        phone: employer.phone,
                        location: employer.location,
                        description: employer.companyDescription
                    };
                }
            }

            const proposals = await aiService.generateJobProposals(idea || jobDetails?.title, jobDetails, employerData);
            res.status(200).json({ proposals });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    /**
     * Helper to ensure a user has their CV text extracted and saved
     */
    async ensureResumeContent(user: any): Promise<string | null> {
        if (user.resumeContent) return user.resumeContent;
        if (!user.resume) return null;

        try {
            console.log(`[AI Controller] Auto-extracting text for user ${user._id} from ${user.resume}`);
            const response = await axios.get(user.resume, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            
            // Auto-detects between PDF and Word
            const rawText = await parserService.parseResume(buffer, user.resume);
            const sanitized = sanitizeCVText(rawText);
            
            await User.findByIdAndUpdate(user._id, { resumeContent: sanitized });
            user.resumeContent = sanitized; // Update in-memory object
            return sanitized;
        } catch (err) {
            console.error(`[AI Controller] Failed to auto-extract text for ${user._id}:`, err);
            return null;
        }
    },

    // ============================================================
    // 3. SCREEN APPLICATION — Évaluation complète
    // ============================================================
    async runFullScreening(applicationId: string) {
        const application = await Applicant.findById(applicationId)
            .populate("applicant")
            .populate("job");

        if (!application) throw new Error("Application not found");

        let candidateData = application.applicant as any;
        const jobData = application.job as any;

        // Ensure we have CV text (PDF or Word)
        await aiController.ensureResumeContent(candidateData);

        // Screen principal
        const screenResult = await aiService.screenCandidate(candidateData, jobData);
        // Note: screenCandidate now returns the flat result directly, not wrapped in top_candidates anymore
        const candidateResult = screenResult;

        // Générer toutes les données AI en parallèle
        const [interviewQuestions, skillGapAnalysis, careerRecommendations, aiSummary] =
            await Promise.allSettled([
                aiService.generateInterviewQuestions(candidateData, jobData),
                aiService.analyzeSkillGap(candidateData, jobData),
                aiService.generateCareerRecommendations(candidateData, jobData),
                aiService.generateCandidateSummary(candidateData),
            ]);

        const screening = await ScreeningResult.findOneAndUpdate(
            { application: applicationId },
            {
                application: applicationId,
                candidate: candidateData._id,
                job: jobData._id,
                score: candidateResult.score,
                category: candidateResult.category,
                strengths: candidateResult.strengths,
                gaps: candidateResult.gaps,
                risks: candidateResult.risks,
                recommendation: candidateResult.recommendation,
                whyNotSelected: candidateResult.whyNotSelected,
                jobMatchScore: candidateResult.jobMatchScore,
                cultureFitScore: candidateResult.cultureFitScore,
                hiringSuccessProbability: candidateResult.hiringSuccessProbability,
                insights: candidateResult.insights,
                yearsOfExperience: candidateData.yearsOfExperience || (candidateResult as any).yearsOfExperience || 0,
                interviewQuestions: interviewQuestions.status === "fulfilled" ? interviewQuestions.value : [],
                skillGapAnalysis: skillGapAnalysis.status === "fulfilled" ? skillGapAnalysis.value : null,
                careerRecommendations: careerRecommendations.status === "fulfilled" ? careerRecommendations.value : [],
                aiSummary: aiSummary.status === "fulfilled" ? aiSummary.value : "",
                status: "completed",
            },
            { upsert: true, new: true }
        );

        // [CRITICAL] Update the Applicant record to link to this ScreeningResult
        await Applicant.findByIdAndUpdate(applicationId, { aiScreening: screening._id });

        return screening;
    },

    async screenApplication(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;
            const screening = await aiController.runFullScreening(String(applicationId));
            res.status(200).json(screening);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 4. GET JOB SCREENING — Résultats avec filtres & tri
    // ============================================================
    async getJobScreening(req: Request, res: Response) {
        try {
            const { jobId } = req.params;
            const {
                category,
                minScore,
                maxScore,
                isFavorite,
                isShortlisted,
                sort = "score",
                limit = "50",
                page = "1",
            } = req.query;

            // 1. Check for applicants who haven't been screened yet
            const allApplicants = await Applicant.find({ job: jobId });
            const screenedCount = await ScreeningResult.countDocuments({ job: jobId });

            if (allApplicants.length > screenedCount) {
                // Trigger screening for missing ones in background
                const screenedIds = await ScreeningResult.find({ job: jobId }).distinct("candidate");
                const screenedIdStrings = screenedIds.map(id => id.toString());
                
                const missingApplicants = allApplicants.filter(
                    (app) => !screenedIdStrings.includes(app.applicant.toString())
                );

                console.log(`[AI Controller] Triggering screening for ${missingApplicants.length} missing applicants for job ${jobId}`);
                
                // Do not await, let it run in background
                missingApplicants.forEach((app: any) => {
                    aiController.runFullScreening(app._id.toString()).catch(err => 
                        console.error(`[AI Controller] Background screening failed for ${app._id}:`, err)
                    );
                });
            }

            const filter: any = { job: jobId };
            if (category) filter.category = category;
            if (minScore || maxScore) {
                filter.score = {};
                if (minScore) filter.score.$gte = Number(minScore);
                if (maxScore) filter.score.$lte = Number(maxScore);
            }
            if (isFavorite === "true") filter.isFavorite = true;
            if (isShortlisted === "true") filter.isShortlisted = true;
            if (req.query.applicationStatus) filter.applicationStatus = req.query.applicationStatus;

            const sortMap: any = {
                score: { score: -1 },
                rank: { rank: 1 },
                name: { "candidate.fullname": 1 },
                date: { createdAt: -1 },
                jobMatch: { jobMatchScore: -1 },
                cultureFit: { cultureFitScore: -1 },
            };

            const pageNum = parseInt(String(page), 10);
            const limitNum = parseInt(String(limit), 10);
            const skip = (pageNum - 1) * limitNum;

            const [results, total] = await Promise.all([
                ScreeningResult.find(filter)
                    .populate("candidate", "fullname email profileImage skills experience education location bio resumeContent resume")
                    .sort(sortMap[String(sort)] || { score: -1 })
                    .skip(skip)
                    .limit(limitNum),
                ScreeningResult.countDocuments(filter),
            ]);

            // Manual merge to ensure absolute reliability across refreshes
            const applicationIds = results.map(r => {
                const app = r.application as any;
                return (app && typeof app === 'object') ? app._id : app;
            }).filter(Boolean);
            
            const applicants = await Applicant.find({ _id: { $in: applicationIds } }, 'status');
            const statusMap = new Map(applicants.map((a: any) => [a._id.toString(), a.status]));

            const mappedResults = results.map(r => {
                // Priority 1: Use the status saved directly on the ScreeningResult (fastest)
                // Priority 2: Fallback to the statusMap from the Applicant collection
                const status = r.applicationStatus && r.applicationStatus !== 'Applied' 
                    ? r.applicationStatus 
                    : (statusMap.get(r.application?.toString() || '') || 'Applied');
                
                const rObj = r.toObject();
                rObj.applicationStatus = status;
                return rObj;
            });

            res.status(200).json({
                results: mappedResults,
                pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 5. RANK CANDIDATES — Top 10/20
    // ============================================================
    async rankCandidates(req: Request, res: Response) {
        try {
            const { jobId } = req.params;
            const topN = parseInt(String(req.query.top || "10"), 10);

            const job = await Job.findById(jobId);
            if (!job) return res.status(404).json({ message: "Job not found" });

            const applications = await Applicant.find({ job: jobId })
                .populate("applicant");

            if (applications.length === 0) {
                return res.status(200).json({ ranked: [] });
            }

            const candidates = applications.map((a: any) => a.applicant);
            const ranked = await aiService.rankCandidates(candidates, job, topN);

            // Sauvegarder les rangs dans la DB
            for (const item of ranked) {
                await ScreeningResult.findOneAndUpdate(
                    { job: jobId, candidate: item.id },
                    { rank: item.rank, score: item.score, category: item.category },
                    { upsert: false }
                );
            }

            res.status(200).json({ ranked, total: applications.length });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 6. COMPARE CANDIDATES
    // ============================================================
    async compareCandidates(req: Request, res: Response) {
        try {
            const { candidateAId, candidateBId, jobId } = req.body;

            if (!candidateAId || !candidateBId || !jobId) {
                return res.status(400).json({ message: "candidateAId, candidateBId, and jobId required" });
            }

            const [candidateA, candidateB, job] = await Promise.all([
                User.findById(candidateAId),
                User.findById(candidateBId),
                Job.findById(jobId),
            ]);

            if (!candidateA || !candidateB || !job)
                return res.status(404).json({ message: "Candidate or Job not found" });

            const comparison = await aiService.compareCandidates(candidateA, candidateB, job);
            res.status(200).json(comparison);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 7. INTERVIEW QUESTIONS — Générer pour un candidat
    // ============================================================
    async getInterviewQuestions(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;

            // Chercher dans screening existant d'abord
            const existing = await ScreeningResult.findOne({ application: applicationId });
            if (existing?.interviewQuestions?.length) {
                return res.status(200).json({ questions: existing.interviewQuestions });
            }

            const application = await Applicant.findById(applicationId)
                .populate("applicant")
                .populate("job");

            if (!application) return res.status(404).json({ message: "Application not found" });

            const questions = await aiService.generateInterviewQuestions(
                application.applicant as any,
                application.job as any
            );

            // Sauvegarder si screening existe
            if (existing) {
                await ScreeningResult.findByIdAndUpdate(existing._id, { interviewQuestions: questions });
            }

            res.status(200).json({ questions });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 8. SKILL GAP ANALYSIS
    // ============================================================
    async getSkillGap(req: Request, res: Response) {
        try {
            const { applicationId } = req.params;

            const existing = await ScreeningResult.findOne({ application: applicationId });
            if (existing?.skillGapAnalysis) {
                return res.status(200).json(existing.skillGapAnalysis);
            }

            const application = await Applicant.findById(applicationId)
                .populate("applicant")
                .populate("job");

            if (!application) return res.status(404).json({ message: "Application not found" });

            const analysis = await aiService.analyzeSkillGap(
                application.applicant as any,
                application.job as any
            );

            if (existing) {
                await ScreeningResult.findByIdAndUpdate(existing._id, { skillGapAnalysis: analysis });
            }

            res.status(200).json(analysis);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 9. TOGGLE FAVORITE / SHORTLIST
    // ============================================================
    async toggleFavorite(req: Request, res: Response) {
        try {
            const { screeningId } = req.params;
            const screening = await ScreeningResult.findById(screeningId);
            if (!screening) return res.status(404).json({ message: "Screening not found" });

            screening.isFavorite = !screening.isFavorite;
            await screening.save();

            res.status(200).json({ isFavorite: screening.isFavorite });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    async toggleShortlist(req: Request, res: Response) {
        try {
            const { screeningId } = req.params;
            const screening = await ScreeningResult.findById(screeningId);
            if (!screening) return res.status(404).json({ message: "Screening not found" });

            screening.isShortlisted = !screening.isShortlisted;
            await screening.save();

            res.status(200).json({ isShortlisted: screening.isShortlisted });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 10. QUICK DECISION — Accept / Reject
    // ============================================================
    async quickDecision(req: Request, res: Response) {
        console.log(`[AI CONTROLLER] Incoming Quick Decision for ID: ${req.params.applicationId}, Decision: ${req.body.decision}`);
        try {
            const { applicationId } = req.params; // This is usually the ScreeningResult ID
            const { decision } = req.body;

            if (!["Accepted", "Rejected"].includes(decision)) {
                return res.status(400).json({ message: "Decision must be 'Accepted' or 'Rejected'" });
            }

            // 1. Try to find the ScreeningResult first
            let screening = await ScreeningResult.findById(applicationId);
            let realApplicationId: string | null = null;

            if (screening) {
                realApplicationId = screening.application?.toString();
            } else {
                // If not a ScreeningResult ID, maybe it's the direct Applicant ID?
                const directApp = await Applicant.findById(applicationId);
                if (directApp) {
                    realApplicationId = String(applicationId);
                    // Try to find the associated screening for this applicant to keep it in sync
                    screening = await ScreeningResult.findOne({ application: realApplicationId });
                }
            }

            if (!realApplicationId) {
                console.error(`[AI Decision] Could not resolve realApplicationId for ${applicationId}`);
                return res.status(404).json({ message: "DEBUG: Screening or Applicant ID not found in system." });
            }

            // 2. Update the Applicant record (Source of Truth for Pipeline)
            const application = await Applicant.findByIdAndUpdate(
                realApplicationId,
                { status: decision },
                { new: true }
            );

            if (!application) {
                console.error(`[AI Decision] Applicant ${realApplicationId} not found in DB`);
                return res.status(404).json({ message: "DEBUG: Applicant record missing from DB." });
            }

            // 3. Sync decision back to the ScreeningResult (Fast lookup for AI Dashboard)
            if (screening) {
                await ScreeningResult.findByIdAndUpdate(screening._id, { applicationStatus: decision });
            } else {
                // If we found the applicant but no screening record exists yet, 
                // we'll just skip the sync (or we could create one if needed)
                console.log(`[AI Decision] Sync skipped: No ScreeningResult found for Applicant ${realApplicationId}`);
            }

            res.status(200).json({ 
                success: true, 
                decision, 
                applicationId: realApplicationId,
                screeningId: screening?._id 
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // ============================================================
    // 11. DASHBOARD ANALYTICS
    // ============================================================
    async getDashboard(req: Request, res: Response) {
        try {
            const { jobId } = req.params;

            const [total, byCategory, avgScore, topCandidates, favoriteCount, shortlistedCount, acceptedCount, rejectedCount] =
                await Promise.all([
                    ScreeningResult.countDocuments({ job: jobId }),
                    ScreeningResult.aggregate([
                        { $match: { job: new (require("mongoose").Types.ObjectId)(jobId) } },
                        { $group: { _id: "$category", count: { $sum: 1 }, avgScore: { $avg: "$score" } } },
                    ]),
                    ScreeningResult.aggregate([
                        { $match: { job: new (require("mongoose").Types.ObjectId)(jobId) } },
                        { $group: { _id: null, avg: { $avg: "$score" } } },
                    ]),
                    ScreeningResult.find({ job: jobId })
                        .populate("candidate", "fullname email profileImage skills resume")
                        .sort({ score: -1 })
                        .limit(5),
                    ScreeningResult.countDocuments({ job: jobId, isFavorite: true }),
                    ScreeningResult.countDocuments({ job: jobId, isShortlisted: true }),
                    ScreeningResult.countDocuments({ job: jobId, applicationStatus: "Accepted" }),
                    ScreeningResult.countDocuments({ job: jobId, applicationStatus: "Rejected" }),
                ]);

            res.status(200).json({
                total,
                averageScore: avgScore[0]?.avg ? Math.round(avgScore[0].avg) : 0,
                byCategory,
                topCandidates,
                favoriteCount,
                shortlistedCount,
                acceptedCount,
                rejectedCount,
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },
    
    // ============================================================
    // 12. AI CAREER COACH  — Support & Coaching
    // ============================================================
    async chatWithCoach(req: Request, res: Response) {
        try {
            const { message, history = [] } = req.body;
            const userId = req.user?._id;

            if (!message) return res.status(400).json({ message: "Message is required" });

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "Candidate profile not found to provide coaching context." });

            // Ensure resume context is ready for the coach
            if (user.resume && !user.resumeContent) {
                console.log(`[AI Controller] Preparing resume context for Career Coach chat for user ${user._id}`);
                await aiController.ensureResumeContent(user);
            }

            const response = await aiService.chatWithCoach(message, user, history);

            res.status(200).json({ response });
        } catch (error: any) {
            res.status(500).json({ message: error.message || "Failed to engage with the AI Career Coach." });
        }
    },

    // ============================================================
    // 13. RECOMMEND CANDIDATES (Recruitment Assistant)
    // ============================================================
    async recommendCandidates(req: Request, res: Response) {
        try {
            const { query, limit = 6 } = req.body;
            if (!query) return res.status(400).json({ message: "Search context/query is required" });

            // Fetch all potential candidates
            const candidates = await User.find({ role: "jobseeker" });
            
            if (candidates.length === 0) {
                return res.status(200).json({ recommendations: [], total: 0 });
            }

            // [NEW] Ensure all candidate resumes are parsed in parallel for the recruitment assistant
            // We limit the number of parallel parses to avoid overwhelming the server or reaching rate limits
            const candidatesToParse = candidates.filter(c => c.resume && !c.resumeContent);
            if (candidatesToParse.length > 0) {
                console.log(`[AI Controller] Auto-extracting ${candidatesToParse.length} resumes for recruitment recommendations...`);
                await Promise.allSettled(candidatesToParse.map(c => aiController.ensureResumeContent(c)));
            }

            const recommendedIds = await aiService.recommendCandidates(query, candidates, limit);
            
            // Enrich recommendations with full user data
            const enrichedResults = await Promise.all(recommendedIds.map(async (rec: any) => {
                const user = await User.findById(rec.id).select('fullname email profileImage skills position location experience bio');
                return {
                    ...rec,
                    candidate: user
                };
            }));

            res.status(200).json({ 
                recommendations: enrichedResults,
                total: candidates.length,
                query
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message || "Failed to generate talent recommendations" });
        }
    },

    // ============================================================
    // 14. RESCAN JOB — Tout supprimer et recommencer
    // ============================================================
    async rescanJob(req: Request, res: Response) {
        try {
            const { jobId } = req.params;

            // 1. [OPTIMIZED] Do not delete results; let runFullScreening upsert/update them.
            // This prevents candidates from "disappearing" while the AI is processing.
            // await ScreeningResult.deleteMany({ job: jobId });

            // 2. Fetch all applicants
            const applicants = await Applicant.find({ job: jobId });
            
            if (applicants.length === 0) {
                return res.status(200).json({ message: "No candidates to scan." });
            }

            // 3. Trigger analysis in background for all
            applicants.forEach((app: any) => {
                aiController.runFullScreening(app._id.toString()).catch(err => 
                    console.error(`[AI Controller] Background rescan failed for ${app._id}:`, err)
                );
            });

            res.status(200).json({ 
                message: `Rescan triggered for ${applicants.length} candidates. Results will appear shortly.`,
                total: applicants.length 
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message || "Failed to trigger rescan" });
        }
    },
};
