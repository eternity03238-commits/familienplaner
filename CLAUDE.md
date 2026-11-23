# FamilyOS — Instructions for Claude Code

You are implementing a private family planning product with an ambitious but grounded visual identity. Treat the user’s existing decisions and the design files below as binding.

## FIRST READ
1. `docs/design/DESIGN_SYSTEM_V2.md`
2. `docs/design/DESIGN_DIRECTION.md`
3. `docs/design/PARENT_COMMAND_V1_3.md`
4. `docs/design/ITERATION_V1_2_AUDIT.md`
5. `README.md`

When older design guidance conflicts with `DESIGN_SYSTEM_V2.md`, follow V2. Preserve Explore’s cinematic observatory motif and Command’s calm dashboard; do NOT turn either into an off-the-shelf admin template.

## AI-DLC
Apply AI-driven Development Life Cycle (discover -> design -> implement -> validate -> review -> release). A feature is not done until tests run successfully and review evidence is documented.

## Current state
This repo contains a **demo**, not a production app. It has sample missions, an interactive project route, family filter demo, sample calendar fixtures and an explainable AI proposal demo. No real Google Calendar, school connectors, Supabase auth, persistence or actual AI calls are active.

## Core technical constraints
- TypeScript strict mode, Next.js and React.
- Build from shared `--fo-*` tokens and `src/components/ui.tsx` for new screens.
- Keep role styles separate from authorization checks. A parent/child toggle must never grant permissions.
- Prepare for arbitrary family sizes, family/household separation, patchwork per-child scoped grants, multiple auth/connector providers.
- Never write real child data into this public repository.
- Future AI suggestions are proposals, not autonomous backend changes. Validate before scheduling and require parental approval for significant actions.
- No unauthorized school scraping or use of secret APIs. Keep tokens server-side only.

## Next implementation steps
1. Run npm install, typecheck and build. Record real results (not assumed).
2. Run UI preview and inspect on iPhone widths, desktop, Safari if available.
3. Extract legacy monolithic components, migrate styling incrementally to tokens.
4. Build missing empty/loading/error/offline/permission states, then tests.
5. Verify focus, reduced motion, and color contrast, including 200% zoom.
6. Submit a PR with screenshots and an honest test report. Do not merge without approval.

## Definition of Done
Functionality works; visual consistency passes review; accessibility checks actually execute; no real private data in tests; no unauthorized integration; all changes are reversible and documented.
