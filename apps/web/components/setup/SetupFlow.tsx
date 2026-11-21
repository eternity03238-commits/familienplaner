"use client";
/**
 * Family setup (Sprint 1). Layout from the owner's design (commit e822036): scenic art panel that
 * personalises while you type + one step per screen with a progress bar. Preview mode: nothing is sent
 * or stored; the real flow calls the 0004 RPCs through the same steps.
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, Plus, QrCode, Share2, Smartphone, X } from "lucide-react";
import { artUrl } from "../../lib/art/paths.ts";
import { usePrefs } from "../Prefs.tsx";
import * as flow from "../../lib/setup/flow.ts";
import styles from "../../app/einrichten/setup.module.css";

const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";
const CHILD_TONES = ["school", "sport", "family"] as const;
const tone = (i: number) => CHILD_TONES[i % CHILD_TONES.length];

export function SetupFlow() {
  const { theme } = usePrefs();
  const [st, setSt] = useState<flow.SetupState>(flow.initialState);
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [pairing, setPairing] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Move focus to the new step's heading so screen readers announce it (not on first load).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [st.step]);

  const go = (step: flow.Step) => { setTouched(false); setPairing(null); setSt(s => ({ ...s, step })); };
  const problem = flow.blocker(st);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (st.step === "konto" && !st.codeSent) {
      if (flow.validEmail(st.email)) { setTouched(false); setSt(s => ({ ...s, codeSent: true })); }
      return;
    }
    if (st.step === "konto" && !st.signedIn) {
      if (flow.validCode(code)) { setTouched(false); setSt(s => ({ ...s, signedIn: true, step: "familie" })); }
      return;
    }
    if (!problem) go(flow.next(st.step));
  };

  const kids = flow.namedChildren(st);
  const family = flow.cleanName(st.familyName);
  const done = st.step === "fertig";
  const num = flow.stepNumber(st.step);

  return (
    <main className={styles.page} data-fo-role="parent" data-fo-theme={theme} id="inhalt">
      <a className="fo-skip" href="#setup-title">Zum Inhalt springen</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark from the owner's design, nothing to optimise */}
          <img src={`${ASSET_BASE}/art/v3/familyos-symbol.svg`} width={36} height={36} alt="" />
          FamilyOS<span className="fo-sr-only">, zur Startseite</span>
        </Link>
        <span>Einrichtung · Vorschau</span>
      </header>

      <div className={styles.panel}>
        <div className={styles.art} data-done={done}>
          <Scene time="dusk" active={!done} />
          <Scene time="night" active={done} />
          <div className={styles.caption} aria-live="polite">
            <span>{done ? "Alles bereit" : "Familienplaner"}</span>
            <strong>{family ?? "Eure Familie"}</strong>
            {kids.length > 0 && (
              <ul className={styles.crew} aria-label="Kinder">
                {kids.map((c, i) => <li key={c.key} data-tone={tone(i)}><i aria-hidden="true">{c.name[0]}</i>{c.name}</li>)}
              </ul>
            )}
          </div>
        </div>

        <section className={styles.content} aria-labelledby="setup-title">
          {num && (
            <div className={styles.progress}>
              <span>Schritt {num} von {flow.STEP_COUNT} · {flow.STEP_TITLE[st.step]}</span>
              <div role="progressbar" aria-label="Fortschritt der Einrichtung" aria-valuemin={1} aria-valuemax={flow.STEP_COUNT} aria-valuenow={num} aria-valuetext={`Schritt ${num} von ${flow.STEP_COUNT}`}>
                {Array.from({ length: flow.STEP_COUNT }, (_, i) => <i key={i} data-filled={i < num} />)}
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate>
            {st.step === "konto" && (!st.codeSent ? <>
              <Title innerRef={heading}>Willkommen bei FamilyOS</Title>
              <p>Melde dich mit deiner E-Mail-Adresse an. Du bekommst einen 6-stelligen Code, ein Passwort brauchst du nicht.</p>
              <Field label="E-Mail-Adresse" error={touched && !flow.validEmail(st.email) ? "Bitte eine gültige E-Mail-Adresse eingeben." : null}>
                {p => <input {...p} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                  value={st.email} onChange={e => setSt(s => ({ ...s, email: e.target.value }))} placeholder="name@example.com" />}
              </Field>
              <Primary><Mail size={18} aria-hidden="true" />Code senden</Primary>
            </> : <>
              <Title innerRef={heading}>Code eingeben</Title>
              <p>Wir haben einen Code an <strong>{st.email.trim()}</strong> geschickt. Er ist 10 Minuten gültig.</p>
              <Field label="6-stelliger Code" error={touched && !flow.validCode(code) ? "Bitte den 6-stelligen Code aus der E-Mail eingeben." : null}>
                {p => <input {...p} className={styles.code} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" />}
              </Field>
              <Primary>Anmelden</Primary>
              <button type="button" className={styles.quiet} onClick={() => { setCode(""); setTouched(false); setSt(s => ({ ...s, codeSent: false })); }}>Andere E-Mail-Adresse verwenden</button>
            </>)}

            {st.step === "familie" && <>
              <Title innerRef={heading}>Wie heißt eure Familie?</Title>
              <p>Gib eurem gemeinsamen Kalender einen Namen und trag deinen Vornamen ein.</p>
              <Field label="Familienname" error={touched && !family ? "Bitte einen Familiennamen eingeben (bis 60 Zeichen)." : null}>
                {p => <input {...p} maxLength={flow.NAME_MAX} value={st.familyName} onChange={e => setSt(s => ({ ...s, familyName: e.target.value }))} placeholder="z. B. Familie Sommer" />}
              </Field>
              <Field label="Dein Vorname" error={touched && !flow.cleanName(st.myName) ? "Bitte deinen Vornamen eingeben (bis 60 Zeichen)." : null}>
                {p => <input {...p} maxLength={flow.NAME_MAX} autoComplete="given-name" value={st.myName} onChange={e => setSt(s => ({ ...s, myName: e.target.value }))} placeholder="z. B. Alex" />}
              </Field>
              <Primary>Weiter</Primary>
            </>}

            {st.step === "kinder" && <>
              <Title innerRef={heading}>Wer gehört zu euch?</Title>
              <p>Trag die Vornamen eurer Kinder ein. Schule und Klasse könnt ihr später ergänzen.</p>
              <ul className={styles.rows}>
                {st.children.map((c, i) => (
                  <li key={c.key}>
                    <Field label={`Kind ${i + 1}`} error={null}>
                      {p => <input {...p} maxLength={flow.NAME_MAX} autoComplete="off" value={c.name} onChange={e => setSt(s => flow.renameChild(s, c.key, e.target.value))} placeholder="Vorname" />}
                    </Field>
                    {st.children.length > 1 && (
                      <button type="button" className={styles.icon} onClick={() => setSt(s => flow.removeChild(s, c.key))} aria-label={`${c.name.trim() || `Kind ${i + 1}`} entfernen`}><X size={18} aria-hidden="true" /></button>
                    )}
                  </li>
                ))}
              </ul>
              {st.children.length < flow.MAX_CHILDREN && (
                <button type="button" className={styles.secondary} onClick={() => setSt(flow.addChild)}><Plus size={18} aria-hidden="true" />Weiteres Kind</button>
              )}
              {touched && problem && <p className={styles.error} role="alert">{problem}</p>}
              <Primary>Weiter</Primary>
            </>}

            {st.step === "partner" && <>
              <Title innerRef={heading}>Gemeinsam planen</Title>
              <p>Schick deinem Partner oder deiner Partnerin eine Einladung. Wer sie annimmt, meldet sich mit der eigenen E-Mail-Adresse an und sieht sofort eure Familie. Der Link gilt 7 Tage und nur einmal.</p>
              <button type="button" className={styles.secondary} aria-pressed={st.inviteShared} onClick={() => setSt(s => ({ ...s, inviteShared: true }))}>
                {st.inviteShared ? <><Check size={18} aria-hidden="true" />Einladung vorbereitet</> : <><Share2 size={18} aria-hidden="true" />Einladung teilen</>}
              </button>
              {st.inviteShared && <p className={styles.note} role="status">In der Vorschau wird kein Link erzeugt. In der App öffnet sich hier das Teilen-Menü deines iPhones.</p>}
              <Primary>{st.inviteShared ? "Weiter" : "Später einladen"}</Primary>
            </>}

            {st.step === "geraete" && <>
              <Title innerRef={heading}>Geräte der Kinder verbinden</Title>
              <p>Öffne FamilyOS auf dem Gerät des Kindes und scanne den Code mit der Kamera. Danach wählt das Kind eine 4-stellige PIN. Eine eigene E-Mail-Adresse braucht es nicht.</p>
              <ul className={styles.devices}>
                {kids.map((c, i) => {
                  const paired = st.pairedChildKeys.includes(c.key);
                  return (
                    <li key={c.key} data-tone={tone(i)}>
                      <span className={styles.who}><i aria-hidden="true">{c.name[0]}</i><span><strong>{c.name}</strong><small>{paired ? "Gerät verbunden" : "Noch kein Gerät"}</small></span></span>
                      {paired ? <Check size={20} aria-label="verbunden" /> :
                        <button type="button" className={styles.secondary} aria-expanded={pairing === c.key} onClick={() => setPairing(pairing === c.key ? null : c.key)}><Smartphone size={18} aria-hidden="true" />Verbinden</button>}
                      {pairing === c.key && (
                        <div className={styles.qr}>
                          <div className={styles.qrBox} role="img" aria-label="Platzhalter für den QR-Code"><QrCode size={56} aria-hidden="true" /><span>Hier erscheint der QR-Code</span></div>
                          <p>Der Code gilt 10 Minuten und nur für {c.name}. In der Vorschau wird kein echter Code erzeugt.</p>
                          <button type="button" className={styles.secondary} onClick={() => { setPairing(null); setSt(s => ({ ...s, pairedChildKeys: [...s.pairedChildKeys, c.key] })); }}>Verbindung simulieren</button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Primary>{st.pairedChildKeys.length ? "Weiter" : "Später verbinden"}</Primary>
            </>}

            {done && <>
              <Title innerRef={heading}>{family} ist startklar</Title>
              <p role="status">So sieht eure Familie in FamilyOS aus. Alles lässt sich später unter „Familie“ ändern.</p>
              <dl className={styles.summary}>
                <Row label="Familie" value={family ?? ""} onEdit={() => go("familie")} />
                <Row label="Du" value={`${flow.cleanName(st.myName) ?? ""} (${st.email.trim()})`} onEdit={() => go("familie")} />
                <Row label="Kinder" value={kids.map(k => k.name).join(", ")} onEdit={() => go("kinder")} />
                <Row label="Partner" value={st.inviteShared ? "Einladung vorbereitet" : "Noch nicht eingeladen"} onEdit={() => go("partner")} />
                <Row label="Kindergeräte" value={`${st.pairedChildKeys.length} von ${kids.length} verbunden`} onEdit={() => go("geraete")} />
              </dl>
              <Link href="/command" className={styles.primary}>Zur Familienübersicht<ArrowRight size={18} aria-hidden="true" /></Link>
            </>}
          </form>

          {st.step !== "konto" && !done && (
            <button type="button" className={styles.back} onClick={() => go(flow.prev(st.step))}><ArrowLeft size={16} aria-hidden="true" />Zurück</button>
          )}
          <small className={styles.footnote}>Vorschau: Es wird nichts gespeichert oder verschickt. Jeder 6-stellige Code funktioniert.</small>
        </section>
      </div>
    </main>
  );
}

function Scene({ time, active }: { time: "dusk" | "night"; active: boolean }) {
  return (
    <picture className={styles.scene} data-active={active}>
      <source media="(max-width: 720px)" type="image/avif" srcSet={artUrl(`observatory-${time}-mobile.avif`)} />
      <source media="(max-width: 720px)" type="image/webp" srcSet={artUrl(`observatory-${time}-mobile.webp`)} />
      <source type="image/avif" srcSet={artUrl(`observatory-${time}-wide.avif`)} />
      <img src={artUrl(`observatory-${time}-wide.webp`)} alt="" width={1440} height={960} loading={time === "dusk" ? "eager" : "lazy"} decoding="async" />
    </picture>
  );
}

function Title({ children, innerRef }: { children: ReactNode; innerRef: React.Ref<HTMLHeadingElement> }) {
  return <h1 id="setup-title" ref={innerRef} tabIndex={-1}>{children}</h1>;
}

function Field({ label, error, children }: { label: string; error: string | null; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined })}
      {error && <span id={`${id}-err`} className={styles.error} role="alert">{error}</span>}
    </div>
  );
}

function Primary({ children }: { children: ReactNode }) {
  return <button type="submit" className={styles.primary}>{children}<ArrowRight size={18} aria-hidden="true" /></button>;
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt><dd>{value}</dd>
      <button type="button" className={styles.edit} onClick={onEdit} aria-label={`${label} ändern`}>Ändern</button>
    </div>
  );
}
