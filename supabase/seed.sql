-- ============================================================================
-- DEVELOPMENT SEED DATA ONLY
-- ============================================================================
-- Run manually against a LOCAL or STAGING Supabase project if you want to
-- see the site with real database rows instead of the built-in sample-data
-- fallback (see src/lib/data/*.ts). Every name, bio, and achievement below
-- is fictional placeholder content for layout/testing purposes.
--
-- DO NOT run this against a production project. DO NOT commit real member
-- data to this file.
--
--   supabase db execute -f supabase/seed.sql   (or psql "$DATABASE_URL" -f supabase/seed.sql)
-- ============================================================================

insert into skills (name, slug, category) values
  ('Python', 'python', 'programming'),
  ('R', 'r', 'programming'),
  ('SQL', 'sql', 'programming'),
  ('Power BI', 'power-bi', 'bi-tools'),
  ('Machine Learning', 'machine-learning', 'ai-ml'),
  ('Deep Learning', 'deep-learning', 'ai-ml'),
  ('Data Engineering', 'data-engineering', 'data'),
  ('Public Health Analytics', 'public-health-analytics', 'domain')
on conflict do nothing;

insert into interest_groups (name, slug, description, active_status) values
  ('Python for Data Analysis', 'python-data-analysis', 'Weekly practice group for pandas, numpy, and visualisation.', true),
  ('Machine Learning Study Circle', 'ml-study-circle', 'Reading group working through applied ML courses together.', true),
  ('SQL & BI Practitioners', 'sql-bi-practitioners', 'For analysts working with SQL, Power BI, and dashboards.', true),
  ('R Users Nigeria — Abuja Chapter', 'r-users-abuja', 'Local chapter for R programmers and statisticians.', true)
on conflict do nothing;

-- A fictional sample member, placeholder only.
insert into members (
  display_name, full_name, slug, email, professional_headline, biography,
  experience_level, career_stage, linkedin_url, github_url,
  membership_status, profile_visibility, public_profile_approved
) values (
  'Sample Member (Placeholder)', 'Sample Member Full Name', 'sample-member-placeholder',
  'sample.member.placeholder@example.com', 'Data Analyst (sample profile)',
  'This is a placeholder biography used only to preview layout and styling. It does not describe a real community member.',
  'intermediate', 'early_career', null, null,
  'active', 'public', true
) on conflict do nothing;
