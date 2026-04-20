# PoopCheck — Product Marketing Context

> **Purpose:** master context document every marketing skill and autonomous agent reads before doing anything. Keep it tight, true, and up-to-date. Stale context → stale output forever.
>
> **How to edit:** this is a living doc. When positioning, pricing, or audience shifts, update here first. All downstream marketing output (blog posts, programmatic pages, social, email) flows through this.

---

## 1. Product Overview

- **One-liner:** PoopCheck is the AI stool-analysis app that turns every bathroom trip into a data point for your gut health.
- **What it does (2–3 sentences):** Users photograph their stool. Our AI classifies it by Bristol Stool Scale type, color, and consistency; extracts health signals; and logs a daily gut-health score. Premium users get personalized reports, an AI digestive assistant (SOFTie), and trend analysis.
- **Product category:** consumer health / gut-health app (shelf alongside symptom trackers, period trackers, sleep trackers).
- **Type:** freemium mobile app (iOS + Android), 80k+ registered users.
- **Tech:** React Native client, Firebase backend, SoftAI API for vision + language.

### Business model

- **Free tier:** AI stool analysis, Bristol Scale classification, color & consistency analysis, basic tracking & history, community access, daily gut-health score.
- **Premium tier** (PoopCheck Premium): everything in Free + personalized health reports, SOFTie AI digestive assistant, advanced analytics & trends, export detailed reports, 2× reward points, premium badge, priority support.
- **Pricing:** PoopCheck Premium is **$6.99 USD/month** or **$49.99 USD/year** (annual = ~40% discount vs monthly). Free tier is permanent, no credit card required.

---

## 2. Target Audience

### Primary personas

**1. The chronic-gut adult (25–55):** has IBS, IBD (Crohn's/UC), chronic constipation, bloating, or long-standing unexplained stool abnormalities. Already Googles their symptoms weekly. Wants a structured way to spot patterns and communicate with their doctor. Pain: "I've tried three elimination diets and I still don't know what's wrong." Primary buyer of Premium.

**2. The data-driven health optimizer (28–45):** Oura/Whoop/Levels user. Treats gut as the next frontier of self-quantification. Not sick — just optimizing. Pain: "My wearable tracks everything except what I eat turning into." Shares PoopCheck data with a functional-medicine doc or coach.

**3. The anxious parent (infant/toddler):** checking if their baby's stool color is normal (green, yellow, mucus, red flag colors). High-volume Google queries; one-time visits unless they convert. Primary lever: reassurance + "when to see a doctor" framing.

**4. The post-procedure / post-diagnosis tracker:** recently had a colonoscopy, GI surgery, new diagnosis (SIBO, celiac, gastroparesis). Needs evidence of progress/regression. Short term but high-intent.

### Primary use case
> "I want to know what my stool is telling me about my health, and I want to spot patterns I'd otherwise miss."

### Jobs to be done
- **Functional:** classify today's stool objectively (Bristol type + color + consistency).
- **Emotional:** reduce anxiety by knowing whether something is normal.
- **Social:** give doctors/dietitians specific data instead of "I've been feeling off."

---

## 3. Problems & Pain Points

- **Core challenge:** stool is a real health signal most people don't track and can't describe accurately. Doctors ask vague questions and get vague answers.
- **Why current solutions fail:**
  - *Paper journals:* abandoned within weeks; subjective; lost.
  - *Generic symptom trackers (Cara Care, Bowelle, Bearable):* log symptoms, don't *classify* the stool itself. No AI vision. Manual Bristol selection is error-prone.
  - *Doctor visits alone:* infrequent, expensive, miss the pattern between visits.
- **What it costs users:**
  - Time: months of "elimination diets" without clear signal.
  - Money: unneeded tests, supplements, useless apps.
  - Emotional: chronic low-grade worry ("is this normal?") that doesn't resolve.
- **Emotional tension:** embarrassment (it's poop), fear (colon cancer anxiety is real), frustration (doctors don't always take gut complaints seriously until they're severe).

---

## 4. Competitive Landscape

### Direct competitors (same job — based on actual 2026 search competition)
- **Cara Care** — symptom + diet tracker, IBS/FODMAP-focused. Strength: dietitian network. Gap: no AI stool vision; log-heavy.
- **Dieta Health** — Cedars-Sinai-validated AI stool analysis. Strength: real clinical-study backing. Gap: clinical focus, fewer consumer-facing features; narrower audience.
- **Balloon** — currently featured in "best poop tracker 2026" roundups. Strength: UX polish, guided protocols. Gap: no AI vision, protocol-prescriptive.
- **Plop** — power-user tracker with deep customization. Strength: flexibility. Gap: no AI; steep learning curve.
- **Bowelle** — IBS-specific bowel logger. Strength: simple UI. Gap: manual classification, no AI.
- **mySymptoms / MyIBS** — manual symptom diaries. Strength: mature product. Gap: no AI photo analysis.
- **Stooly** — free-with-no-ads AI rival. Strength: price. Gap: accuracy/feature depth unclear.
- **CleverPoop / Poopalyzer / Poop Scanner AI** — AI-analyzer category. Various small apps.

### Secondary (overlapping job)
- **Bearable** — general symptom + habit tracker. Strength: customization. Gap: not gut-specific, no AI vision.
- **MyFitnessPal / Cronometer** — food logging only. Users often pair with PoopCheck.

### Category-level queries PoopCheck should own
"AI stool analysis app", "best AI poop tracker", "poop photo analysis app", "Bristol stool scale app with camera".

### Where PoopCheck wins
- **AI vision-based classification** — no other app does this. It's our moat.
- **Bristol + color + consistency simultaneously** — not just "did you go today."
- **Daily gut-health score** — one number users check and trend.
- **Scale** — 80k+ users' data informs the AI, which is a compounding advantage.

### Where competitors win (acknowledge honestly in comparison pages)
- Cara Care has a real dietitian-connection feature.
- Bearable is better if you're tracking 30 things, not just gut.

---

## 5. Differentiation

- **Only** app that classifies stool from a photo using dedicated AI vision.
- Bristol-aware **by design** — not a bolted-on checkbox.
- Privacy-first — photos are "processed securely and never shared with third parties" per [privacy policy](../src/pages/privacy.astro). Uses Firebase for auth/storage (Google's privacy terms apply). We do not sell personal data; we may share anonymized aggregated data for research. **Note:** the privacy policy does not currently state an explicit photo retention window — a gap worth closing in a future policy update, since users ask and it blocks some enterprise/health-data conversations.
- Daily score makes it sticky — users see a number; numbers compound habit.
- SoftAI integration gives us the AI substrate other apps can't replicate without an ML team.

---

## 6. Positioning Statement

> For adults who take their gut health seriously, PoopCheck is the AI stool-analysis app that turns every bathroom visit into objective data — unlike symptom-journal apps that rely on guesswork, PoopCheck classifies Bristol type, color, and consistency automatically and shows you the patterns you'd otherwise miss.

---

## 7. Brand Voice

- **Scientifically grounded:** cite sources (PubMed, NIH, Mayo, Cleveland Clinic, NHS) for every non-trivial medical claim. No vibes, no "studies show" without a study.
- **Empathetic, not preachy:** never shame dietary choices. Meet users where they are.
- **Direct:** short sentences. Active voice. Grade 8–10 readability for consumer content; grade 12 for `research`-category content.
- **Specific over general:** prefer "28 g of fiber/day for women" over "get enough fiber."
- **Honest about limits:** "we inform, we don't diagnose." Every symptom/condition page reminds users to see a doctor for red flags.

### What to avoid
- LLM-smell openers: "In today's fast-paced world…", "As an AI…", "In conclusion…"
- Em-dash-heavy prose (one em-dash per ~300 words is the ceiling).
- Moralizing about diet, alcohol, smoking, or weight.
- Hedging everything ("might possibly sometimes"). Commit to claims that sources support.
- Medical advice phrased as certainty. Always frame as "evidence suggests" / "one study found" when citing specific findings.

### Voice exemplars (read these before writing)
- [src/content/blog/bristol-stool-chart-types-explained.mdx](../src/content/blog/bristol-stool-chart-types-explained.mdx)
- [src/content/blog/mucus-in-stool.mdx](../src/content/blog/mucus-in-stool.mdx)
- [src/content/blog/fiber-and-stool-consistency.mdx](../src/content/blog/fiber-and-stool-consistency.mdx) — latest pipeline output, good reference

### Visual brand
- **Primary green:** `#A3FFBF`
- **Cyan accent:** `#9BF0FF`
- **Background dark:** `#121212`
- **Panel dark:** `#1a1a1a` / `#2a2a2a`
- **Text:** white on dark
- **Font:** Inter (already self-hosted)
- **SVG diagrams** must use only this palette.

---

## 8. YMYL Stance (critical for this niche)

PoopCheck content sits in **Google's YMYL (Your Money or Your Life)** zone — health/medical. This shapes every editorial decision:

- We **inform**, we don't **diagnose**.
- Every medical claim cites a primary or institutional source.
- Every symptom or condition mention recommends seeing a qualified clinician for red flags.
- We do **not** currently ship symptom decision trees or condition-specific guides without human medical review (explicitly deferred until a named medical reviewer is recruited).
- JSON-LD schema should include `MedicalWebPage` or `MedicalCondition` types where appropriate, not just `Article`.
- When in doubt between "publish faster" and "publish responsibly," we publish responsibly. A skipped run is strictly better than a misinforming post in YMYL.

---

## 9. North-Star + Secondary Metrics

- **North star:** organic **install-conversion** from SEO + AI-search referrals (Google, ChatGPT, Perplexity, Gemini). Target: growing organic sessions → growing installs with stable conversion rate.
- **Secondary metrics:**
  - Premium conversion rate from organic sessions (on $6.99/mo or $49.99/yr Premium).
  - AI-search mention rate (how often ChatGPT/Perplexity cites poopcheck.app when asked about stool questions).
  - Backlink acquisition (free tools + cornerstone pages should earn links).
- **Growth gap to flag**: no newsletter currently exists. Resend is installed but only used for the `/support` form. A newsletter (weekly digest from blog output + tool launches) is a real missed lever and a candidate for future work.

### App store ratings (use in schema, landing copy, social)
- **Apple App Store**: 4.5★ / 24 ratings (id: 6737857695).
- **Google Play**: 5.0★ / 56 ratings (id: com.softallthings.poopcheckapp).
- Combined (approximate, for `aggregateRating` schema): ~4.8★ / 80 ratings.

---

## 10. Top Keyword Clusters (draft — refine with real GSC data)

Ranked loosely by commercial + search-intent value. Agents should consult this before topic selection.

| Cluster | Example queries | Intent |
|---|---|---|
| Bristol scale | "bristol stool chart", "type 4 stool", "what does type 7 mean" | Informational → direct to cornerstone page |
| Stool color | "green poop", "black stool", "yellow stool", "pale stool causes" | Informational → blog + app CTA |
| Stool consistency | "why is my poop [x]", "floating stool", "mucus in stool" | Informational |
| Fiber & gut | "fiber for constipation", "soluble vs insoluble fiber", "fiber calculator" | Informational + tool |
| IBS | "IBS symptoms", "IBS diet", "low FODMAP" | Informational → careful YMYL handling |
| Constipation / diarrhea | "how to relieve constipation", "chronic diarrhea causes" | Informational |
| Gut microbiome | "improve gut health", "best probiotics", "microbiome testing" | Informational + product comparison |
| Bowel frequency | "how often should I poop", "healthy poop frequency" | Informational |
| Symptoms combos | "green stool + diarrhea", "black tarry stool" | High-intent, YMYL-heavy (handle carefully) |
| Stool tracking app | "stool tracker", "poop log app", "bristol scale app" | Commercial — direct competitor territory |
| PoopCheck alternatives | "PoopCheck vs Cara Care", "Poop Tracker alternatives" | Commercial → comparison pages |

[TODO — replace this table with actual top-20 clusters from Google Search Console + Ahrefs/Semrush data once available.]

---

## 11. Objections & Anti-Personas

### Top objections
1. *"Isn't this kind of gross?"* — Reframe: millions of people have gut issues and hide them. Having real data removes the stigma.
2. *"Why pay when I can just describe my poop to my doctor?"* — Because you can't, accurately. Try describing last Tuesday's Bristol type from memory. The app remembers and shows patterns.
3. *"Does my data stay private?"* — Photos are processed securely, never shared with third parties, and we don't sell personal data (see [privacy policy](https://poopcheck.app/privacy/)). We may share anonymized aggregated data for research purposes. Firebase (Google) handles auth/storage under their privacy terms.

### Anti-persona
Users looking for an AI doctor. PoopCheck is a tracker + classifier + pattern-surface-er, **not** a replacement for medical care. We say this explicitly.

---

## 12. Switching Dynamics (JTBD Four Forces)

- **Push:** paper journals that fail, generic trackers that feel like busywork, Google searches that return content farms instead of answers.
- **Pull:** "take a photo, get Bristol + color analysis in 2 seconds" is a step-change in ease.
- **Habit:** users already trust their existing tracker (even if it's bad) or have given up tracking.
- **Anxiety:** "will my photo be stored?" — privacy policy and onboarding copy address this directly.

---

## 13. Customer Language (verbatim — use these exact phrases)

### Positive — App Store / Google Play reviews
- *"Super helpful app and easy to use! The tracking/storage features are great"* — App Store
- *"Simple to use and it gives some interesting info with just a picture."* — App Store
- *"I love it! Great information given for free! Perfect way to store photos"* — App Store
- *"user friendly, funny features and the leaderboard just nails it! 5 stars worth it"* — Google Play
- *"Not bad for what it attempts"* — Google Play (tempered but honest)

### Negative / critical (know the objections)
- *"there have been errors identifying stool type by AI, and the inability to manually edit the type makes it impossible to make good use of the data"* — Google Play IBS user. **Actionable intelligence**: AI accuracy + manual-edit UX are weak points; users want control.
- *"I have been using it quite a bit and I found it quite buggy"* — App Store. **Actionable intelligence**: stability matters; triage app bugs before running big marketing pushes.
- *"Ai as usual needs work and is not a replacement for professional medical advice"* — Google Play. **Reinforces** the YMYL stance: "inform, not diagnose" must stay front-and-center.

### Language patterns observed in the gut-health space (Reddit r/ibs, r/ibd, r/crohnsdisease, JMIR IBD analysis)
- Users describe: *"tracking symptoms, managing medications, and coping with stress"*
- Symptom vocabulary: *"bloody stools, diarrhea, constipation, urgency, nausea, vomiting, bloating"*
- Emotional frame: "I worry about [color/consistency]" — the worry-about-normal pattern is the deepest pain.

### Phrases that work in headlines & copy
"gut health," "Bristol Scale," "track," "pattern," "decode your [color/consistency]," "what your poop is telling you," "AI stool analysis," "from a photo," "in seconds."

### Phrases to avoid
- "Bowel movement" — too clinical for headlines (fine in body).
- "Fecal" — clinical term, not consumer-friendly.
- Overt medical-advice framing ("diagnose," "treatment plan") — YMYL trap.
- Moralizing about diet or lifestyle.

### TODO (optional, lower priority)
- Pull full App Store / Google Play review corpus from App Store Connect + Play Console and extract additional verbatim quotes for future copy work. Public scraping only surfaces the first handful. Reddit has no direct PoopCheck mentions yet — app is still too small/new.

---

## Changelog

- **2026-04-20** — v1 seeded from session context.
- **2026-04-20** — v1.1 — resolved TODOs: pricing ($6.99/mo or $49.99/yr USD), privacy stance (per privacy.astro; retention window gap noted), newsletter status (doesn't exist — growth lever), competitors updated with 2026 search-demand competitors, verbatim customer language pulled from App Store/Play, app store ratings added for schema use.
