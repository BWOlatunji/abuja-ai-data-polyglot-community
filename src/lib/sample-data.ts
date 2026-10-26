// ============================================================================
// SAMPLE / PLACEHOLDER CONTENT
// ============================================================================
// Used ONLY as a fallback when Supabase is not configured (e.g. a first
// `npm run dev` before a Supabase project exists), so the site is fully
// browsable for design/review purposes. Every page that renders this data
// shows a visible "Sample data" banner (see components/SampleDataNotice.astro)
// — this content must never be presented as real community information.
// Once PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY are set, every data
// function in src/lib/data/*.ts reads from Supabase instead and this file
// is unused at runtime.
// ============================================================================

export const sampleStats = {
  members: 128,
  events: 24,
  projects: 19,
  articles: 37,
};

export const sampleMembers = [
  {
    id: "sample-1",
    display_name: "Amaka Chukwu (sample)",
    slug: "sample-amaka-chukwu",
    professional_headline: "Data Analyst, SQL & Power BI",
    biography: "Placeholder biography for layout preview purposes only.",
    profile_image_url: null,
    location: "Abuja, Nigeria",
    experience_level: "intermediate",
    career_stage: "early_career",
    portfolio_url: null,
    linkedin_url: null,
    github_url: null,
    created_at: new Date().toISOString(),
    skills: ["SQL", "Power BI", "Python"],
    groups: ["SQL & BI Practitioners"],
  },
  {
    id: "sample-2",
    display_name: "Tunde Bello (sample)",
    slug: "sample-tunde-bello",
    professional_headline: "Machine Learning Engineer",
    biography: "Placeholder biography for layout preview purposes only.",
    profile_image_url: null,
    location: "Abuja, Nigeria",
    experience_level: "advanced",
    career_stage: "mid_career",
    portfolio_url: null,
    linkedin_url: null,
    github_url: null,
    created_at: new Date().toISOString(),
    skills: ["Python", "Machine Learning", "Deep Learning"],
    groups: ["Machine Learning Study Circle"],
  },
  {
    id: "sample-3",
    display_name: "Grace Okafor (sample)",
    slug: "sample-grace-okafor",
    professional_headline: "R Programmer & Public Health Researcher",
    biography: "Placeholder biography for layout preview purposes only.",
    profile_image_url: null,
    location: "Abuja, Nigeria",
    experience_level: "intermediate",
    career_stage: "mid_career",
    portfolio_url: null,
    linkedin_url: null,
    github_url: null,
    created_at: new Date().toISOString(),
    skills: ["R", "Public Health Analytics"],
    groups: ["R Users Nigeria — Abuja Chapter"],
  },
];

export const sampleSpotlights = [
  {
    id: "sample-spot-1",
    title: "Sample member earns cloud data certification (sample)",
    slug: "sample-cloud-certification",
    summary: "Placeholder spotlight summary for layout preview purposes only.",
    content: "This is placeholder spotlight content used only to preview page layout.",
    category: "certification",
    image_url: null,
    published_at: new Date().toISOString(),
    member: { display_name: "Amaka Chukwu (sample)", slug: "sample-amaka-chukwu" },
  },
];

export const sampleArticles = [
  {
    id: "sample-article-1",
    title: "Getting started with SQL window functions (sample)",
    slug: "sample-sql-window-functions",
    excerpt: "Placeholder article excerpt for layout preview purposes only.",
    content: "# Placeholder\n\nThis is placeholder article content for layout preview.",
    category: "tutorial",
    tags: ["sql", "tutorial"],
    cover_image_url: null,
    published_at: new Date().toISOString(),
  },
];

export const sampleEvents = [
  {
    id: "sample-event-1",
    title: "Intro to Power BI dashboards (sample)",
    slug: "sample-intro-power-bi",
    description: "Placeholder event description for layout preview purposes only.",
    event_type: "webinar",
    category: "webinar",
    start_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10 + 1000 * 60 * 90).toISOString(),
    timezone: "Africa/Lagos",
    venue_type: "online",
    venue_details: "Online — link shared after registration",
    registration_url: null,
    speakers: [{ name: "Sample Speaker", bio: "Placeholder speaker bio." }],
    featured_image_url: null,
    status: "scheduled",
    recording_url: null,
    resources: [],
  },
];

export const sampleProjects = [
  {
    id: "sample-project-1",
    title: "Community events dashboard (sample)",
    slug: "sample-events-dashboard",
    summary: "Placeholder project summary for layout preview purposes only.",
    description: "Placeholder project description for layout preview purposes only.",
    technologies: ["Python", "Power BI"],
    repository_url: null,
    demo_url: null,
    category: "data-viz",
    published_at: new Date().toISOString(),
    contributors: [{ name: "Tunde Bello (sample)", role: "Lead" }],
  },
];
