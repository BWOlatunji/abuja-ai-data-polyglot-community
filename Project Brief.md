# Project Brief: Abuja AI and Data Polyglot Community Website

## 1. Your role

Act as a senior product designer, UX researcher, full-stack web developer, database architect, and technical SEO specialist.

Design and implement a complete, production-oriented website for the **Abuja AI and Data Polyglot Community**, a community that brings together people interested in data science, data analytics, artificial intelligence, machine learning, programming languages, and related technologies.

The website must be easy to maintain, mobile-friendly, accessible, secure, fast, and straightforward to deploy on Netlify.

Do not create only a landing-page mock-up. Build a coherent website with reusable components, functioning navigation, database-backed forms, content pages, and a documented deployment process.

## 2. Primary objectives

The website must:

1. Attract new members and communicate the value of joining.
2. Collect, organise, and maintain a structured database of community members.
3. Help members discover one another by skills, technologies, professional interests, and projects.
4. Celebrate members' professional achievements, learning journeys, and contributions.
5. Showcase community activities, events, webinars, projects, and educational resources.
6. Support publishing content that can be shared on LinkedIn and WhatsApp.
7. Help community organisers manage members and content without needing to edit source code.
8. Establish a credible, welcoming public presence for the community.

Prioritise community participation, member visibility, learning, collaboration, and professional development over commercial promotion.

## 3. Target audiences

Design for:

- Beginners exploring data and AI.
- Students, graduates, and career changers.
- Practising data analysts, data scientists, software developers, and machine learning engineers.
- R and Python users.
- Power BI, SQL, data engineering, and business intelligence practitioners.
- Researchers, public health and epidemiology professionals, and other domain specialists.
- Employers, mentors, speakers, collaborators, and prospective community partners.

Use clear, welcoming language that works for people at different experience levels.

## 4. Brand and visual direction

Create a polished technology-community identity.

Use the following starting palette:

- Primary teal: #1B7339
- White and neutral shades for backgrounds and readable text.

Use a clean, modern editorial design with excellent typography, generous spacing, attractive profile cards, subtle motion, and accessible contrast.

Avoid generic corporate stock imagery, excessive gradients, cluttered dashboards on the public homepage, and exaggerated marketing language.

Design a responsive mobile-first interface. Ensure buttons, navigation, forms, tables, and cards work on mobile screens.

Use placeholder logos, avatars, member records, statistics, and event data only when necessary. Label all sample content clearly and never present invented people, achievements, or statistics as real community information.

## 5. Website pages and routes

Implement the following pages:

### A. Home — /

Include:

- Hero section explaining who the community is, what it does, and who should join.
- Primary call to action: Join the Community.
- Secondary call to action: Explore Members.
- Community impact statistics sourced from actual database records or clearly labelled placeholders.
- Featured member spotlight.
- Upcoming webinars and events.
- Latest articles and tutorials.
- Featured projects and community contributions.
- Learning groups and technology interests.
- A section explaining the benefits of membership.
- Links to community participation channels, including LinkedIn and WhatsApp.
- A footer with navigation, contact information, privacy policy, and social links.

Suggested positioning: A welcoming community where people learn, build, share knowledge, and grow together across data and AI technologies.

Do not invent official partnerships, membership totals, testimonials, or impact claims.

### B. About — /about

Explain the community's mission, vision, values, activities, and participation model.

Provide space to describe its origins, organisers, learning groups, partnerships, and future direction.

Keep all editable factual claims separate from the page template.

### C. Members — /members

Build a searchable, filterable member directory.

Each public member card should show only approved public information, such as:

- Display name.
- Professional headline.
- Profile image or initials avatar.
- Short biography.
- Skills and technologies.
- Professional interests.
- Portfolio, GitHub, and LinkedIn links, where approved.
- Public profile link.

Provide filters for:

- Technologies and tools.
- Professional interests.
- Experience level, if members choose to disclose it.
- Learning groups.
- Areas of expertise.

Include pagination or efficient loading, empty states, loading indicators, error handling, and responsive layouts.

Do not expose email addresses, telephone numbers, private notes, or other non-public member data in directory responses or browser code.

### D. Individual member profile — /members/[slug]

Create a shareable profile page containing approved public information.

Allow members to highlight:

- Biography and professional interests.
- Skills and tools.
- Current learning goals.
- Projects and portfolio links.
- Publications, talks, certifications, and awards.
- Community contributions.
- Professional social links.

Provide an appropriate sharing option for LinkedIn and WhatsApp.

Profiles must only be publicly accessible when the member has explicitly opted in and an administrator has approved publication.

### E. Member Spotlights — /spotlights

Create a dedicated recognition hub featuring:

- New jobs and promotions.
- Certifications and completed learning programmes.
- Awards, grants, scholarships, and competition achievements.
- Conference talks and publications.
- Open-source contributions.
- Projects and product launches.
- Volunteer contributions and mentoring.
- Personal learning journeys.

Provide category filters and individual spotlight pages at /spotlights/[slug].

Each spotlight should include a title, member attribution, achievement description, publication date, optional image, relevant links, and sharing metadata.

Build a submission form so members can nominate themselves or another member. Do not publish a nomination automatically. Require editorial review and appropriate consent.

### F. Blog — /blog

Create an editorial section for:

- Tutorials and technical articles.
- Community announcements.
- Event recaps.
- Member interviews.
- Project case studies.
- Learning resources and career guidance.

Implement article pages at /blog/[slug], author attribution, publication dates, categories, tags, related articles, and social-sharing metadata.

Support Markdown or MDX for authoring. Use an architecture that allows an administrator to publish articles without manually editing page components.

Include search, category filtering, and sensible empty states.

### G. Events and Webinars — /events

Provide separate views for upcoming and past events.

Each event record should support:

- Title and description.
- Event category.
- Date, time, and timezone.
- Online or physical venue.
- Registration URL or registration form.
- Speaker names and biographies.
- Featured image.
- Event status.
- Recording URL.
- Slides, notes, and other resources.
- Related blog posts.

Create event detail pages at /events/[slug].

Display all event times accurately in West Africa Time where applicable. Clearly distinguish upcoming events from completed events.

Do not invent registration links or event details.

### H. Projects — /projects

Showcase member and community projects with:

- Project title and summary.
- Problem being addressed.
- Technologies used.
- Contributors.
- Repository, demonstration, and documentation links.
- Project category and publication date.

Allow members to submit projects for editorial review.

### I. Join the Community — /join

Build a clear, welcoming registration form.

Collect structured information according to the database schema described below.

Explain how the data will be used before collecting it. Include a privacy notice and separate, optional consent controls for public directory publication, member spotlights, and non-essential communications.

Validate all fields on both client and server sides.

After successful submission, display a confirmation message and explain the next steps. Do not promise automatic admission or publication.

Prevent accidental duplicate submissions and provide useful validation and error messages.

### J. Contact — /contact

Provide an enquiry form, official social links, and community contact information using configurable values.

Include appropriate spam protection and server-side validation.

### K. Privacy — /privacy

Explain the information collected, purposes of processing, visibility choices, retention, sharing, member rights, correction requests, withdrawal of consent, and contact details for privacy enquiries.

Use a privacy-conscious approach appropriate to Nigerian data-protection requirements. Flag any policy wording requiring legal review instead of claiming automatic compliance.

### L. Administration — /admin

Create protected administrative pages for authorised organisers.

The admin interface should support:

- Reviewing and approving registrations.
- Editing member records.
- Approving or declining public profiles.
- Managing visibility and consent records.
- Reviewing spotlight nominations.
- Creating, editing, publishing, and archiving articles.
- Managing events and webinars.
- Reviewing project submissions.
- Exporting authorised records.
- Viewing basic aggregate community statistics.

Implement secure authentication and server-enforced authorisation. Never rely on hiding an admin button in the frontend as a security measure.

## 6. Member database design

Use Supabase PostgreSQL for persistent data.

Design a normalised relational schema. At minimum, consider the following entities:

### members

- id: UUID primary key.
- display_name.
- full_name, private by default.
- slug, unique public identifier.
- email, private.
- professional_headline.
- biography.
- profile_image_url.
- location, optional and appropriately generalised.
- experience_level, optional.
- career_stage, optional.
- portfolio_url.
- linkedin_url.
- github_url.
- membership_status.
- profile_visibility.
- public_profile_approved.
- created_at.
- updated_at.

### skills

- id.
- name.
- slug.
- category.

### member_skills

- member_id.
- skill_id.
- optional proficiency level selected by the member.

### interest_groups

- id.
- name.
- slug.
- description.
- active_status.

### member_group_memberships

- member_id.
- group_id.
- participation preferences.

### consent_records

- id.
- member_id.
- consent_type.
- consent_status.
- policy_version.
- recorded_at.
- withdrawn_at, nullable.

Track consent for public directory visibility, optional spotlight or image publication, and optional communications separately.

### member_achievements

- id.
- member_id.
- achievement_type.
- title.
- description.
- achievement_date.
- evidence_url.
- image_url.
- publication_status.
- consent status or reference.
- created_at.

### spotlights

- id.
- member_id, where applicable.
- title.
- slug.
- summary.
- content.
- category.
- image_url.
- publication_status.
- published_at.
- created_at.

### articles

- id.
- title.
- slug.
- excerpt.
- content or content reference.
- author_id.
- category.
- tags.
- cover_image_url.
- publication_status.
- published_at.
- created_at.
- updated_at.

### events

- id.
- title.
- slug.
- description.
- event_type.
- start_at.
- end_at.
- timezone.
- venue.
- registration_url.
- speaker information.
- recording_url.
- resources.
- status.
- published_at.

### projects

- id.
- title.
- slug.
- summary.
- description.
- technologies.
- contributor references.
- repository_url.
- demo_url.
- publication_status.
- created_at.

### submissions

Use an appropriate submission or nomination table to support registration review, spotlight nominations, and project proposals where appropriate.

Add foreign keys, indexes, uniqueness constraints, timestamps, and suitable status fields.

Adjust the design where necessary to avoid duplicated data and inconsistent relationships. Explain important schema decisions.

## 7. Data privacy and security requirements

Treat member information as private unless explicitly approved for public use.

Implement:

- Supabase Row Level Security (RLS).
- Public access limited to approved, opted-in profile fields.
- Private access to email addresses and internal administrative notes.
- Administrator permissions enforced by trusted server-side code or properly configured database policies.
- Secure handling of service-role credentials.
- Server-side validation and sanitisation.
- Rate limiting and spam protection for public forms.
- Appropriate consent withdrawal and profile-unpublishing workflows.
- Protection against unauthorised bulk data extraction.
- Safe handling of uploaded profile and achievement images.
- Environment variables for secrets and environment-specific configuration.
- Clear database migration and backup guidance.

Never place a Supabase service-role key or other privileged secret in client-side code.

Do not assume that a hidden form field, unlinked page, or frontend-only check protects private data.

Allow members to request corrections, profile removal, or deletion of personal data subject to applicable legal and record-retention requirements.

## 8. Content management and administration

Build an organiser-friendly content workflow.

For the first version, favour the simplest reliable approach that supports:

- Member registration and approval.
- Spotlight submissions and publication.
- Article and event management.
- Project submissions.
- Public/private visibility controls.

If a custom admin interface is practical, build it. Otherwise, recommend a compatible content-management option and explain the trade-offs.

Keep the implementation maintainable. Do not introduce unnecessary services, paid dependencies, or a complex microservices architecture.

## 9. Technical requirements

Use:

- Astro with TypeScript.
- Tailwind CSS.
- Supabase PostgreSQL and Supabase Auth.
- Netlify for hosting and deployment.
- GitHub for source control.

Use server-side rendering or server functions where necessary for secure database operations. If using static generation, explain how dynamic member and content updates will become visible.

Include:

- Reusable layouts and components.
- Responsive navigation.
- Accessible semantic HTML.
- Keyboard navigation and visible focus states.
- Appropriate form labels and validation messages.
- Loading, success, error, and empty states.
- Custom 404 page.
- Page titles, descriptions, canonical URLs, and social-sharing metadata.
- Open Graph metadata for shareable member spotlights, articles, and events.
- Sitemap and robots.txt.
- Image optimisation.
- Sensible caching and database query strategies.
- Basic analytics that respect privacy.
- Automated tests for critical functionality.
- A clean GitHub repository structure.

Do not add non-functional buttons or placeholder links that appear operational.

## 10. Social sharing and community growth

Every published spotlight, article, project, and event should have a permanent, readable URL.

Implement appropriate Open Graph and social-sharing metadata so links shared on LinkedIn and WhatsApp have a useful title, description, and image.

Provide share links or copy-link functionality.

Create a consistent member-celebration template with the community identity, member name, achievement, and website URL.

If automated social posting is not implemented, clearly document a manual publishing workflow. Do not pretend the website can publish directly to LinkedIn or WhatsApp without appropriate integrations and permissions.

## 11. Deployment requirements

The website must be deployable to Netlify from a GitHub repository.

Provide:

- A complete README.
- Required environment variables in a documented .env.example.
- Supabase project setup instructions.
- Database migration files.
- RLS policies and setup instructions.
- Netlify build settings and configuration.
- Build and test commands.
- Local development instructions.
- A secure process for creating the first administrator.
- Deployment and smoke-test instructions.
- Troubleshooting guidance.
- Instructions for updating the website after deployment.
- Clear separation between development and production configuration.

Never commit real credentials, member records, or private exports to GitHub.

## 12. Implementation sequence

Work in these phases:

Phase 1: Product specification, sitemap, user journeys, component architecture, database schema, and privacy model.

Phase 2: Create the complete responsive public website with realistic but clearly labelled sample content.

Phase 3: Implement Supabase integration, registration forms, member directory, search, filtering, and public-profile approval.

Phase 4: Implement the admin interface, spotlight submissions, blog publishing, event management, and project submissions.

Phase 5: Implement security policies, validation, tests, SEO, and social-sharing metadata.

Phase 6: Configure Netlify deployment and produce complete documentation.

At the end of each phase, list the files created or changed, implementation decisions, tests performed, and any remaining limitations.

## 13. Definition of done

The project is complete when:

- All specified public pages work and share a consistent design.
- A visitor can submit a member registration.
- The registration is saved to the database and awaits review.
- An administrator can review and approve a member.
- A member appears in the public directory only when the required consent and approval conditions are satisfied.
- Private information cannot be retrieved through public pages or APIs.
- Search and skill/group filters work.
- Administrators can publish and manage spotlights, articles, projects, and events.
- Published pages have shareable URLs and appropriate metadata.
- The website passes its production build and critical tests.
- The project can be deployed from GitHub to Netlify using the documented instructions.

Start by presenting the proposed sitemap, user journeys, database relationships, and security model. Then implement the website in manageable phases. Make reasonable assumptions, document them, and ask questions only when a decision materially affects security, privacy, or the project's architecture.

Initial member registration fields:
- Name or preferred display name: Required for membership; ask separately whether the full name can be shown publicly.
- Email address: Private; for membership communication and duplicate detection.
- Skills and technologies: R, Python, SQL, Power BI, AI/ML, and others.
- Learning groups and interests: Helps organise relevant community activities.
- LinkedIn profile: Optional; useful for professional discovery and celebrating achievements.
- GitHub or portfolio: Optional; supports project discovery.
- Learning or career goals: Optional; helps match members to learning opportunities.
- Experience or career stage: Optional; useful for mentoring and peer groups.
- City or general location: Optional; avoid collecting a home address.
- Profile photo: Optional; obtain explicit permission before public use.
- Achievements and project highlights: Best collected through a separate spotlight submission form.


Keep achievements in a separate submission form so members can return later to share a new job, certification, project, publication, or speaking engagement.