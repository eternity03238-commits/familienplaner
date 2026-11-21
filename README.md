# FamilyOS Explore — React Design Prototype

This repository currently contains **a visual demo**, not the production FamilyOS app. It uses fictional child profiles and local React state. There is no authentication, persistence, Google Calendar sync, school API integration, or backend. Do not enter real family data.

## Run locally

Requires Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Demo navigation
- Mein Tag: complete/reopen a mission; progress changes.
- Kalender: select a weekday (the event list is a demo fixture).
- Missionen: same live mission state.
- Projekte: toggle steps for a sample presentation.
- Profil: switch Explorer / Tech theme.
- Side switch: view parent dashboard demo with an illustrative AI proposal.

## Design direction
See `docs/design/DESIGN_DIRECTION.md`, `docs/design/IMPLEMENTATION_BRIEF.md`, and `docs/design/TOKENS.css`.
The earlier standalone HTML preview remains available at `docs/design/preview.html`.

## Next tasks for Claude Code
1. Install dependencies, run typecheck/build and record actual logs.
2. Extract reusable page components, fixture data and semantic tokens.
3. Add accessibility tests, responsive screenshots and reduced-motion checks.
4. Integrate domain/auth only after approved architecture review.
5. Do not merge before build, UI review and security review.

Privacy: This repository is PUBLIC. Never commit actual student identities, school credentials, OAuth tokens, photos of minors or private calendar events.
