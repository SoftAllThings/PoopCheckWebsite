# PoopCheckWebsite

Marketing site for [poopcheck.app](https://poopcheck.app) — an AI stool-analysis app.
Astro + MDX + Tailwind, deployed to Cloudflare.

## Commands

| Command            | Action                                       |
| :----------------- | :------------------------------------------- |
| `npm install`      | Install dependencies                         |
| `npm run dev`      | Start local dev server at `localhost:4321`   |
| `npm run build`    | Build production site to `./dist/`           |
| `npm run preview`  | Preview build locally                        |
| `npm run deploy`   | Build + deploy to Cloudflare via wrangler    |

## Deployment

Every push to `master` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
which runs `npm ci && npm run deploy`. Two repo secrets are required:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Manual deploy: `npm run deploy` locally (requires `wrangler login`).

## Autonomous blog pipeline

A scheduled Claude Code agent writes and ships ~1 blog post per day, aiming for
Google + AI-search (ChatGPT, Perplexity) visibility.

**Moving parts:**

- [content-queue.json](content-queue.json) — topic backlog. Hand-edit freely to shape the
  content roadmap. Agent pops from `pending[]` by priority, moves to `published[]`.
- [.claude/agents/blog-writer.md](.claude/agents/blog-writer.md) — agent instructions
  (voice, SEO rules, SVG diagram rules, research protocol, self-review gate).
  Editing this file tunes the agent — changes take effect on the next run.
- Scheduled triggers (managed via the Claude Code `schedule` skill):
  - `blog-daily` — Mon–Sat 14:00 UTC, curated mode (from queue).
  - `blog-trending` — Sun 14:00 UTC, trending mode (web-discovery).

**Cadence:** agent commits directly to `master`; CI deploys. A bad post → `git revert`
and push, Cloudflare redeploys in ~2 min.

### Operations

- **Add topics**: edit `content-queue.json`, push. Agent picks them up on its next run.
- **Pause the pipeline**: disable/delete the triggers via the `schedule` skill. Crons stop immediately.
- **Retune the agent**: edit `.claude/agents/blog-writer.md`. No restart needed.
- **Roll back a bad post**: `git revert <commit> && git push origin master`.

### Content schema

Blog post frontmatter is validated by zod in [src/content.config.ts](src/content.config.ts).
See the file for the exact fields and the 7 allowed `category` values.
