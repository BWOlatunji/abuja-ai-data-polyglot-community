// Optional Cloudflare Turnstile verification. If TURNSTILE_SECRET_KEY is
// not set (e.g. local development), verification is skipped so the form
// still works - set it in production for real bot protection. See
// .env.example and README "Spam protection".
export async function verifyTurnstile(token: string | null, remoteIp: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured - allow through in dev

  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
    });
    const result = await response.json();
    return Boolean(result.success);
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}
