import { describe, it, expect } from "vitest";
import { listPublicMembers } from "../src/lib/data/members";
import { listPublishedArticles } from "../src/lib/data/articles";

// These run with no PUBLIC_SUPABASE_URL/ANON_KEY set (the default test
// environment), which is exactly the "Supabase not configured yet" state
// the sample-data fallback exists for.
describe("sample-data fallback", () => {
  it("listPublicMembers falls back to clearly-labelled sample data", async () => {
    const { members, isSample } = await listPublicMembers();
    expect(isSample).toBe(true);
    expect(members.length).toBeGreaterThan(0);
    expect(members.every((m) => m.isSample)).toBe(true);
  });

  it("listPublishedArticles falls back to clearly-labelled sample data", async () => {
    const { articles, isSample } = await listPublishedArticles();
    expect(isSample).toBe(true);
    expect(articles.every((a) => a.isSample)).toBe(true);
  });
});
