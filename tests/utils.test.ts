import { describe, it, expect } from "vitest";
import { slugify, initials, isEventUpcoming, truncate, buildShareLinks } from "../src/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Amaka Chukwu")).toBe("amaka-chukwu");
  });

  it("strips punctuation", () => {
    expect(slugify("Data & AI Community!")).toBe("data-ai-community");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });
});

describe("initials", () => {
  it("builds initials from up to two words", () => {
    expect(initials("Amaka Chukwu")).toBe("AC");
    expect(initials("Beyoncé")).toBe("B");
    expect(initials("One Two Three")).toBe("OT");
  });
});

describe("isEventUpcoming", () => {
  it("returns true for a future date", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    expect(isEventUpcoming(future)).toBe(true);
  });

  it("returns false for a past date", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    expect(isEventUpcoming(past)).toBe(false);
  });
});

describe("truncate", () => {
  it("leaves short text untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text with an ellipsis", () => {
    expect(truncate("hello world", 7)).toBe("hello…");
  });
});

describe("buildShareLinks", () => {
  it("builds LinkedIn, WhatsApp, and X share links containing the URL", () => {
    const links = buildShareLinks("https://example.com/post", "My Title");
    expect(links.linkedin).toContain(encodeURIComponent("https://example.com/post"));
    expect(links.whatsapp).toContain(encodeURIComponent("https://example.com/post"));
    expect(links.x).toContain(encodeURIComponent("https://example.com/post"));
  });
});
