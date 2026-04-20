import { useState } from 'react';

type BristolType = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Question = {
  id: string;
  text: string;
  options: Array<{
    label: string;
    sublabel?: string;
    next: string | { type: BristolType };
  }>;
};

const questions: Record<string, Question> = {
  start: {
    id: 'start',
    text: 'How does your stool look overall?',
    options: [
      {
        label: 'Separate pieces',
        sublabel: 'Not one connected shape — several distinct lumps or blobs.',
        next: 'separate',
      },
      {
        label: 'One long piece',
        sublabel: 'Connected, log-shaped, holds together.',
        next: 'connected',
      },
      {
        label: 'Mushy or liquid',
        sublabel: 'No defined shape; fluffy, watery, or runny.',
        next: 'loose',
      },
    ],
  },
  separate: {
    id: 'separate',
    text: 'Are the pieces hard, or soft?',
    options: [
      {
        label: 'Small and hard — like nuts or pellets',
        sublabel: 'Painful or effortful to pass.',
        next: { type: 1 },
      },
      {
        label: 'Soft blobs with clear edges',
        sublabel: 'Pass easily despite being separate.',
        next: { type: 5 },
      },
    ],
  },
  connected: {
    id: 'connected',
    text: 'What does the surface look like?',
    options: [
      {
        label: 'Lumpy surface — sausage with visible bumps',
        sublabel: 'Holds together but you can see separate lumps.',
        next: { type: 2 },
      },
      {
        label: 'Cracks on the surface',
        sublabel: 'Sausage-shaped with cracks along it.',
        next: { type: 3 },
      },
      {
        label: 'Smooth, snake-like, soft',
        sublabel: 'Uniform, easy to pass.',
        next: { type: 4 },
      },
    ],
  },
  loose: {
    id: 'loose',
    text: 'Is it fluffy with ragged edges, or fully liquid?',
    options: [
      {
        label: 'Mushy pieces with ragged edges',
        sublabel: 'Still has some structure, but no defined shape.',
        next: { type: 6 },
      },
      {
        label: 'Completely liquid — no solid pieces',
        sublabel: 'Water with no chunks.',
        next: { type: 7 },
      },
    ],
  },
};

const typeInfo: Record<BristolType, {
  name: string;
  signal: string;
  signalColor: string;
  summary: string;
  slug: string;
}> = {
  1: { name: 'Type 1: Separate Hard Lumps', signal: 'Severe constipation', signalColor: '#ff6b6b', summary: 'Hard, dry, pellet-like pieces indicate significantly slow transit and over-absorption of water in the colon. Typically reflects low fiber, low fluid, or low movement.', slug: 'type-1' },
  2: { name: 'Type 2: Lumpy and Sausage-Shaped', signal: 'Mild to moderate constipation', signalColor: 'var(--color-accent)', summary: "Slow transit but less severe than Type 1. Often fixable with diet and hydration adjustments.", slug: 'type-2' },
  3: { name: 'Type 3: Sausage-Shaped with Cracks', signal: 'Healthy', signalColor: 'var(--color-primary)', summary: 'A healthy stool type. Transit time is appropriate; diet and hydration are supporting good digestion.', slug: 'type-3' },
  4: { name: 'Type 4: Smooth and Snake-Like', signal: 'Ideal — gold standard', signalColor: 'var(--color-primary)', summary: "The gold standard. Smooth, easy to pass, well-formed — reflects optimal digestion, transit, and hydration.", slug: 'type-4' },
  5: { name: 'Type 5: Soft Blobs with Clear Edges', signal: 'Slightly loose, usually normal', signalColor: 'var(--color-accent)', summary: 'On the soft side, but often normal for high-fiber or high-fruit diets. Worth investigating if it persists or comes with symptoms.', slug: 'type-5' },
  6: { name: 'Type 6: Mushy with Ragged Edges', signal: 'Mild diarrhea', signalColor: '#ffb86b', summary: 'Too-fast colon transit. Common triggers include intolerances, mild infection, stress, or certain medications.', slug: 'type-6' },
  7: { name: 'Type 7: Entirely Liquid', signal: 'Diarrhea', signalColor: '#ff6b6b', summary: 'Very rapid transit, often acute. Hydrate with electrolytes; see a doctor if it persists more than 48 hours or comes with red flags.', slug: 'type-7' },
};

export default function BristolQuiz() {
  const [current, setCurrent] = useState<string>('start');
  const [result, setResult] = useState<BristolType | null>(null);
  const [path, setPath] = useState<string[]>(['start']);

  const restart = () => {
    setCurrent('start');
    setResult(null);
    setPath(['start']);
  };

  const handleOption = (next: string | { type: BristolType }) => {
    if (typeof next === 'string') {
      setCurrent(next);
      setPath([...path, next]);
    } else {
      setResult(next.type);
    }
  };

  if (result !== null) {
    const info = typeInfo[result];
    return (
      <div className="rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-8 md:p-10">
        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{
            backgroundColor: `color-mix(in oklab, ${info.signalColor} 15%, transparent)`,
            color: info.signalColor,
            border: `1px solid color-mix(in oklab, ${info.signalColor} 30%, transparent)`,
          }}
        >
          {info.signal}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{info.name}</h2>
        <p className="text-[var(--color-text-muted)] leading-relaxed mb-6">{info.summary}</p>

        <div className="flex flex-wrap gap-3 mb-2">
          <a
            href={`/bristol/${info.slug}/`}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-text-dark)] font-semibold hover:opacity-90 transition-opacity"
          >
            Read the full {info.name.split(':')[0]} guide →
          </a>
          <a
            href="/bristol/"
            className="inline-flex items-center px-5 py-2.5 rounded-full border border-[var(--color-border)] text-[var(--color-text)] font-semibold hover:border-[var(--color-primary)]/50 transition-colors"
          >
            See all 7 types
          </a>
          <button
            onClick={restart}
            className="inline-flex items-center px-5 py-2.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Retake the quiz
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--color-border)]/30">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            Track this automatically — PoopCheck's AI classifies your Bristol type from a photo and builds your gut-health score over time.
          </p>
          <a
            href="/download/"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-text-dark)] font-semibold hover:opacity-90 transition-opacity"
          >
            Get PoopCheck free →
          </a>
        </div>

        <p className="mt-8 text-xs text-[var(--color-text-muted)] leading-relaxed">
          This quiz is for informational purposes only — it's based on the standard Bristol Stool Scale classification, not a medical diagnosis. If you have concerning symptoms (blood, persistent changes, severe pain), see a qualified clinician.
        </p>
      </div>
    );
  }

  const q = questions[current];
  const stepNumber = path.length;
  const totalEstimate = 3;

  return (
    <div className="rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-8 md:p-10">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide">
          Step {stepNumber} of {totalEstimate}
        </span>
        {stepNumber > 1 && (
          <button
            onClick={restart}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Start over
          </button>
        )}
      </div>

      <h2 className="text-2xl md:text-3xl font-bold mb-6">{q.text}</h2>

      <div className="flex flex-col gap-3">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleOption(opt.next)}
            className="text-left p-5 rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-bg)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all"
          >
            <div className="font-semibold text-[var(--color-text)] mb-1">{opt.label}</div>
            {opt.sublabel && (
              <div className="text-sm text-[var(--color-text-muted)]">{opt.sublabel}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
