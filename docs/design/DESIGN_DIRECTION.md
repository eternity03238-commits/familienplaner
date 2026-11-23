# FamilyOS / Design Direction — v2: GAMEPLAN

## Product thesis
GameSchool's mission-based structure is a useful reference, but FamilyOS must look older, more editorial, more authentic, and less AI-generated. Target: two grade-5 children (roughly 10–12) and two parents. One shared product, two tailored densities. Do not imitate GameSchool assets, brand, or layouts.

**Positioning:** "Your day. Your move." / "Heute läuft." FamilyOS is a confident utility with game-like feedback, not a fantasy game. Benchmark: the restraint of a high-end sports app + clarity of iOS + expressiveness of youth editorial design.

## Visual direction: GAMEPLAN
- Strong typography, distinctive hierarchy, asymmetric yet gridded compositions, crisp surfaces.
- Primary neutral: chalk #F6F5F1; ink #121318.
- Blue #355BFF (primary actions, navigation), Volt #D8FF3E (progress, focused highlights), muted graphite #747782; accent violet #7969EE optional for learning.
- Color is functional, never a rainbow applied to every card. Child-specific identifiers accessible by labels/icons, not color alone.
- One memorable hero component per screen, not 5 decorative banners.
- No glitter, glossy blobs, floating castles, 3D emoji, pseudo-game XP streak pressure, unmotivated gradients, giant emoji headings, or generic friendly chatbot mascot on every screen.
- Texture and authored character via geometry (diagonal rules, offset underline, clipped corner) and small, purpose-built vector motifs. Avoid stock imagery and AI illustration spam.
- Use real German interface language, not marketing slogans. Helpful humorous details limited to moments of success and error recovery.
- Prefer 8pt spacing grid; 16–20px card radii, not every item in a pill. Light 1px borders; restrained elevation.
- Editorial oversized headline only in the top viewport of the day's home. Data screens prioritize density/readability.

## Typography
Use a legible licensed open font (e.g. Geist or Inter) for body. Optionally use a licensed condensed display face for big headlines and mission numbers, with fallbacks. No font files committed unless licensing is verified. Body 15–16px min, line-height 1.45–1.6. Numbers tabular.

## Three signature moments
1. **Now / Next:** Screen is anchored by a bold next-action panel, with a single clear CTA.
2. **Time rail:** School, sport and study on an editorial vertical timeline, grouped chronologically. All-day events have distinct handling.
3. **Study forecast:** Instead of a magical AI card, a factual panel explains "Warum dieser Lernblock?" and shows its constraints, estimates and approve action.

## Parent mode
Faster overview: filter All / Child A / Child B; timeline + upcoming deadlines; AI suggestions require approval; private calendars are protected; calendar sync indicator and source metadata visible.

## Youth mode
Functional mission language, precise time estimates, progress 3/5 without punitive streaks; strong visual rhythm and bold typography; projects as milestones; optional personal themes with same design grammar.

## Mascot policy
No default mascots on productivity views. Optional small illustrated companion only in onboarding and occasional delight moments; never a permanently speaking character. Do not infantilize grade-5 users.

## Motion
120–220ms for microinteractions, spring transitions for task reorder under user control, 300ms max on routine navigations. Obey prefers-reduced-motion and avoid layout shifts. No animation on critical consent/permission prompts.

## Access and minors
WCAG 2.2 AA target, visible keyboard focus, 44px preferred touch targets, semantic controls, contrast-checked color pairs, non-color cues. Do not expose a child's progress in another household's context without access grant.

## Theme structure
Same tokens / components in two modes: calm parent and expressive child; no duplicate design system. Future patchwork mode reuses scope-aware filter and privacy-aware UI.

## Anti-AI-slop checklist
- Does this screen communicate its main action within 3 seconds?
- Can each colored element explain its semantic purpose?
- Are there fewer than three loud accents above the fold?
- Is the graphic asset truly necessary and art-directed?
- Is the copy specific, concise and non-generic?
- Does the layout vary in hierarchy without sacrificing consistency?
- Does reduced motion and large text still work?
