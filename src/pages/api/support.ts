import type { APIRoute } from 'astro';
import { Resend } from 'resend';
// @ts-expect-error — provided at runtime by @astrojs/cloudflare
import { env } from 'cloudflare:workers';

export const prerender = false;

const SUPPORT_EMAIL = 'marco@softallthings.com';

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

type RateLimiter = { limit: (opts: { key: string }) => Promise<{ success: boolean }> };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Pretend success so bots don't learn which check caught them.
const silentDrop = () => json({ success: true });

export const POST: APIRoute = async ({ request }) => {
  try {
    // Browsers always send Origin on a cross-origin-capable POST; scripts usually don't.
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) {
      return json({ error: 'Forbidden.' }, 403);
    }

    const limiter = (env as Record<string, unknown>).SUPPORT_RATE_LIMITER as RateLimiter | undefined;
    if (limiter) {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        return json({ error: 'Too many messages. Please wait a minute and try again.' }, 429);
      }
    }

    const body = await request.json();
    const { email, subject, message, website, t } = body as {
      email?: unknown;
      subject?: unknown;
      message?: unknown;
      website?: unknown;
      t?: unknown;
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

    if (typeof subject !== 'string' || !(subject in SUBJECTS)) {
      return json({ error: 'Please choose a topic.' }, 400);
    }

    if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim())) {
      return json({ error: 'Valid email is required.' }, 400);
    }

    if (typeof message !== 'string' || message.trim().length < MIN_MESSAGE_LENGTH) {
      return json({ error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters.` }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` }, 400);
    }

    const apiKey = (env as Record<string, string>).RESEND_API_KEY;
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

    return json({ success: true });
  } catch (err) {
    console.error('Support API error:', err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};
