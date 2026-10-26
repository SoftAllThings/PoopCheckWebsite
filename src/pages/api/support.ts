import type { APIRoute } from 'astro';
import { Resend } from 'resend';
// @ts-expect-error — provided at runtime by @astrojs/cloudflare
import { env } from 'cloudflare:workers';

export const prerender = false;

const SUPPORT_EMAIL = 'marco@softallthings.com';
const PUBLIC_SUPPORT_EMAIL = 'poopcheck@softallthings.com';

// Only the topics the site's forms actually offer. Anything else is a scripted
// request hitting the endpoint directly.
const SUBJECTS: Record<string, string> = {
  bug: 'Bug Report',
  account: 'Account Issue',
  subscription: 'Subscription / Billing',
  feature: 'Feature Request',
  feedback: 'General Feedback',
  other: 'Other',
  'api-access': 'B2B — API Access Inquiry',
  dataset: 'B2B — Dataset Licensing Inquiry',
  partnership: 'B2B — Partnership / Other',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;
// A human can't load the page, fill three fields and submit faster than this.
const MIN_FILL_MS = 3000;
// Successful sends per IP per UTC day, on top of the per-minute burst limiter.
const DAILY_LIMIT_PER_IP = 5;
const MAX_LINKS = 2;

// Placeholder and throwaway inbox domains nobody we can reply to would use.
const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com',
  'mailinator.com', 'guerrillamail.com', 'sharklasers.com', 'yopmail.com',
  '10minutemail.com', 'temp-mail.org', 'trashmail.com', 'getnada.com',
  'dispostable.com', 'maildrop.cc',
]);
const RESERVED_TLDS = ['test', 'example', 'invalid', 'localhost', 'local'];

type RateLimiter = { limit: (opts: { key: string }) => Promise<{ success: boolean }> };

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Pretend success so bots don't learn which check caught them.
const silentDrop = () => json({ success: true });

const dailyKey = (ip: string) => `rl:support:${ip}:${new Date().toISOString().slice(0, 10)}`;

// Rejects domains that don't exist or publish a null MX (RFC 7505), which is
// how example.com and similar declare they take no mail. Fails open on DNS
// errors so a resolver hiccup never blocks a real person.
async function domainReceivesMail(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(2000) },
    );
    if (!res.ok) return true;
    const data = (await res.json()) as { Status: number; Answer?: { type: number; data: string }[] };
    if (data.Status === 3) return false; // NXDOMAIN
    const mx = (data.Answer ?? []).filter((a) => a.type === 15);
    if (mx.length === 1 && /^0\s+\.?$/.test(mx[0].data.trim())) return false;
    return true;
  } catch {
    return true;
  }
}

async function verifyTurnstile(secret: string, token: unknown, ip: string): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }).toString(),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return data.success === true;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Browsers always send Origin on a cross-origin-capable POST; scripts usually don't.
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) {
      return json({ error: 'Forbidden.' }, 403);
    }

    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const vars = env as Record<string, unknown>;

    const limiter = vars.SUPPORT_RATE_LIMITER as RateLimiter | undefined;
    if (limiter) {
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        return json({ error: 'Too many messages. Please wait a minute and try again.' }, 429);
      }
    }

    const kv = vars.SESSION as KV | undefined;
    let sentToday = 0;
    try {
      sentToday = Number(await kv?.get(dailyKey(ip))) || 0;
    } catch (err) {
      console.error('support daily-limit read failed:', err);
    }
    if (sentToday >= DAILY_LIMIT_PER_IP) {
      return json(
        { error: `You've sent several messages today. Please email us at ${PUBLIC_SUPPORT_EMAIL} instead.` },
        429,
      );
    }

    const body = await request.json();
    const { email, subject, message, website, t, turnstileToken } = body as {
      email?: unknown;
      subject?: unknown;
      message?: unknown;
      website?: unknown;
      t?: unknown;
      turnstileToken?: unknown;
    };

    // Honeypot: the field is hidden from humans, so any value means a bot filled it.
    if (typeof website === 'string' && website.trim()) return silentDrop();

    // Milliseconds between page load and submit, measured in the browser so client
    // clock skew doesn't matter. Missing means the request didn't come from the
    // current form (or an old tab from before this check shipped).
    if (typeof t !== 'number' || !Number.isFinite(t)) {
      return json({ error: 'Please refresh the page and try again.' }, 400);
    }
    if (t < MIN_FILL_MS) return silentDrop();

    // Turnstile is enforced only once both halves exist: the site key baked into
    // the pages at build time and the secret on the Worker. Separate from
    // analyze.ts's CF_TURNSTILE_SECRET because the playground has no widget yet.
    const turnstileSecret = vars.TURNSTILE_SECRET_KEY as string | undefined;
    if (turnstileSecret && import.meta.env.PUBLIC_CF_TURNSTILE_SITEKEY) {
      if (!(await verifyTurnstile(turnstileSecret, turnstileToken, ip))) {
        return json({ error: 'Bot check failed. Please try again.' }, 403);
      }
    }

    if (typeof subject !== 'string' || !Object.hasOwn(SUBJECTS, subject)) {
      return json({ error: 'Please choose a topic.' }, 400);
    }

    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return json({ error: 'Valid email is required.' }, 400);
    }
    const domain = email.trim().split('@')[1].toLowerCase();
    if (
      BLOCKED_EMAIL_DOMAINS.has(domain) ||
      RESERVED_TLDS.includes(domain.split('.').pop() || '') ||
      !(await domainReceivesMail(domain))
    ) {
      return json({ error: 'Please use an email address we can reply to.' }, 400);
    }

    if (typeof message !== 'string' || message.trim().length < MIN_MESSAGE_LENGTH) {
      return json({ error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters.` }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` }, 400);
    }

    // One character repeated ("AAAA…", "xxxxxxxxxx") is never a real message.
    if (/^(.)\1*$/su.test(message.replace(/\s+/g, ''))) {
      return json({ error: 'Please describe your issue or question.' }, 400);
    }

    // Link spam: real support messages rarely carry more than a link or two, and
    // never HTML or BBCode anchors.
    const linkCount = (message.match(/https?:\/\/|www\./gi) || []).length;
    if (linkCount > MAX_LINKS || /<a\s|\[url[=\]]/i.test(message)) {
      return json(
        { error: `Messages with several links are blocked to stop spam. Please email us at ${PUBLIC_SUPPORT_EMAIL} instead.` },
        400,
      );
    }

    const apiKey = vars.RESEND_API_KEY as string | undefined;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return json({ error: 'Support system is not configured.' }, 500);
    }

    const resend = new Resend(apiKey);
    const topic = SUBJECTS[subject];

    const { error: resendError } = await resend.emails.send({
      from: 'PoopCheck Support <onboarding@resend.dev>',
      to: SUPPORT_EMAIL,
      replyTo: email.trim(),
      subject: `[PoopCheck Web] ${topic}`,
      text: [
        message.trim(),
        '',
        '---',
        `Reply Email: ${email.trim()}`,
        `Subject: ${topic}`,
        `Source: Website Contact Form`,
      ].join('\n'),
    });

    if (resendError) {
      console.error('Resend error:', resendError);
      return json({ error: 'Failed to send message. Please try again.' }, 500);
    }

    try {
      await kv?.put(dailyKey(ip), String(sentToday + 1), { expirationTtl: 24 * 60 * 60 });
    } catch (err) {
      console.error('support daily-limit write failed:', err);
    }

    return json({ success: true });
  } catch (err) {
    console.error('Support API error:', err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};
