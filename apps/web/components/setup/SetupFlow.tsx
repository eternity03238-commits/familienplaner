"use client";
/**
 * Family setup (Sprint 1). Layout from the owner's design (commit e822036): scenic art panel that
 * personalises while you type + one step per screen with a progress bar. Preview mode: nothing is sent
 * or stored; the real flow calls the 0004 RPCs through the same steps.
 */
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, Plus, QrCode, Share2, Smartphone, X } from "lucide-react";
import { artUrl } from "../../lib/art/paths.ts";
import { usePrefs } from "../Prefs.tsx";
import * as flow from "../../lib/setup/flow.ts";
import { inviteLink, readInviteToken, setupBackend, SetupError, type SetupBackend } from "../../lib/setup/backend.ts";
import { supabaseConfig } from "../../lib/supabase/browser.ts";
import styles from "../../app/einrichten/setup.module.css";

const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";
/** Build-time decision (public env vars are inlined), identical on server and client: no hydration mismatch. */
const LIVE = supabaseConfig() !== null;
/** Invite token captured once from the URL fragment on the client; the server snapshot is always null. */
const INVITE = typeof window === "undefined" ? null : readInviteToken(window.location.hash);
const noSubscribe = () => () => {};
let backendInstance: SetupBackend | null = null;
const getBackend = () => (backendInstance ??= setupBackend());
const CHILD_TONES = ["school", "sport", "family"] as const;
const tone = (i: number) => CHILD_TONES[i % CHILD_TONES.length];

export function SetupFlow() {
  const { theme } = usePrefs();
  const [st, setSt] = useState<flow.SetupState>(flow.initialState);
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [pairing, setPairing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const live = LIVE;
  const inviteToken = useSyncExternalStore(noSubscribe, () => INVITE, () => null);
  // Joining by invite is part of the state; the URL token only seeds it.
  const view: flow.SetupState = inviteToken && st.invite === null && !st.familyId ? { ...st, invite: inviteToken } : st;

  // Remove the token from the address bar right away (history, screenshots, shoulder surfing).
  useEffect(() => {
    if (INVITE) history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  // Move focus to the new step's heading so screen readers announce it (not on first load).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [st.step]);

  const go = (step: flow.Step) => { setTouched(false); setFailure(null); setPairing(null); setSt(s => ({ ...s, step })); };
  const problem = flow.blocker(view);

  /** Runs a backend action with a busy state; failures are shown next to the button, never swallowed. */
  async function run(action: (b: SetupBackend) => Promise<void>) {
    const b = getBackend();
    if (busy) return;
    setBusy(true); setFailure(null);
    try { await action(b); }
    catch (e) { setFailure(e instanceof SetupError ? e.message : "Das hat nicht geklappt. Bitte noch einmal versuchen."); }
    finally { setBusy(false); }
  }

  async function afterSignIn(b: SetupBackend) {
    const existing = await b.loadFamily();
    if (existing) {
      // Already set up (e.g. second visit): show the family instead of creating a second one.
      setSt(s => ({ ...s, signedIn: true, familyId: existing.familyId, familyName: existing.familyName, myName: existing.myName, invite: null,
        myId: existing.myId, savedFamilyName: existing.familyName, savedMyName: existing.myName,
        children: existing.children.length ? existing.children.map((c, i) => ({ key: `db${i}`, name: c.name, id: c.id, savedName: c.name })) : s.children,
        step: "fertig" }));
      return;
    }
    setSt(s => ({ ...s, signedIn: true, step: "familie" }));
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (st.step === "konto" && !st.signedIn) {
      if (!flow.validEmail(st.email) || !flow.validPassword(password)) return;
      void run(async b => {
        if (st.accountMode === "neu") await b.signUp(st.email, password); else await b.signIn(st.email, password);
        setPassword(""); setTouched(false); await afterSignIn(b);
      });
      return;
    }
    if (problem) return;
    if (st.step === "familie" && view.invite) {
      const token = view.invite;
      void run(async b => { await b.acceptInvite(token, flow.cleanName(st.myName)!); await afterSignIn(b); setSt(s => ({ ...s, step: "fertig" })); });
      return;
    }
    if (st.step === "familie") {
      const familyName = flow.cleanName(st.familyName)!, myName = flow.cleanName(st.myName)!;
      void run(async b => {
        if (!st.familyId) {
          await b.createFamily(familyName, myName);
          const created = await b.loadFamily();
          setSt(s => ({ ...s, familyId: created?.familyId ?? "preview-family", myId: created?.myId ?? "preview-me", savedFamilyName: familyName, savedMyName: myName }));
        } else {
          if (familyName !== st.savedFamilyName) await b.renameFamily(st.familyId, familyName);
          if (myName !== st.savedMyName && st.myId) await b.renamePerson(st.myId, myName);
          setSt(s => ({ ...s, savedFamilyName: familyName, savedMyName: myName }));
        }
        go("kinder");
      });
      return;
    }
    if (st.step === "kinder" && st.familyId) {
      const familyId = st.familyId;
      void run(async b => {
        for (const w of flow.pendingChildWrites(st)) {
          if (w.kind === "add") {
            const id = await b.addChild(familyId, w.name);
            setSt(s => ({ ...s, children: s.children.map(c => (c.key === w.key ? { ...c, id, savedName: w.name } : c)) }));
          } else {
            await b.renamePerson(w.id, w.name);
            setSt(s => ({ ...s, children: s.children.map(c => (c.key === w.key ? { ...c, savedName: w.name } : c)) }));
          }
        }
        go("partner");
      });
      return;
    }
    go(flow.next(st.step));
  };

  const shareInvite = () => void run(async b => {
    if (!st.familyId) return;
    const token = await b.createInvite(st.familyId);
    const url = b.mode === "live" ? inviteLink(window.location.origin, process.env.NEXT_PUBLIC_ASSET_BASE ?? "", token) : null;
    setLink(url);
    if (url && typeof navigator.share === "function") {
      try { await navigator.share({ title: "Einladung zu FamilyOS", text: `Komm in unseren Familienplaner ${flow.cleanName(st.familyName) ?? ""}`.trim(), url }); }
      catch { /* closed share sheet: the link stays visible below */ }
    }
    setSt(s => ({ ...s, inviteShared: true }));
  });

  const kids = flow.namedChildren(st);
  const family = flow.cleanName(st.familyName);
  const done = st.step === "fertig";
  const steps = flow.stepsFor(view);
  const num = done ? null : steps.indexOf(st.step) + 1;
  const count = steps.length - 1;

  return (
    <main className={styles.page} data-fo-role="parent" data-fo-theme={theme} id="inhalt">
      <a className="fo-skip" href="#setup-title">Zum Inhalt springen</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark from the owner's design, nothing to optimise */}
          <img src={`${ASSET_BASE}/art/v3/familyos-symbol.svg`} width={36} height={36} alt="" />
          FamilyOS<span className="fo-sr-only">, zur Startseite</span>
        </Link>
        <span>{live ? "Einrichtung" : "Einrichtung · Vorschau"}</span>
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
              <span>Schritt {num} von {count} · {flow.STEP_TITLE[st.step]}</span>
              <div role="progressbar" aria-label="Fortschritt der Einrichtung" aria-valuemin={1} aria-valuemax={count} aria-valuenow={num} aria-valuetext={`Schritt ${num} von ${count}`}>
                {Array.from({ length: count }, (_, i) => <i key={i} data-filled={i < num} />)}
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate>
            {st.step === "konto" && <>
              <Title innerRef={heading}>{view.invite ? "Du wurdest eingeladen" : "Willkommen bei FamilyOS"}</Title>
              <p>{st.accountMode === "neu"
                ? (view.invite ? "Leg dein Konto an, dann bist du gleich in eurer Familie." : "Leg einmal dein Konto an. Dein iPhone merkt sich das Passwort, danach reicht Face ID.")
                : "Schön, dass du wieder da bist."}</p>
              <div className={styles.segment} role="group" aria-label="Konto">
                <button type="button" aria-pressed={st.accountMode === "neu"} onClick={() => { setTouched(false); setFailure(null); setSt(s => ({ ...s, accountMode: "neu" })); }}>Neu hier</button>
                <button type="button" aria-pressed={st.accountMode === "login"} onClick={() => { setTouched(false); setFailure(null); setSt(s => ({ ...s, accountMode: "login" })); }}>Ich habe ein Konto</button>
              </div>
              <Field label="E-Mail-Adresse" error={touched && !flow.validEmail(st.email) ? "Bitte eine gültige E-Mail-Adresse eingeben." : null}>
                {p => <input {...p} type="email" name="username" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
                  value={st.email} onChange={e => setSt(s => ({ ...s, email: e.target.value }))} placeholder="name@example.com" />}
              </Field>
              <Field label="Passwort" hint={st.accountMode === "neu" ? `Mindestens ${flow.PASSWORD_MIN} Zeichen. Tipp: Nimm den Vorschlag deines iPhones.` : undefined}
                error={touched && !flow.validPassword(password) ? `Bitte ein Passwort mit mindestens ${flow.PASSWORD_MIN} Zeichen eingeben.` : null}>
                {p => <input {...p} type="password" name="password" autoComplete={st.accountMode === "neu" ? "new-password" : "current-password"}
                  minLength={flow.PASSWORD_MIN} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} />}
              </Field>
              <Primary busy={busy}>{st.accountMode === "neu" ? "Konto anlegen" : "Anmelden"}</Primary>
            </>}

            {st.step === "familie" && view.invite && <>
              <Title innerRef={heading}>Wie heißt du?</Title>
              <p>Mit diesem Namen sehen dich die anderen in eurer Familie.</p>
              <Field label="Dein Vorname" error={touched && !flow.cleanName(st.myName) ? "Bitte deinen Vornamen eingeben (bis 60 Zeichen)." : null}>
                {p => <input {...p} maxLength={flow.NAME_MAX} autoComplete="given-name" value={st.myName} onChange={e => setSt(s => ({ ...s, myName: e.target.value }))} placeholder="z. B. Sam" />}
              </Field>
              <Primary busy={busy}>Familie beitreten</Primary>
            </>}

            {st.step === "familie" && !view.invite && <>
              <Title innerRef={heading}>Wie heißt eure Familie?</Title>
              <p>Gib eurem gemeinsamen Kalender einen Namen und trag deinen Vornamen ein.</p>
              <Field label="Familienname" error={touched && !family ? "Bitte einen Familiennamen eingeben (bis 60 Zeichen)." : null}>
                {p => <input {...p} maxLength={flow.NAME_MAX} value={st.familyName} onChange={e => setSt(s => ({ ...s, familyName: e.target.value }))} placeholder="z. B. Familie Sommer" />}
              </Field>
              <Field label="Dein Vorname" error={touched && !flow.cleanName(st.myName) ? "Bitte deinen Vornamen eingeben (bis 60 Zeichen)." : null}>
                {p => <input {...p} maxLength={flow.NAME_MAX} autoComplete="given-name" value={st.myName} onChange={e => setSt(s => ({ ...s, myName: e.target.value }))} placeholder="z. B. Alex" />}
              </Field>
              <Primary busy={busy}>Weiter</Primary>
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
                    {st.children.length > 1 && !c.id && (
                      <button type="button" className={styles.icon} onClick={() => setSt(s => flow.removeChild(s, c.key))} aria-label={`${c.name.trim() || `Kind ${i + 1}`} entfernen`}><X size={18} aria-hidden="true" /></button>
                    )}
                  </li>
                ))}
              </ul>
              {st.children.length < flow.MAX_CHILDREN && (
                <button type="button" className={styles.secondary} onClick={() => setSt(flow.addChild)}><Plus size={18} aria-hidden="true" />Weiteres Kind</button>
              )}
              {touched && problem && <p className={styles.error} role="alert">{problem}</p>}
              <Primary busy={busy}>Weiter</Primary>
            </>}

            {st.step === "partner" && <>
              <Title innerRef={heading}>Gemeinsam planen</Title>
              <p>Schick deinem Partner oder deiner Partnerin eine Einladung. Wer sie annimmt, meldet sich mit der eigenen E-Mail-Adresse an und sieht sofort eure Familie. Der Link gilt 7 Tage und nur einmal.</p>
              <button type="button" className={styles.secondary} aria-pressed={st.inviteShared} disabled={busy} onClick={shareInvite}>
                {st.inviteShared ? <><Check size={18} aria-hidden="true" />Neue Einladung teilen</> : <><Share2 size={18} aria-hidden="true" />Einladung teilen</>}
              </button>
              {st.inviteShared && !link && <p className={styles.note} role="status">In der Vorschau wird kein Link erzeugt. In der App öffnet sich hier das Teilen-Menü deines iPhones.</p>}
              {link && (
                <div className={styles.field}>
                  <label htmlFor="invite-link">Einladungslink (7 Tage gültig, nur einmal nutzbar)</label>
                  <div className={styles.copy}>
                    <input id="invite-link" readOnly value={link} onFocus={e => e.currentTarget.select()} />
                    <button type="button" className={styles.icon} aria-label="Link kopieren" onClick={() => void navigator.clipboard?.writeText(link)}><Copy size={18} aria-hidden="true" /></button>
                  </div>
                </div>
              )}
              <Primary busy={busy}>{st.inviteShared ? "Weiter" : "Später einladen"}</Primary>
            </>}

            {st.step === "geraete" && <>
              <Title innerRef={heading}>Geräte der Kinder verbinden</Title>
              <p>Öffne FamilyOS auf dem Gerät des Kindes und scanne den Code mit der Kamera. Danach wählt das Kind eine 4-stellige PIN. Eine eigene E-Mail-Adresse braucht es nicht.</p>
              {live ? <p className={styles.note} role="status">Das Verbinden der Kindergeräte schalten wir im nächsten Schritt frei. Du findest es dann unter „Familie“.</p> :
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
              </ul>}
              <Primary busy={busy}>{st.pairedChildKeys.length ? "Weiter" : "Später verbinden"}</Primary>
            </>}

            {done && <>
              <Title innerRef={heading}>{family} ist startklar</Title>
              <p role="status">So sieht eure Familie in FamilyOS aus. Alles lässt sich später unter „Familie“ ändern.</p>
              <dl className={styles.summary}>
                <Row label="Familie" value={family ?? ""} onEdit={() => go("familie")} />
                <Row label="Du" value={st.email.trim() ? `${flow.cleanName(st.myName) ?? ""} (${st.email.trim()})` : flow.cleanName(st.myName) ?? ""} onEdit={() => go("familie")} />
                <Row label="Kinder" value={kids.map(k => k.name).join(", ") || "Noch keine"} onEdit={() => go("kinder")} />
                <Row label="Partner" value={st.inviteShared ? "Einladung geteilt" : "Noch nicht eingeladen"} onEdit={() => go("partner")} />
                {!live && <Row label="Kindergeräte" value={`${st.pairedChildKeys.length} von ${kids.length} verbunden`} onEdit={() => go("geraete")} />}
              </dl>
              <Link href="/command" className={styles.primary}>Zur Familienübersicht<ArrowRight size={18} aria-hidden="true" /></Link>
            </>}
            {failure && <p className={styles.error} role="alert">{failure}</p>}
          </form>

          {st.step !== "konto" && !done && (
            <button type="button" className={styles.back} onClick={() => go(flow.prev(st.step))}><ArrowLeft size={16} aria-hidden="true" />Zurück</button>
          )}
          {!live && <small className={styles.footnote}>Vorschau: Es wird nichts gespeichert. Jede E-Mail-Adresse und jedes Passwort ab 8 Zeichen funktioniert.</small>}
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

function Field({ label, hint, error, children }: { label: string; hint?: string; error: string | null; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode }) {
  const id = useId();
  const described = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": described })}
      {hint && <span id={`${id}-hint`} className={styles.hint}>{hint}</span>}
      {error && <span id={`${id}-err`} className={styles.error} role="alert">{error}</span>}
    </div>
  );
}

function Primary({ children, busy }: { children: ReactNode; busy: boolean }) {
  return (
    <button type="submit" className={styles.primary} disabled={busy} aria-busy={busy}>
      {children}{busy ? <Loader2 size={18} className={styles.spin} aria-label="Bitte warten" /> : <ArrowRight size={18} aria-hidden="true" />}
    </button>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt><dd>{value}</dd>
      <button type="button" className={styles.edit} onClick={onEdit} aria-label={`${label} ändern`}>Ändern</button>
    </div>
  );
}
