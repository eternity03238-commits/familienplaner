# FamilyOS Explore — Design Audit and V1.2 delivery

## What was missing in V1.1 (observed in code)
1. Project journey was a flat checkbox list without a selected stage or detail panel.
2. Calendar weekday controls changed only the highlighted date while events stayed the same.
3. Mission focus modal did not trap keyboard focus or support Escape.
4. The UI remained a giant `page.tsx` with presentation and fixtures mixed together.
5. Child/parent demo mode is not a security boundary; no production integrations exist.
6. Demo design still needs build, mobile screenshot and accessibility verification.

## Implemented in V1.2
- Five-stage **Expeditionsroute**: selected stop, description, estimated minutes and reversible completion.
- Day-specific **calendar fixture data** (still wholly fictional).
- Mission dialog: initial focus, Tab cycling, Shift+Tab cycling, Escape and focus return.
- CSS for journey route, selected/done states and focus visibility.
- Explicit reduced-motion styling for journey transitions.

## Prioritized work that still needs design/development
### P0 — before showcasing as working React demo
- Install dependencies and run `npm run typecheck` and `npm run build`. Fix actual errors.
- Run browser interaction test for each tab and project stage; verify keyboard focus behavior.
- Fix demo parent navigation: parent tabs currently show the same parent content, despite selected tab changing.
- Ensure date labels are clearly demo data and don't conflict with live date.
- Test at 320/390/430px; long German text and iOS Safari safe area.
- Extract `MissionRow`, `Journey`, `FamilyTimeline`, `Dialog`, and token definitions into separate components.

### P1 — next visual design sprint
- Original cohesive observatory landscape asset and 2 daylight states, with a restrained art direction. No repeated generic AI fantasy images.
- Parent Command: intentional information hierarchy (now/next, conflicts, approvals, sources) and a family member filter.
- Child Explore: clear homework/study/sport distinctions, deadline and workload priority states.
- Source and sync trust indicators (Google/Schule/manuell), no invented availability/status.
- Error, loading, empty and offline visual states; proper notification permission UX.
- 200% text zoom and VoiceOver accessibility; touch targets and contrast auditing.

### P2 — later
- Scope-aware patchwork permissions UI; explain exactly what gets shared and with whom.
- Child-customizable accessible visual themes with clear semantics.
- Fine-grained motion and sound opt-ins; no compulsory streaks, manipulative engagement or sibling ranking.

## Design acceptance
The family should identify the next action in under three seconds. Rich illustrations are reserved for one hero per screen. Parents get calm operational clarity, children get agency without infantilization, and no screen may rely on an AI-generated visual veneer to hide missing behavior.

## Safety
Repository is public. Only invented data may be included; no real children names, school logins, tokens, personal calendars or photos.
