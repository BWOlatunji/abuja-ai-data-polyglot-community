// Admin-authored content (articles, spotlights) is stored as raw Markdown
// in the database and rendered at request time, so publishing never
// requires a code change or deploy. Sanitized with DOMPurify because the
// content ultimately comes from an authenticated admin's textarea, not a
// trusted build-time file - defence in depth against a compromised admin
// account or an XSS payload slipping through a future richer editor.
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
