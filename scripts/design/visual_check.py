"""
Visual + accessibility verification for the GAMEPLAN preview (Phase C of docs/design/IMPLEMENTATION_BRIEF.md).
Requires a running build (`npm run build && npx next start`) on BASE_URL and Python Playwright with Chrome.
Per page x viewport x scheme: full-page screenshot, axe-core WCAG 2.2 AA scan, horizontal-overflow check,
touch-target check, keyboard focus visibility. Exit code 1 on any violation.
Usage: python3 -I scripts/design/visual_check.py [BASE_URL] [OUT_DIR]
"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3988"
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else ".design-check")
ROOT = pathlib.Path(__file__).resolve().parents[2]
AXE = (ROOT / "node_modules/axe-core/axe.min.js").read_text()
PAGES = {"home": "/", "overview": "/design-preview", "parent": "/design-preview/parent", "child": "/design-preview/child", "study": "/design-preview/study"}
VIEWPORTS = {"iphone-se-375": (375, 812), "iphone-390": (390, 844), "iphone-max-430": (430, 932), "ipad-820": (820, 1180), "desktop-1280": (1280, 900)}
SHOT_VIEWPORTS = {"iphone-390", "iphone-max-430", "ipad-820", "iphone-se-375", "desktop-1280"}

problems: list[str] = []
summary: list[dict] = []
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", args=["--no-proxy-server"])
    for scheme in ("light", "dark"):
        for vname, (w, h) in VIEWPORTS.items():
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if w < 800 else 1,
                                      color_scheme=scheme, locale="de-DE", timezone_id="Europe/Berlin", reduced_motion="reduce",
                                      has_touch=w < 800, is_mobile=w < 800)
            page = ctx.new_page()
            errors: list[str] = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            for pname, path in PAGES.items():
                tag = f"{pname}/{vname}/{scheme}"
                page.goto(BASE + path, wait_until="networkidle")
                page.evaluate("document.fonts.ready")
                if vname in SHOT_VIEWPORTS:
                    page.screenshot(path=str(OUT / f"{pname}--{vname}--{scheme}.png"), full_page=True)
                    if pname in ("parent", "child", "study"): page.screenshot(path=str(OUT / f"{pname}--{vname}--{scheme}--viewport.png"))
                overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                if overflow > 0: problems.append(f"{tag}: horizontal overflow {overflow}px")
                small = page.evaluate("""() => [...document.querySelectorAll('a,button,input,summary,label[for]')]
                    .filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
                      if (s.position === 'absolute' && r.width <= 1) return false;  // visually hidden native input (its label is the target)
                      if (e.matches('.fo-skip')) return false;
                      if (e.closest('p, li span') && e.tagName === 'A' && !e.closest('nav')) return false; // inline text links (WCAG 2.5.8 exception)
                      return r.width > 0 && (r.height < 24 || r.width < 24); })
                    .map(e => e.tagName + '.' + e.className + ' ' + (e.textContent||'').trim().slice(0,30))""")
                for s in small: problems.append(f"{tag}: target smaller than 24px: {s}")
                page.add_script_tag(content=AXE)
                res = page.evaluate("""async () => { const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } });
                    return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 4) })); }""")
                for v in res: problems.append(f"{tag}: axe {v['id']} ({v['impact']}) {v['nodes']}")
                # keyboard: first Tab lands on the skip link and it becomes visible
                page.evaluate("window.scrollTo(0, 0); document.activeElement && document.activeElement.blur()")
                page.keyboard.press("Tab")
                page.wait_for_timeout(120)
                focus = page.evaluate("""() => { const e = document.activeElement; const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
                    return { cls: e.className, visible: r.top >= 0 && r.height > 0, ring: s.boxShadow !== 'none' || s.outlineStyle !== 'none' }; }""")
                if "fo-skip" not in str(focus["cls"]) or not focus["visible"]: problems.append(f"{tag}: first Tab does not reveal skip link ({focus})")
                summary.append({"page": tag, "axe_violations": len(res), "overflow": overflow})
            for e in errors: problems.append(f"{vname}/{scheme}: console error: {e}")
            ctx.close()

    # Large text: 200% root font size must not overflow horizontally (WCAG 1.4.4 / 1.4.10)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="light", locale="de-DE", timezone_id="Europe/Berlin")
    page = ctx.new_page()
    for pname, path in PAGES.items():
        page.goto(BASE + path, wait_until="networkidle")
        page.add_style_tag(content="html{font-size:200%!important}")
        page.wait_for_timeout(50)
        overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        if pname in ("parent", "child"): page.screenshot(path=str(OUT / f"{pname}--iphone-390--text-200.png"), full_page=False)
        if overflow > 2: problems.append(f"{pname}/text-200%: horizontal overflow {overflow}px")
    # Interaction: child ticks a mission, parent filters and approves (state is local only)
    page.goto(BASE + "/design-preview/child", wait_until="networkidle")
    before = page.locator(".fo-progress__label").first.inner_text()
    page.get_by_label("Übungsblatt Brüche").check()
    after = page.locator(".fo-progress__label").first.inner_text()
    if before == after: problems.append("child: ticking a mission did not update progress")
    if "Erledigt: Übungsblatt Brüche" not in page.locator(".fo-live").inner_text(): problems.append("child: no live-region confirmation")
    page.goto(BASE + "/design-preview/parent", wait_until="networkidle")
    page.get_by_label("Kind B", exact=True).check()
    titles = page.locator(".fo-rail__title").all_inner_texts()
    if any("Fußball" in t for t in titles): problems.append("parent: filter Kind B still shows Kind A's football")
    page.get_by_label("Alle", exact=True).check()
    page.locator(".fo-proposal").first.get_by_role("button", name="Plan freigeben").click()
    if "Freigegeben" not in page.locator(".fo-proposal").first.inner_text(): problems.append("parent: approve did not update status")
    page.screenshot(path=str(OUT / "parent--iphone-390--after-approve.png"), full_page=False)
    ctx.close()
    browser.close()

(OUT / "check-summary.json").write_text(json.dumps({"checked": len(summary), "problems": problems, "pages": summary}, indent=2, ensure_ascii=False))
print(f"checked {len(summary)} page/viewport/scheme combinations, {len(problems)} problems")
for pr in problems[:80]: print(" -", pr)
sys.exit(1 if problems else 0)
