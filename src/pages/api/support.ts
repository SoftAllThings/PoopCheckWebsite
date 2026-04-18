import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const SUPPORT_EMAIL = 'marco@softallthings.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, subject, message } = body as {
      email?: string;
      subject?: string;
      message?: string;
    };

    // Validate
    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Message must be under 2000 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = import.meta.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Support system is not configured.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(apiKey);

    const subjectMap: Record<string, string> = {
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

    const emailSubject = `[PoopCheck Web] ${subjectMap[subject || ''] || subject || 'Support Request'}`;

    const { error: resendError } = await resend.emails.send({
      from: 'PoopCheck Support <onboarding@resend.dev>',
      to: SUPPORT_EMAIL,
      replyTo: email.trim(),
      subject: emailSubject,
      text: [
        message.trim(),
        '',
        '---',
        `Reply Email: ${email.trim()}`,
        `Subject: ${subjectMap[subject || ''] || subject || 'N/A'}`,
        `Source: Website Contact Form`,
      ].join('\n'),
    });

    if (resendError) {
      console.error('Resend error:', resendError);
      return new Response(JSON.stringify({ error: 'Failed to send message. Please try again.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Support API error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
