import type { APIRoute } from 'astro';
// @ts-expect-error — provided at runtime by @astrojs/cloudflare
import { env } from 'cloudflare:workers';

export const prerender = false;

const ALLOWED_ORIGINS = ['https://poopcheck.app', 'https://www.poopcheck.app'];
const RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

type CfContext = { waitUntil?: (p: Promise<unknown>) => void };

const isAllowedOrigin = (origin: string | null, referer: string | null) => {
  const check = (u: string | null) => {
    if (!u) return false;
    try {
      const parsed = new URL(u);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
      return ALLOWED_ORIGINS.includes(`${parsed.protocol}//${parsed.host}`);
    } catch {
      return false;
    }
  };
  return check(origin) || check(referer);
};

const todayKey = (ip: string) => {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return `rl:analyze:${ip}:${ymd}`;
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const ctx = (locals as { cfContext?: CfContext }).cfContext;

  // 1. Origin / Referer check — weak on its own, but filters casual scripted abuse
  //    (Astro also enforces same-origin on POSTs at the framework level in v6.)
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  if (!isAllowedOrigin(origin, referer)) {
    return json(403, { error: 'Forbidden origin.' });
  }

  // 2. Config check — server-only secrets (no PUBLIC_ prefix).
  //    `env` comes from `cloudflare:workers` at runtime; in dev, Astro hydrates
  //    it from .env via Miniflare.
  const softAiUrl = (env as Record<string, string>).SOFTAI_API_URL;
  const softAiKey = (env as Record<string, string>).SOFTAI_API_KEY;
  if (!softAiUrl || !softAiKey) {
    console.error('SoftAI not configured — set SOFTAI_API_URL and SOFTAI_API_KEY');
    return json(500, { error: 'Analysis service is not configured.' });
  }

  // 3. Rate limit check — 1 successful analysis per IP per 24h
  const ip = clientAddress || request.headers.get('cf-connecting-ip') || 'unknown';
  const kv = (env as Record<string, unknown>).SESSION as KV | undefined;
  const rateKey = todayKey(ip);
  if (kv) {
    const already = await kv.get(rateKey);
    if (already) {
      return json(429, {
        error: 'daily_limit',
        message: "You've used your free daily AI analysis. Download the PoopCheck app for unlimited scans.",
      });
    }
  }

  // 4. Parse + validate image
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json(400, { error: 'Invalid form data.' });
  }
  const image = formData.get('image');
  if (!(image instanceof File)) {
    return json(400, { error: 'Image file is required.' });
  }
  if (image.size === 0) {
    return json(400, { error: 'Image is empty.' });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return json(400, { error: 'Image must be under 10MB.' });
  }
  if (!ALLOWED_MIMES.includes(image.type)) {
    return json(400, { error: 'Image must be JPEG, PNG, or WebP.' });
  }

  // 5. Optional Turnstile verification — activates only when secret is configured
  const turnstileSecret = (env as Record<string, string>).CF_TURNSTILE_SECRET;
  if (turnstileSecret) {
    const token = formData.get('cf-turnstile-response');
    if (typeof token !== 'string' || !token) {
      return json(403, { error: 'Bot verification required.' });
    }
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: token,
        remoteip: ip,
      }).toString(),
    });
    const verifyData = (await verify.json().catch(() => ({}))) as { success?: boolean };
    if (!verifyData.success) {
      return json(403, { error: 'Bot verification failed.' });
    }
  }

  // 6. Forward to SoftAI with server-side key.
  //    externalIndividualId pins every web-demo request to a single shared
  //    anonymous individual under the "PoopCheck Website" org, so backend
  //    analytics (softai.stool_logs) count website traffic as its own Org.
  //    Memory extraction is skipped server-side for this individual.
  const upstreamForm = new FormData();
  upstreamForm.append('image', image);
  upstreamForm.append('externalIndividualId', 'web-anonymous');

  const upstream = await fetch(`${softAiUrl}/softAi/stool/analyze?stream=1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${softAiKey}` },
    body: upstreamForm,
  });

  if (!upstream.ok || !upstream.body) {
    console.error('SoftAI upstream error:', upstream.status);
    return json(502, { error: 'Analysis service error. Please try again.' });
  }

  // 7. Tee the stream: pipe one copy to the client, inspect the other to decide
  //    whether the call succeeded. Only commit the rate-limit key on a real
  //    `result` event — failed analyses don't burn the user's daily quota.
  const [clientStream, inspectStream] = upstream.body.tee();

  const commitOnSuccess = async () => {
    if (!kv) return;
    try {
      const reader = inspectStream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let committed = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (!committed && /event:\s*result\b/.test(buffer)) {
          committed = true;
          await kv.put(rateKey, '1', { expirationTtl: RATE_LIMIT_TTL_SECONDS });
        }
      }
    } catch (err) {
      console.error('rate-limit inspection error:', err);
    }
  };

  if (ctx?.waitUntil) {
    ctx.waitUntil(commitOnSuccess());
  } else {
    // Dev fallback (no waitUntil): fire-and-forget.
    void commitOnSuccess();
  }

  return new Response(clientStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
};
