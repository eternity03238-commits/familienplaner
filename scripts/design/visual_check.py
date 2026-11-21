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
PAGES = {"home": "/", "design-system": "/design-system",
         "explore-today": "/explore", "explore-calendar": "/explore/kalender", "explore-missions": "/explore/missionen", "explore-project": "/explore/projekt", "explore-profile": "/explore/profil",
         "command-today": "/command", "command-calendar": "/command/kalender", "command-planning": "/command/planung", "command-profile": "/command/profil"}
VIEWPORTS = {"small-320": (320, 640), "iphone-se-375": (375, 812), "iphone-390": (390, 844), "iphone-max-430": (430, 932), "ipad-820": (820, 1180), "desktop-1280": (1280, 900)}
SHOT_VIEWPORTS = {"iphone-390", "desktop-1280"}

problems: list[str] = []
summary: list[dict] = []
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", args=["--no-proxy-server"])
    for scheme in ("dark", "light"):
        for vname, (w, h) in VIEWPORTS.items():
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=2 if w < 800 else 1,
                                      color_scheme=scheme, locale="de-DE", timezone_id="Europe/Berlin", reduced_motion="reduce",
                                      has_touch=w < 800, is_mobile=w < 800)
            if scheme == "light":
                ctx.add_init_script("try{localStorage.setItem('familyos.display', JSON.stringify({theme:'light', look:'explorer'}))}catch(e){}")
            page = ctx.new_page()
            errors: list[str] = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            for pname, path in PAGES.items():
                tag = f"{pname}/{vname}/{scheme}"
                page.goto(BASE + path, wait_until="networkidle")
                page.evaluate("document.fonts.ready")
                page.wait_for_timeout(60)
                if vname in SHOT_VIEWPORTS:
                    page.screenshot(path=str(OUT / f"{pname}--{vname}--{scheme}--viewport.png"))
                    if vname == "iphone-390": page.screenshot(path=str(OUT / f"{pname}--{vname}--{scheme}--full.png"), full_page=True)
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

    # Large text: 200% text size must not overflow horizontally (WCAG 1.4.4 / 1.4.10)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="de-DE", timezone_id="Europe/Berlin")
    page = ctx.new_page()
    for pname, path in PAGES.items():
        page.goto(BASE + path, wait_until="networkidle")
        page.add_style_tag(content="html{font-size:200%!important} body,.fo-app{zoom:1} :root{--fo-type-label:22px;--fo-type-small:26px;--fo-type-body:30px;--fo-type-title:56px}")
        page.wait_for_timeout(50)
        overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        if pname in ("explore-today", "command-today"): page.screenshot(path=str(OUT / f"{pname}--iphone-390--text-200.png"))
        if overflow > 2: problems.append(f"{pname}/text-200%: horizontal overflow {overflow}px")

    # Interactions (local demo state only)
    page.goto(BASE + "/explore", wait_until="networkidle")
    progress_before = page.locator(".fo-dayprogress strong").inner_text()
    page.locator(".fo-task", has_text="Übungsblatt Brüche").click()
    if page.locator(".fo-dayprogress strong").inner_text() == progress_before: problems.append("explore: ticking a mission did not update progress")
    if "Erledigt" not in page.locator(".fo-notice-slot").inner_text(): problems.append("explore: no text confirmation in live region")
    page.locator(".fo-task", has_text="Übungsblatt Brüche").click()  # reopen
    # Next move dialog: opens modal, focus inside, Escape closes, focus returns to opener
    opener = page.locator(".fo-nextmove")
    opener.click()
    page.wait_for_timeout(100)
    if not page.evaluate("!!document.querySelector('dialog.fo-dialog[open]')"): problems.append("explore: next-move dialog did not open")
    if not page.evaluate("document.activeElement && !!document.activeElement.closest('dialog')"): problems.append("explore: focus not moved into dialog")
    page.keyboard.press("Tab"); page.keyboard.press("Tab"); page.keyboard.press("Tab")
    if not page.evaluate("!!document.activeElement.closest('dialog')"): problems.append("explore: focus escaped the modal dialog")
    page.screenshot(path=str(OUT / "explore-dialog--iphone-390--dark--viewport.png"))
    page.keyboard.press("Escape"); page.wait_for_timeout(100)
    if page.evaluate("!!document.querySelector('dialog.fo-dialog[open]')"): problems.append("explore: Escape did not close dialog")
    if not page.evaluate("document.activeElement && document.activeElement.classList.contains('fo-nextmove')"): problems.append("explore: focus not returned to opener")
    # state survives tab navigation; stages toggle
    page.locator(".fo-task", has_text="Übungsblatt Brüche").click()
    page.get_by_role("link", name="Projekte").click(); page.wait_for_url("**/explore/projekt")
    page.get_by_role("button", name="Etappe abschließen").click()
    if "Etappe" not in page.locator(".fo-notice-slot").inner_text(): problems.append("explore: stage completion not announced")
    page.get_by_role("link", name="Mein Tag").first.click(); page.wait_for_url("**/explore")
    if "2 von 5" not in page.locator(".fo-feature").inner_text(): problems.append("explore: stage state lost across navigation")
    if "3 von 4" not in page.locator(".fo-dayprogress strong").inner_text(): problems.append("explore: mission state lost across navigation")
    # calendar weekday changes data
    page.get_by_role("link", name="Kalender").click(); page.wait_for_url("**/explore/kalender")
    tue = page.locator(".fo-rail__item").count()
    page.get_by_role("button", name="Do 26").click()
    if page.locator(".fo-rail__item").count() == tue: problems.append("explore: weekday switch did not change events")
    # command: filter, private redaction, approve
    page.goto(BASE + "/command", wait_until="networkidle")
    body = page.locator("main").inner_text()
    if "Termin Ärztin" in body: problems.append("command: private event title of other adult leaked")
    if "Treffen im Park" in body: problems.append("command: child's private event leaked to guardian")
    page.locator(".fo-filter__option", has_text="Kind B").click()
    if "Fußballtraining" in page.locator(".fo-rail").inner_text(): problems.append("command: filter Kind B still shows Kind A's football")
    page.locator(".fo-filter__option", has_text="Alle").click()
    page.locator(".fo-proposal").first.get_by_role("button", name="Plan freigeben").click()
    if "Freigegeben" not in page.locator(".fo-proposal").first.inner_text(): problems.append("command: approve did not update status")
    page.screenshot(path=str(OUT / "command-after-approve--iphone-390--dark--viewport.png"))
    # explore never shows sibling data
    page.goto(BASE + "/explore/kalender", wait_until="networkidle")
    for d in ["Mo 23", "Di 24", "Mi 25", "Do 26", "Fr 27"]:
        page.get_by_role("button", name=d).click()
        if "Schwimmen" in page.locator("main").inner_text(): problems.append(f"explore: sibling event visible on {d}")
    ctx.close()
    browser.close()

(OUT / "check-summary.json").write_text(json.dumps({"checked": len(summary), "problems": problems, "pages": summary}, indent=2, ensure_ascii=False))
print(f"checked {len(summary)} page/viewport/scheme combinations, {len(problems)} problems")
for pr in problems[:80]: print(" -", pr)
sys.exit(1 if problems else 0)
