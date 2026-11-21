# FamilyOS Explore — Design Iteration V1.1

## Creative direction: cinematic utility, not fantasy-game clone
The observatory becomes a restrained, recognizable identity device. **Atmosphere belongs mostly to the top hero and select project milestones.** The content below remains clear, structured and task-oriented. No mockup-only lighting obscuring text.

## Three signature moments now coded
1. **Scene toggle:** switch the observatory between dusk and night. This is user controlled, not a silently changing daylight clock. It respects reduced-motion preferences.
2. **Next Move:** the first incomplete mission gets a focused CTA. Its detail sheet offers a deliberate completion action, not fake AI productivity claims.
3. **Done feedback:** a compact text confirmation makes an action feel meaningful while remaining accessible to screen readers.

## Art direction for the next iteration
- Commission or create a **small original asset set**: 1 observatory panorama, 1 volcano milestone, 2 atmospheric variants. Use coherent art direction, not repeated text-to-image filler.
- Keep no more than one scenic illustration per viewport. The same world should not become a backdrop to every card.
- Use restrained purple and amber lighting for identity; use mint only for real completion, never as generic decoration.
- Ensure typography works without artwork and at large accessibility text sizes.
- Children 10–12: avoid cartoon infant expressions, forced streaks or sibling leaderboards.
- Parent Command: put actionable schedule and source credibility first; visual world appears as a small accent only.
- Patchwork privacy later: all cross-household views must be scope-aware; never use decorative family-avatar clusters as a shortcut to authorization.

## Design QA to complete before merge
- Run `npm install && npm run typecheck && npm run build`.
- Verify on iPhone Safari and desktop keyboard; test 320px, 390px, 430px, 768px.
- Add a proper focus trap and Escape handling to mission dialog, or refactor to a native dialog primitive.
- Add visual screenshots for Today, Project, Calendar and Parent views; verify dark contrast and 200% text.
- Make weekday selection show matching day-specific fixtures; currently it only changes the selection.
- Verify all control labels, status announcements and reduced-motion support.
- Parent/child view toggle is purely demo, **not an authentication boundary**.
- UI is demo state only: no persistence and no third-party connections.
