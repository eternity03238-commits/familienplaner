#!/usr/bin/env python3
"""Measures real text-over-art contrast: hide the text, screenshot the scene with scrim, take the brightest 5 % of background
pixels under each text box, compare with the rendered text colour (WCAG 2.x)."""
import io, json
from PIL import Image
from playwright.sync_api import sync_playwright
import sys
BASE=sys.argv[1] if len(sys.argv)>1 else "http://127.0.0.1:8099/familienplaner"
def lum(c):
    c=[x/255 for x in c[:3]]; c=[x/12.92 if x<=0.04045 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def ratio(a,b):
    a,b=lum(a),lum(b); return (max(a,b)+.05)/(min(a,b)+.05)
rows=[]
with sync_playwright() as p:
    br=p.chromium.launch(channel="chrome",args=["--no-proxy-server"])
    for vw,vh,name in [(390,844,"iphone-390"),(1280,860,"desktop")]:
        pg=br.new_page(viewport={"width":vw,"height":vh})
        for tag,path,hero,sels,toggle in [("explore-dusk","/explore/",".fo-hero",[".fo-hero h1",".fo-hero p:not(.fo-eyebrow)",".fo-hero .fo-eyebrow"],False),
                                         ("explore-night","/explore/",".fo-hero",[".fo-hero h1",".fo-hero p:not(.fo-eyebrow)",".fo-hero .fo-eyebrow"],True),
                                         ("volcano","/explore/projekt/",".fo-project-hero",[".fo-project-hero h1",".fo-project-hero p:last-child",".fo-project-hero .fo-eyebrow"],False)]:
            pg.goto(BASE+path,wait_until="networkidle")
            if toggle: pg.locator(".fo-hero__toggle").click()
            pg.wait_for_timeout(400)
            boxes=[(s,pg.locator(s).first.bounding_box(),pg.eval_on_selector(s,"e=>getComputedStyle(e).color")) for s in sels]
            pg.add_style_tag(content=f"{hero} *:not(picture):not(img){{color:transparent!important;text-shadow:none!important}} {hero} .fo-hero__toggle{{visibility:hidden}}")
            pg.wait_for_timeout(100)
            img=Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
            for s,b,col in boxes:
                fg=tuple(int(x) for x in col[col.index("(")+1:col.index(")")].split(",")[:3])
                crop=img.crop((int(b["x"]),int(b["y"]),int(b["x"]+b["width"]),int(b["y"]+b["height"])))
                px=sorted(list(crop.get_flattened_data()) if hasattr(crop,"get_flattened_data") else crop.getdata(),key=lum)
                bright=px[int(len(px)*0.95)]
                rows.append({"view":f"{tag}/{name}","text":s.split()[-1],"bg95":"#%02X%02X%02X"%bright,"ratio":round(ratio(fg,bright),2)})
    br.close()
for r in rows: print(r)
m=min(r["ratio"] for r in rows)
print("min ratio", m)
sys.exit(0 if m>=4.5 else 1)
