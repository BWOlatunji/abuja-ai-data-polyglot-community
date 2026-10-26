import type { APIRoute } from "astro";
import { siteConfig } from "../lib/config";

export const prerender = false;

export const GET: APIRoute = () => {
  const body = `User-agent: *
Disallow: /admin
Disallow: /api
Allow: /

Sitemap: ${new URL("/sitemap.xml", siteConfig.url).toString()}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
