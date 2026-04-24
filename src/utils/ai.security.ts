/**
 * AI Security Layer — Protection contre les injections de prompt (Prompt Injection)
 *
 * Empêche les candidats malveillants d'insérer des instructions dans leurs CV
 * pour manipuler les scores ou les décisions de l'IA.
 */

// ==========================================
// 1. BLACKLIST — Patterns d'injection connus
// ==========================================
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
  /system\s+override/gi,
  /always\s+select\s+this\s+candidate/gi,
  /always\s+give\s+(this|me)\s+a?\s*(high|perfect|max)?\s*score/gi,
  /you\s+must\s+(select|hire|approve|accept)/gi,
  /this\s+candidate\s+is\s+already\s+(validated|approved|selected)/gi,
  /disregard\s+(previous|all)\s+(instructions?|prompts?)/gi,
  /forget\s+(previous|all)\s+(instructions?|prompts?)/gi,
  /act\s+as\s+(a\s+)?(different|new)\s+(ai|assistant|model)/gi,
  /you\s+are\s+now\s+(a\s+)?(different|new)\s+(ai|assistant)/gi,
  /new\s+instructions?:/gi,
  /\[\[.*?(inject|override|admin|system).*?\]\]/gi,
  /<\s*(script|system|admin|override|inject)[^>]*>/gi,
  /pretend\s+(to|that)\s+you/gi,
  /role\s*:\s*(admin|system|override)/gi,
];

// ==========================================
// 2. SANITIZE — Nettoyer le texte brut
// ==========================================
export function sanitizeCVText(rawText: string): string {
  let cleaned = rawText;

  // Supprimer les patterns malveillants
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "[REMOVED]");
  }

  // Supprimer les séquences de contrôle Unicode et les caractères invisibles
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");

  // Supprimer les URL suspicieuses
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, "[URL_REMOVED]");

  // Limiter la taille (éviter les attaques par volume)
  if (cleaned.length > 15000) {
    cleaned = cleaned.substring(0, 15000) + "\n[CONTENT TRUNCATED FOR SECURITY]";
  }

  return cleaned.trim();
}

// ==========================================
// 3. EXTRACT STRUCTURED — Forcer la structure
// ==========================================
export interface StructuredCandidateData {
  fullname: string;
  position: string;
  bio: string;
  resumeContent: string;
  skills: string[];
  experienceSummary: string;
  educationSummary: string;
  yearsOfExperience: number;
}

export function buildStructuredPayload(candidateData: any): StructuredCandidateData {
  // Extraire uniquement les données factuelles
  const skills = Array.isArray(candidateData.skills)
    ? candidateData.skills.map((s: any) => String(s).substring(0, 50)).slice(0, 40)
    : [];

  const experience = Array.isArray(candidateData.experience)
    ? candidateData.experience
        .map((e: any) => `${e.title || "Role"} at ${e.company || "Company"} (${e.startDate || "?"} - ${e.endDate || "Present"}): ${e.description || ""}`)
        .slice(0, 15)
        .join("; ")
    : typeof candidateData.experience === "string"
    ? candidateData.experience.substring(0, 1000)
    : "No experience listed";

  const education = Array.isArray(candidateData.education)
    ? candidateData.education
        .map((e: any) => `${e.degree || "Degree"} in ${e.fieldOfStudy || "Field"} from ${e.institution || "Institution"} (${e.graduationYear || "?"})`)
        .slice(0, 5)
        .join("; ")
    : typeof candidateData.education === "string"
    ? candidateData.education.substring(0, 500)
    : "No education listed";

  // Estimer les années d'expérience
  let yearsOfExperience = 0;
  if (Array.isArray(candidateData.experience) && candidateData.experience.length > 0) {
    yearsOfExperience = candidateData.experience.length * 1.5; // Estimation simple
  }

  return {
    fullname: String(candidateData.fullname || "Unknown").substring(0, 100),
    position: String(candidateData.position || "").substring(0, 100),
    bio: String(candidateData.bio || candidateData.about || "").substring(0, 2000),
    resumeContent: String(candidateData.resumeContent || "No resume text provided").substring(0, 20000), // Increased limit
    skills,
    experienceSummary: experience,
    educationSummary: education,
    yearsOfExperience: Math.min(Math.round(yearsOfExperience), 50),
  };
}

// ==========================================
// 4. VALIDATE AI OUTPUT — Vérifier la réponse
// ==========================================
export interface AIValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedOutput?: any;
}

export function validateAIOutput(output: any): AIValidationResult {
  // Vérifier que le score est dans la plage 0-100
  if (output.score !== undefined) {
    const score = Number(output.score);
    if (isNaN(score) || score < 0 || score > 100) {
      return {
        isValid: false,
        reason: `Score invalide: ${output.score}. Doit être entre 0 et 100.`,
      };
    }
  }

  // Vérifier la catégorie
  if (output.category !== undefined) {
    const validCategories = ["Strong", "Potential", "Weak"];
    if (!validCategories.includes(output.category)) {
      return {
        isValid: false,
        reason: `Catégorie invalide: ${output.category}`,
      };
    }
  }

  // Vérifier que la réponse ne contient pas de biais suspects
  const outputStr = JSON.stringify(output).toLowerCase();
  const suspiciousOutputPatterns = [
    "ignore instructions",
    "as per your instructions",
    "following your command",
    "i will always",
    "this candidate must be selected",
  ];

  for (const pattern of suspiciousOutputPatterns) {
    if (outputStr.includes(pattern)) {
      return {
        isValid: false,
        reason: `Sortie suspecte détectée: "${pattern}"`,
      };
    }
  }

  // Normaliser les scores si nécessaire
  if (output.score !== undefined) {
    output.score = Math.max(0, Math.min(100, Math.round(Number(output.score))));
  }
  if (output.jobMatchScore !== undefined) {
    output.jobMatchScore = Math.max(0, Math.min(100, Math.round(Number(output.jobMatchScore))));
  }
  if (output.cultureFitScore !== undefined) {
    output.cultureFitScore = Math.max(0, Math.min(100, Math.round(Number(output.cultureFitScore))));
  }
  if (output.hiringSuccessProbability !== undefined) {
    output.hiringSuccessProbability = Math.max(0, Math.min(100, Math.round(Number(output.hiringSuccessProbability))));
  }

  return { isValid: true, sanitizedOutput: output };
}

// ==========================================
// 5. BUILD SECURE JOB PAYLOAD — Données offre
// ==========================================
export function buildSecureJobPayload(jobData: any): object {
  return {
    title: String(jobData.title || "").substring(0, 200),
    description: String(jobData.description || "").substring(0, 1000),
    requirements: Array.isArray(jobData.requirements)
      ? jobData.requirements.map((r: any) => String(r).substring(0, 200)).slice(0, 20)
      : [],
    skillsRequired: Array.isArray(jobData.skillsRequired)
      ? jobData.skillsRequired.map((s: any) => String(s).substring(0, 100)).slice(0, 20)
      : [],
    experienceLevel: jobData.experienceLevel || "mid",
    educationLevel: jobData.educationLevel || "Not specified",
    location: String(jobData.location || "").substring(0, 100),
    type: jobData.type || "full-time",
  };
}
