import { describe, it, expect } from "vitest";
import {
  joinFormSchema,
  contactFormSchema,
  spotlightNominationSchema,
  projectSubmissionSchema,
} from "../src/lib/validation";

describe("joinFormSchema", () => {
  const base = {
    displayName: "Amaka Chukwu",
    email: "amaka@example.com",
    skills: [],
    groups: [],
    consentDirectoryListing: false,
    consentSpotlight: false,
    consentCommunications: false,
    consentPrivacyPolicy: true,
    website: "",
  };

  it("accepts a minimal valid registration", () => {
    const result = joinFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = joinFormSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects when the privacy policy is not acknowledged", () => {
    const result = joinFormSchema.safeParse({ ...base, consentPrivacyPolicy: false });
    expect(result.success).toBe(false);
  });

  it("rejects when the honeypot field is filled in", () => {
    const result = joinFormSchema.safeParse({ ...base, website: "http://spam.example" });
    expect(result.success).toBe(false);
  });

  it("rejects a display name that is too short", () => {
    const result = joinFormSchema.safeParse({ ...base, displayName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid LinkedIn URL but allows an empty one", () => {
    expect(joinFormSchema.safeParse({ ...base, linkedinUrl: "not-a-url" }).success).toBe(false);
    expect(joinFormSchema.safeParse({ ...base, linkedinUrl: "" }).success).toBe(true);
  });
});

describe("contactFormSchema", () => {
  const base = { name: "Tunde", email: "tunde@example.com", subject: "Hello", message: "This is a long enough message.", website: "" };

  it("accepts a valid message", () => {
    expect(contactFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a message that is too short", () => {
    expect(contactFormSchema.safeParse({ ...base, message: "short" }).success).toBe(false);
  });
});

describe("spotlightNominationSchema", () => {
  const base = {
    nominatorName: "Grace",
    nominatorEmail: "grace@example.com",
    nomineeName: "Amaka",
    achievementType: "certification",
    title: "Completed AWS certification",
    description: "A sufficiently long description of the achievement for review purposes.",
    consentToPublish: true,
    website: "",
  };

  it("accepts a valid nomination", () => {
    expect(spotlightNominationSchema.safeParse(base).success).toBe(true);
  });

  it("rejects when consent to publish is missing", () => {
    expect(spotlightNominationSchema.safeParse({ ...base, consentToPublish: false }).success).toBe(false);
  });
});

describe("projectSubmissionSchema", () => {
  const base = {
    submitterName: "Tunde",
    submitterEmail: "tunde@example.com",
    title: "Community Events Dashboard",
    summary: "A dashboard that tracks community events.",
    description: "A longer description of the project, its purpose, and how it was built for the community.",
    website: "",
  };

  it("accepts a valid submission", () => {
    expect(projectSubmissionSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a summary that is too short", () => {
    expect(projectSubmissionSchema.safeParse({ ...base, summary: "short" }).success).toBe(false);
  });
});
