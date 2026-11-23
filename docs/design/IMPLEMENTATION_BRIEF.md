# Claude Code — GAMEPLAN UI implementation brief

Read DESIGN_DIRECTION.md before changing UI. Implement in isolated reviewable increments. Never blindly replace existing app architecture or remove functional data integrations.

## Phase A: design foundations
- Inspect repository/framework and write a short inventory of current screens, dependencies and visual inconsistencies.
- Create semantic CSS tokens with light/dark + parent/child variants: bg, surface, surface-raised, text, text-muted, border, primary, focus, success, warning, child-tag-A/B. Document contrast.
- Build reusable components: AppShell, NavBar, PageHeader, SegmentedFilter, TimeRail, TimeRailEvent, MissionCard, ProgressMeter, AIProposalCard, SourceStatus, EmptyState, Skeleton.
- Respect reduced motion and provide no-motion fallback.
- Storybook or an equivalent UI catalogue where appropriate.

## Phase B: flagship prototype (fixture data, no backend writes)
- /design-preview/parent: real-look family dashboard. Filter across all / child A / child B; privacy by scope.
- /design-preview/child: missions + time rail + projects. Two 5th-grade profiles; no personally identifiable names in fixtures.
- /design-preview/study: timeline of school project milestones; AI proposal explainability.
- Responsive iPhone-first, iPad second, desktop third.
- No real calendar write or AI call in visual prototype. Visible DEMO label.

## Phase C: verify
- Screenshot tests at iPhone 390x844, 430x932, iPad 820x1180; light and dark.
- Keyboard and VoiceOver semantics audit, axe automated checks where available.
- Contrast and truncation checks in German text; date/time timezone Europe/Berlin; localization-ready.
- Unit tests for state and filters; never pretend that placeholder buttons work.
- No loss of functionality from existing app.

## Design acceptance
- It is neither childish nor corporate; looks like a real designed product rather than a generated AI poster.
- One crisp typography-led hero with exact time/action.
- Only blue and volt act as loud accent on core screens.
- Cards have varied information hierarchy but consistent spacing.
- Event origin and permissions are intelligible.
- Parents can approve AI schedule proposals; children can check tasks.
- No streak-shaming, leaderboard, or unsolicited motivational popups.
- Accessibility tests pass and animations respect user preferences.

## Delivery
Provide screen screenshots, list of changed files, test logs, decision log, and open risks. Open PR for review; don't merge without approval.
