# FamilyOS Explore — React Design Prototype

This repository currently contains **a visual demo**, not the production FamilyOS app. It uses fictional child profiles and local React state. There is no authentication, persistence, Google Calendar sync, school API integration, or backend. Do not enter real family data.

## Run locally

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Design System V2

Visit **http://localhost:3000/design-system** to compare shared components in dark/light and child/parent presentation modes. It includes interactive task toggles, progress, buttons, accessible status and source indicators.

Canonical design source: `docs/design/DESIGN_SYSTEM_V2.md`.
Semantic tokens: `src/styles/tokens.css`.
Reusable components: `src/components/ui.tsx` and `src/components/ui.css`.
Claude Code project rules: `CLAUDE.md`.

Run checks after installing dependencies:

```bash
npm run typecheck
npm run build
```

A GitHub Actions workflow in `.github/workflows/design-checks.yml` also runs these checks on pull requests. Check workflow results rather than assuming success.

## Demo navigation
- Mein Tag: complete/reopen a mission; progress changes.
- Kalender: select a weekday (the event list is a demo fixture).
- Missionen: same live mission state.
- Projekte: toggle steps for a sample presentation.
- Profil: switch Explorer / Tech theme.
- Side switch: view parent dashboard demo with an illustrative AI proposal.

## Design direction
Start with `docs/design/DESIGN_SYSTEM_V2.md`. Older exploratory notes in `DESIGN_DIRECTION.md`, `IMPLEMENTATION_BRIEF.md`, and `TOKENS.css` are historical references; V2 takes precedence.
The earlier standalone HTML preview remains available at `docs/design/preview.html`.

## Next tasks for Claude Code
1. Install dependencies, run typecheck/build and record actual logs.
2. Extract reusable page components, fixture data and semantic tokens.
3. Add accessibility tests, responsive screenshots and reduced-motion checks.
4. Integrate domain/auth only after approved architecture review.
5. Do not merge before build, UI review and security review.

Privacy: This repository is PUBLIC. Never commit actual student identities, school credentials, OAuth tokens, photos of minors or private calendar events.
