# FamilyOS Command Center — Design v1.3

## Direction
The parent experience should feel like the control deck of the same FamilyOS world: sophisticated deep-indigo surfaces, restrained amber highlights, warm premium typography, crisp time rails, and a minimal amount of scenic decoration. All important status must be text-accessible.

## New demo implementation
- `src/app/ParentCommand.tsx`: dedicated role-specific React screen, not a duplicate of the child dashboard.
- Today: counts, conflict notice, family timeline and a fictional AI suggestion.
- Member filter: All, Child A, Child B. Filters actually affect the family event timeline. A filter is **only a view control**, not authorization.
- Calendar: demonstrative weekday selector with day-specific empty state.
- Planning: sample workload cards and proposal controls.
- Profile: family/child relationship presentation and disclosure that patchwork sharing is not yet implemented.
- Proposal: expandable “why?” explanation; reject and demo-approve states. **No backend actions.**
- Visual system in `src/app/globals.css`: semantic emphasis, time rail and muted operational palette.

## Product critique and remaining work
### P0 Engineering checks
1. Install dependencies; run `npm run typecheck` and `npm run build` with actual logs. Do not claim passing tests without execution.
2. Browser verify 320, 375, 390, 430 widths; iPhone Safari, VoiceOver and keyboard.
3. Child missions dialog: test trapped focus and focus return after dialog close.
4. Extract fixtures into test-data modules; ensure selectors and components have unit tests.
5. Make parent and child navigation role-specific through separate routes after real auth is available; demo toggle is not secure.
6. Add visible loading, error, sync stale and offline states before live integrations.

### P1 Design and product evolution
- Better source badges for Google, school portal and manual entries (no invented real sync status).
- Parent “Today + Next + Risks” information hierarchy and compact calendar detail sheet.
- School exam countdown without anxiety-inducing pressure.
- Original Observatorium brand illustrations: limited to hero and select project moments.
- Light accessibility theme; current dark-first token design isn't enough for all users.
- Shared component primitives and token files rather than parallel CSS patches.

### P2 Future architecture
- Patchwork: household-specific child-scoped view only after verified guardianship/access grants; careful empty states for restricted access.
- Multi-family navigation only after platform tenancy and RLS are implemented.

## UX writing rules
Use practical, understated German. Avoid fake AI certainty, invented calendar confirmations, XP pressure and forced streaks. Show data provenance and clearly distinguish AI proposals from saved plans.

## Security
Current repository is public; use only fictional data. Never commit actual child names, school IDs, family email addresses, API credentials or calendar events.
