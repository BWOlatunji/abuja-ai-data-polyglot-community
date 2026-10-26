export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const WAT_TIMEZONE = "Africa/Lagos";

export function formatEventDate(iso: string, timeZone: string = WAT_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeZone,
  }).format(new Date(iso));
}

export function formatEventTime(iso: string, timeZone: string = WAT_TIMEZONE): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
  const zoneLabel = timeZone === WAT_TIMEZONE ? "WAT" : timeZone;
  return `${time} ${zoneLabel}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(new Date(iso));
}

export function isEventUpcoming(startAtIso: string): boolean {
  return new Date(startAtIso).getTime() >= Date.now();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildShareLinks(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
  };
}
