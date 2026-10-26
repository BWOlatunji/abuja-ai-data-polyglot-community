// Shared zod schemas used by BOTH client-side form scripts and server
// endpoints, so validation rules can never drift between the two layers.
import { z } from "zod";

export const experienceLevels = ["student", "beginner", "intermediate", "advanced", "expert"] as const;
export const careerStages = [
  "student",
  "career_changer",
  "early_career",
  "mid_career",
  "senior",
  "freelance",
  "other",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid URL, starting with https://")
  .max(300)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const joinFormSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address").max(255),
  headline: z.string().trim().max(160).optional().or(z.literal("").transform(() => undefined)),
  skills: z.array(z.string().uuid()).max(30).default([]),
  groups: z.array(z.string().uuid()).max(15).default([]),
  learningGoals: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  experienceLevel: z.enum(experienceLevels).optional().or(z.literal("").transform(() => undefined)),
  careerStage: z.enum(careerStages).optional().or(z.literal("").transform(() => undefined)),
  location: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  consentDirectoryListing: z.boolean().default(false),
  consentSpotlight: z.boolean().default(false),
  consentCommunications: z.boolean().default(false),
  consentPrivacyPolicy: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the privacy notice to join." }),
  }),
  // Honeypot field: real users never fill this in; bots following generic
  // form-fill heuristics often do. Server rejects silently if populated.
  website: z.string().max(0, "Spam check failed").optional().or(z.literal("")),
});

export type JoinFormInput = z.infer<typeof joinFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10, "Please provide a bit more detail").max(2000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const spotlightNominationSchema = z.object({
  nominatorName: z.string().trim().min(2).max(80),
  nominatorEmail: z.string().trim().email().max(255),
  isSelfNomination: z.boolean().default(false),
  nomineeName: z.string().trim().min(2).max(80),
  nomineeEmail: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  achievementType: z.string().trim().min(2).max(40),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20, "Please describe the achievement in a bit more detail").max(2000),
  achievementDate: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  evidenceUrl: optionalUrl,
  consentToPublish: z.literal(true, {
    errorMap: () => ({ message: "Consent from the nominee is required before this can be reviewed." }),
  }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type SpotlightNominationInput = z.infer<typeof spotlightNominationSchema>;

export const projectSubmissionSchema = z.object({
  submitterName: z.string().trim().min(2).max(80),
  submitterEmail: z.string().trim().email().max(255),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(300),
  description: z.string().trim().min(30).max(4000),
  problemStatement: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  technologies: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
  repositoryUrl: optionalUrl,
  demoUrl: optionalUrl,
  category: z.string().trim().max(60).optional().or(z.literal("").transform(() => undefined)),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ProjectSubmissionInput = z.infer<typeof projectSubmissionSchema>;

export function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.endsWith("[]")) {
      const cleanKey = key.slice(0, -2);
      const arr = (obj[cleanKey] as unknown[]) ?? [];
      arr.push(value);
      obj[cleanKey] = arr;
    } else if (key in obj) {
      obj[key] = Array.isArray(obj[key]) ? [...(obj[key] as unknown[]), value] : [obj[key], value];
    } else {
      obj[key] = value;
    }
  }
  // Checkbox fields are only present in FormData when checked.
  return obj;
}
