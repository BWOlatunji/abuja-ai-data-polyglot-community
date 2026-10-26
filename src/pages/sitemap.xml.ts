import type { APIRoute } from "astro";
import { siteConfig } from "../lib/config";
import { getPublicSupabase } from "../lib/supabase-public";

export const prerender = false;

const STATIC_PATHS = ["/", "/about", "/members", "/spotlights", "/blog", "/events", "/projects", "/join", "/contact", "/privacy"];

export const GET: APIRoute = async () => {
  const supabase = getPublicSupabase();

  const urls: Array<{ path: string; lastmod?: string }> = STATIC_PATHS.map((p) => ({ path: p }));

  if (supabase) {
    const [members, spotlights, articles, events, projects] = await Promise.all([
      supabase.from("members").select("slug, updated_at").eq("membership_status", "active").eq("profile_visibility", "public").eq("public_profile_approved", true),
      supabase.from("spotlights").select("slug, updated_at").eq("publication_status", "published"),
      supabase.from("articles").select("slug, updated_at").eq("publication_status", "published"),
      supabase.from("events").select("slug, updated_at").not("published_at", "is", null),
      supabase.from("projects").select("slug, updated_at").eq("publication_status", "published"),
    ]);

    (members.data ?? []).forEach((m: any) => urls.push({ path: `/members/${m.slug}`, lastmod: m.updated_at }));
    (spotlights.data ?? []).forEach((s: any) => urls.push({ path: `/spotlights/${s.slug}`, lastmod: s.updated_at }));
    (articles.data ?? []).forEach((a: any) => urls.push({ path: `/blog/${a.slug}`, lastmod: a.updated_at }));
    (events.data ?? []).forEach((e: any) => urls.push({ path: `/events/${e.slug}`, lastmod: e.updated_at }));
    (projects.data ?? []).forEach((p: any) => urls.push({ path: `/projects/${p.slug}`, lastmod: p.updated_at }));
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${new URL(u.path, siteConfig.url).toString()}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""}</url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
};
