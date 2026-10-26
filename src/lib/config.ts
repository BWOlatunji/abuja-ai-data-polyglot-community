// Central place to read env/config so pages and components never read
// `import.meta.env` directly. Keeps the "which vars are public" decision
// in one file and makes it obvious nothing private leaks here.

export const siteConfig = {
  name: import.meta.env.PUBLIC_COMMUNITY_NAME || "Abuja AI and Data Polyglot Community",
  shortName: "Abuja AI & Data Polyglot",
  url: import.meta.env.PUBLIC_SITE_URL || "https://abuja-ai-data-polyglot.netlify.app",
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL || "hello@example.com",
  linkedinUrl: import.meta.env.PUBLIC_LINKEDIN_URL || "",
  whatsappUrl: import.meta.env.PUBLIC_WHATSAPP_URL || "",
  githubUrl: import.meta.env.PUBLIC_GITHUB_URL || "",
  turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "",
  // Optional, privacy-respecting, cookie-free analytics (e.g. Plausible).
  // Leave unset to ship with no analytics at all.
  plausibleDomain: import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN || "",
  description:
    "A welcoming Abuja-based community where people learn, build, share knowledge, and grow together across data science, analytics, AI, and machine learning.",
};

export const isSupabaseConfigured = Boolean(
  import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// Bump this whenever /privacy's substantive content changes, so each
// consent_records row stays attributable to the exact policy text a
// member agreed to at the time.
export const PRIVACY_POLICY_VERSION = "2026-01-v1";
