"use client";
import { Moon, ShieldCheck, Sparkles, Sun, Telescope } from "lucide-react";
import { usePrefs } from "../Prefs.tsx";
import { Eyebrow, SectionHeading } from "../ui.tsx";

export function Profile() {
  const { look, setLook, theme, setTheme } = usePrefs();
  return (
    <>
      <header className="fo-viewhead"><Eyebrow as="p">Kind A · Klasse 5</Eyebrow><h1>Dein Look.</h1><p>Wähle den Stil, der zu dir passt. Inhalte bleiben gleich.</p></header>
      <section aria-labelledby="look" className="fo-stack">
        <SectionHeading id="look" title="Stil" />
        <div className="fo-choice" role="group" aria-labelledby="look">
          <button type="button" aria-pressed={look === "explorer"} onClick={() => setLook("explorer")}><Telescope size={22} aria-hidden="true" /><strong>Explorer</strong><small>Observatorium, Violett</small></button>
          <button type="button" aria-pressed={look === "tech"} onClick={() => setLook("tech")}><Sparkles size={22} aria-hidden="true" /><strong>Tech</strong><small>Nacht und Türkis</small></button>
        </div>
      </section>
      <section aria-labelledby="hell" className="fo-stack">
        <SectionHeading id="hell" title="Helligkeit" />
        <div className="fo-choice" role="group" aria-labelledby="hell">
          <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon size={22} aria-hidden="true" /><strong>Dunkel</strong><small>Standard</small></button>
          <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun size={22} aria-hidden="true" /><strong>Hell</strong><small>für helle Räume</small></button>
        </div>
      </section>
      <p className="fo-hint"><ShieldCheck size={19} aria-hidden="true" /><span>Keine Vergleiche mit anderen Kindern, keine Strafpunkte, keine Pflicht-Streaks.</span></p>
    </>
  );
}
