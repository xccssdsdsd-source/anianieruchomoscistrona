---
name: website-excellence
description: Master build skill for premium, award-tier websites — agencies, boutique studios, real estate, portfolios, small business, SaaS landing pages — that never read as AI-generated. Merges frontend build rules, anti-AI-slop design discipline, an award-tier design-taste doctrine ("Awesome Design"), a 32-transition motion library (transitions-dev / transitions-polish), a Playwright-MCP-driven autopilot visual QA loop, and SEO/GEO. Use this for ANY request to build, redesign, restyle, or polish a website, landing page, or web app — "zrób stronę", "zaprojektuj landing", "popraw wygląd strony", "zdejmij z tego AI look", "make it look less AI-generated", "add micro-interactions", "polish the motion", "check if this looks good", "dopracuj tastem" — regardless of client industry. Also loads for a specific real-estate agent/agency/developer build, which additionally pulls in references/real-estate.md.
---

# Website Excellence — Master Build Skill

One skill, every client. Merges: frontend build rules, anti-AI-slop discipline, an award-tier design-taste doctrine (**Awesome Design**), the transitions.dev motion library, Playwright-driven self-QA, and SEO/GEO. This file is the orchestrator — it stays short on purpose. The depth lives in `references/`; each section below says exactly when to open which file.

## Response Style
No explanations unless asked. Code only. Action → what's next.
State assumptions in one line, then build. Never pad with meta-commentary ("I'll now create...", "Let's dive into...").

## Session Start — always invoke in this order
1. `frontend-design` skill (or equivalent design-token guidance) before any frontend code.
2. Read `references/awesome-design.md` in full and hold every layout, type, and color decision to it for the rest of the build. Award-tier is the floor, not the ceiling.
3. `transitions-dev` skill for any component-level interaction (modal, dropdown, badge, toast, tab, accordion, tooltip, hover state, form state, loading state). Install once per machine/project: `npx skills add Jakubantalik/transitions.dev`. Never hand-roll a transition the catalog already ships — see `references/motion.md`.
4. `gsap-lenis` skill for scroll-level motion (parallax, scroll reveals, smooth scroll, sticky pins) — page-level, complements `transitions-dev`'s component-level scope. Setup lives in `references/motion.md`.
5. `premium-ui-components` skill when building Next.js landing pages.
6. Run the **Pre-flight scan** (§0) before touching code.
7. Run the **Discovery gate** (§1) before picking a macrostructure — it decides whether `references/real-estate.md` loads too.
8. Before handing back the final version: `transitions-polish` skill (`transitions review` then `transitions polish`) to align every motion value to the shared token scale, then the full loop in `references/qa-playwright.md`. Install Playwright MCP once: `claude mcp add playwright npx @playwright/mcp@latest` (Claude Code), or the standard MCP config documented in that file for other clients.

Commit to ONE aesthetic direction before the first line. Execute without compromise.

## Project Type
Set at project level: `HTML` | `NEXTJS`
- HTML: single `index.html` per page, Tailwind CDN, all styles inline `<style>`, mobile-first.
- NEXTJS: component files, Tailwind via config, CSS vars in `globals.css`.

## Vertical module
This file plus `references/awesome-design.md` is the universal core — it applies to every client, every industry. If the client is a real-estate agent, agency, or developer, **also** load `references/real-estate.md` for the industry-specific discovery questions, components, structured data, and RODO handling. For every other client (studio, portfolio, SaaS, local business, restaurant, architecture firm, etc.) skip that file entirely — don't force real-estate patterns (listing cards, price tables) onto a client that doesn't have listings.

---

## 0. Pre-flight scan
If the project already has code, read it before writing anything: existing font stack, palette (`:root` tokens, `tailwind.config`), motion libraries already in `package.json` (check specifically for `transitions-dev`/`transitions-polish` and GSAP/Lenis before adding your own), spacing scale, framework. State findings in 3–5 lines: what's preserved, what's introduced. Skip silently on an empty project.

## 1. Discovery gate — ask once, briefly
Before building, get:
1. **Klient / branża** — kim jest klient i czym się zajmuje?
2. **Odbiorca** — kto ogląda tę stronę i co ma na niej zrobić?
3. **Jedna rzecz do zapamiętania** — co ma zostać w głowie odwiedzającego po 5 sekundach?
If the client is a real-estate agent/agency/developer, ask the two extra questions in `references/real-estate.md` §Discovery instead of inventing your own.
If the person says "rób" / doesn't answer, infer from the brief, state the inference in one line, and proceed. Do not loop follow-ups.

---

## 2. Anti-Slop Discipline — non-negotiable

The single biggest tell of an AI-built site is genericness: the same hero → 3-feature-cards → testimonial-carousel → footer rhythm every template ships. Refuse it structurally, not just visually.

### Structural variety
- Pick a **macrostructure** deliberately before writing code — not the reflexive hero/features/testimonials/CTA/footer stack. Credible alternatives: **Portfolio-Led** (best work as the hero proof — studios, agencies, freelancers), **Editorial** (long-form storytelling, product/work woven in — personal brands, boutique studios), **Product-First** (the thing itself, not marketing copy about it, dominates above the fold — SaaS, physical product), **Single-Statement** (one oversized idea fills the viewport, everything else is secondary — art, luxury, personal portfolios), **Catalog/Grid** (a browsable grid is the hero — shops, galleries, listings). Real-estate-specific alternatives (Listing-Led, Map-First, Single-Property Showcase) live in `references/real-estate.md`.
- Vary nav and footer shape too. Default away from "logo + 4 links + button" nav and "4-column footer + social row" — the two most recognizable AI fingerprints.
- If building multiple pages for the same client, they should share a design system (tokens) but each page's *section rhythm* should fit its actual content, not a copy-pasted shell.

### Honest content — never fabricate
- **Never invent**: testimonials, review counts/stars, client counts, "trusted by X", years of experience, team size, or awards, unless the client supplied the real number. Use a labelled placeholder (`— do potwierdzenia`) or omit the section entirely.
- Never invent product/service data (price, specs, availability) — pull from what the client provided or leave an explicit placeholder field, never a plausible-looking fake number.
- Never fabricate credentials, licences, or company history.
- Copy: avoid marketing sludge — "Twój wymarzony X czeka", "Odkryj idealne rozwiązanie", "Zaufaj ekspertom" — write specific, concrete copy tied to the actual client and market instead.

### Visual slop to refuse
- No generic purple/blue gradient backgrounds. No glassmorphism-everywhere. No floating 3D shapes with no purpose.
- No stock photography of anonymous smiling people, handshakes, or laptops-in-cafés — if the client has no real photos yet, use the client's actual work/product photos, an art-directed placeholder, or a clean typographic hero instead of stock-photo cliché. Full imagery rules in `references/awesome-design.md`.
- No re-drawn fake browser chrome, fake phone frames, or fake map/UI screenshots — embed the real thing or use a real screenshot in a plain `<figure>`.
- Every card/section must earn its place from actual content — don't wrap unrelated content in cards "because that's what templates do."

### Locked design tokens
Once a palette + type pairing is chosen, every color and font reference in the codebase must use a named CSS custom property (`var(--color-accent)`, `var(--font-display)`). No inline hex/OKLCH, no ad-hoc `font-family` declarations mid-file. If a new value is needed, add it to the token block first.

### Pre-ship self-check
Before handing back output, verify: does this look like *this specific client's* site, or could the copy/structure be swapped onto any other client's site with a find-and-replace? If the latter — revise.

---

## 3. Design Direction & the Design Excellence Bar
This is the core of the skill — read `references/awesome-design.md` in full before any layout, type, or color decision, not just skim it. It covers:
- Six design-direction archetypes to pick an extreme from and commit to (Boutique/Editorial, Modern-Minimal, Warm/Organic, Architectural/Luxury, Playful/Expressive, Brutalist/Technical).
- The Design Excellence Bar (hierarchy, whitespace, spacing rhythm, restraint, micro-details, the one deliberate "hero move").
- Palette Construction (OKLCH harmony models, 60-30-10, never navy-and-gold-or-purple-gradient by default).
- Typography, Composition & Grid, Imagery & Art Direction, Iconography, states-as-design-surface, dark mode, Depth, Spatial rules.
- The benchmark standard: Awwwards / SiteInspire / Land-book tier, never "does it look professional" or "does it match a competitor."

## 4. Motion
Two complementary systems, both delegated — see `references/motion.md` for the full setup and decision rules:
- **Component-level interactions** (modal, dropdown, badge, toast, tab, accordion, tooltip, hover/loading/error states) → the `transitions-dev` skill's 32-transition catalog. Never hand-write CSS/GSAP for one of these.
- **Page-level scroll motion** (parallax, scroll reveals, hero-load stagger, sticky pins, scroll counters) → GSAP + Lenis, setup code in that file.
- Before shipping: run `transitions review` / `transitions polish` (the `transitions-polish` skill) to align every duration/easing/distance/scale/blur value to the shared token scale.

## 5. Components
- Buttons: `0.65em 1.5em` padding, hover lifts + shadow deepens.
- Inputs: CSS var borders, accent focus ring, no browser defaults.
- Cards: hover state required (lift / glow / border reveal).
- Nav sticky: `backdrop-filter: blur` on scroll.
Component-level *transitions* for all of the above come from the `transitions-dev` catalog (§4) — this section is static styling only.

## 6. SEO & GEO
Technical SEO, structured data, local SEO, GEO (AI-answer-engine optimization), and performance targets — full detail in `references/seo-geo.md`. Real-estate-specific schema (`RealEstateListing`, `RealEstateAgent`) lives in `references/real-estate.md`.

## 7. Visual QA
Full loop — Playwright MCP navigation, multi-breakpoint screenshots, accessibility snapshot, console-error check, `prefers-reduced-motion` verification, and the self-critique pass against the Design Excellence Bar — in `references/qa-playwright.md`. Nothing is "done" until this loop passes clean.

## 8. Brand Assets
Check `brand_assets/` first. Real client assets (logo, photos, licence numbers) override all placeholders.

## 9. Libraries & Stack
Install commands, CDN snippets, and the component-library / reference-repo tables — `references/stack.md`.

---

## Hard Rules
- No content not in the brief/reference.
- Never `transition-all`.
- Never hand-roll a component-level transition (`transitions-dev` catalog) or a hand-tuned motion value the shared token scale already covers (`transitions-polish`).
- Never: purple gradients on white, generic navy-and-gold cliché as a default palette, cookie-cutter "hero/3-features/testimonials/footer" layout, fabricated stats/testimonials/reviews, stock handshake photos, fake browser/map chrome.
- Every form collecting contact data needs an explicit, non-dark-patterned consent checkbox where the client's market requires it (RODO/GDPR — see `references/real-estate.md` for the real-estate specifics).
- Nothing ships without a clean pass of the Playwright QA loop (`references/qa-playwright.md`).

## Pre-Ship Checklist
- [ ] Design held to `references/awesome-design.md` — one aesthetic direction, one hero move, on-grid spacing rhythm.
- [ ] Every component-level transition sourced from `transitions-dev`; `transitions review` shows no unmatched motion values.
- [ ] Lenis smooth scroll (if used) initialized and synced with ScrollTrigger.
- [ ] Every card/button has a real hover state; `prefers-reduced-motion` wraps all JS animation.
- [ ] Fonts preloaded, diacritics verified for the target market.
- [ ] Images: `loading="lazy"` below fold, `avif`/`webp`, `srcset`.
- [ ] No horizontal overflow at any of the six QA breakpoints (§ `qa-playwright.md`).
- [ ] Zero console errors/warnings.
- [ ] Background has depth (noise, gradient mesh, or layered gradients) — never flat, never a loud gradient.
- [ ] JSON-LD, sitemap, robots.txt, canonical tags in place per `references/seo-geo.md`.
- [ ] No fabricated stats, testimonials, or reviews anywhere on the site.
- [ ] Real-estate builds only: every item in `references/real-estate.md`'s own checklist.

## Reference files
| File | What's inside | Read it when |
|---|---|---|
| `references/awesome-design.md` | Design archetypes, Design Excellence Bar, palette construction, typography, composition/grid, imagery, iconography, states, dark mode, depth, spatial rules | Always, before any design decision |
| `references/motion.md` | `transitions-dev`/`transitions-polish` delegation rules, GSAP+Lenis scroll setup, parallax patterns | Any time motion is being added or reviewed |
| `references/qa-playwright.md` | Playwright MCP install, the full pre-ship visual QA loop | Before calling anything done |
| `references/seo-geo.md` | Technical SEO, JSON-LD (generic schema), local SEO, GEO for AI search, performance targets | Any indexable/public site |
| `references/stack.md` | Install commands, CDN snippets, component-library and reference-repo tables | Setting up a new project |
| `references/real-estate.md` | RE-specific discovery, anti-slop rules, listing/search/detail components, `RealEstateListing`/`RealEstateAgent` schema, RODO, maps | Client is a real-estate agent/agency/developer, and only then |
