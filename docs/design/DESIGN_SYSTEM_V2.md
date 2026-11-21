# FamilyOS Design System V2 — Product standard

Status: implementation starter; do not treat as audited for accessibility or production.

## Design thesis
**One world, two perspectives.** Explore is expressive for children around grade 5. Command is calm and information dense for adults. Both share typography, structure, controls and state semantics. The iconic observatory is used sparingly as authored visual identity, never as a substitute for data.

The product must feel art-directed rather than generically AI-generated: strong hierarchy, few meaningful colors, intelligent use of silence/space, authentic German microcopy, and a single scenic hero per relevant screen. No XP pressure, streak shaming, sibling comparison, or fabricated AI confidence.

## Foundations
- Canonical tokens: `src/styles/tokens.css`. All **new** components must consume semantic `--fo-*` variables rather than hardcoded hex values.
- Shared primitives: `src/components/ui.tsx` and `src/components/ui.css`.
- Interactive catalogue: `/design-system` (`src/app/design-system/page.tsx`).
- Existing Explore and Command screens retain legacy declarations temporarily. **Migration is incomplete** until they are refactored to canonical tokens.
- Dark is the current product default; the component catalogue includes a light variant, but full-application light mode is not yet implemented.
- Use 4/8pt rhythm, 44px minimum preferred tap targets, 15px body baseline in full-size screens, clear body contrast, predictable focus order, and reduced motion.
- Accent: violet = primary, mint = completion, amber = warning/decision. Avoid color-only meaning. Source/sync status is always textual.
- Each module reserves one visual emphasis: hero for Explore, agenda for Command, route for projects. Keep UI widgets restrained elsewhere.

## Core primitives and contracts
| Component | Contract |
|---|---|
| `ActionButton` | primary/secondary/success/quiet, visible focus, correct disabled behavior |
| `SurfaceCard` | quiet shared surface, no role-specific markup |
| `Eyebrow` | uppercase editorial section label |
| `SourcePill` | explicit source and demo/connected/stale states, never infer connection |
| `StatusChip` | text-first semantic status |
| `SectionHeading` | consistent heading hierarchy |
| `ProgressLine` | bounded value, readable numeric label, ARIA progress |
| `TaskTile` | semantic toggle button, no fake persistence |

## Roles and themes
Set `data-fo-role="child"|"parent"` for surface character; `data-fo-theme="dark"|"light"` for tonal variants. These are **display preferences**, not privileges. Real guardianship / patchwork permissions must be enforced server-side and with row-level security.

## Animation grammar
- Critical information never appears only as motion.
- 150–220ms default for feedback; no bouncing on every render.
- Honor prefers-reduced-motion; no forced confetti.
- Completion feedback must convey an outcome in text.
- Dialogs must support Escape, focus containment, and return focus to opener.

## Requirements for original visual assets
- Single design-led observatory panorama with two lighting treatments, stylized architecture, readable negative space for UI.
- One project-specific art keyframe per project category only if meaningful.
- Never commit stock watermarks, low-quality AI poster lettering, or unlicensed assets.
- Illustrations must not contain legible UI copy. Typography remains in code.
- Favor self-authored SVG and consistent lighting geometry; preserve performance.

## Prioritized migration plan
1. Ensure `npm install`, `npm run typecheck`, `npm run build` actually pass.
2. Replace legacy color and spacing declarations gradually with tokens while retaining screenshots.
3. Extract remaining large `page.tsx` sections into stable components.
4. Add story/visual tests and WCAG 2.2 AA checks for both themes and both roles.
5. Add real states: loading, blank, offline, stale connector, permission denied and conflict resolution.
6. Design iPhone navigation with safe-area insets and 200% text zoom.
7. Introduce accessible theme settings and age-appropriate preference controls.
8. Implement actual auth and per-child permission boundaries only in the appropriate domain sprint.

## Acceptance tests
- 320, 375, 390, 430, 820px viewport sanity; no cut text or inaccessible navigation.
- Keyboard focus always visible. VoiceOver labels describe action and state.
- No visual-only confirmation of a saved change.
- Screenshot comparison for Explore Today, Project Route, Calendar, Command Today and token catalogue.
- Contrast verification for dark/light: do not claim AA compliance without measurement.
- Core tasks can be completed quickly without exploring scenic artwork.
- Public repository has no personal family details, Google tokens or school credentials.
