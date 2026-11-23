"use client";
/**
 * Parent views with the family's real data (live mode). Shown instead of the demo screens once signed in.
 * Only what exists is shown; empty areas say what to do next. Nothing claims a connection that does not exist.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus, LogOut, MapPin, Plug, RefreshCw, Smartphone, Unplug, UserPlus, Users } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { berlinDate, byDay, dayLabel, disconnectGoogle, sinceText, startGoogle, syncGoogle, timeOf, useConnections, useEvents, type CalEvent, type Connection } from "../../lib/live/google-client.ts";
import { CONNECTIONS, STATUS_LABEL } from "../../lib/live/connections.ts";
import type { LiveFamily, LiveState } from "../../lib/live/session.ts";
import { EmptyState, Skeleton } from "../EmptyState.tsx";
import { ActionButton, Eyebrow, SectionHeading, StatusChip, SurfaceCard } from "../ui.tsx";

const today = () => new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" }).format(new Date());

/** Chooses the live view for the current Command route; signed-out and empty states lead back to setup. */
export function LiveCommand({ state, signOut }: { state: LiveState; signOut: () => Promise<void> }) {
  const path = usePathname().replace(/\/$/, "");
  if (state.kind === "loading" || state.kind === "preview") return <Skeleton lines={4} label="Familie wird geladen" />;
  if (state.kind === "error") {
    return <Gate title="Die Familie konnte nicht geladen werden." text="Bitte Internetverbindung prüfen und die Seite neu laden." />;
  }
  if (state.kind === "signedOut") {
    return <Gate title="Bitte melde dich an." text="Mit deiner E-Mail-Adresse und deinem Passwort siehst du eure Familie." href="/einrichten" cta="Zur Anmeldung" />;
  }
  if (state.kind === "noFamily") {
    return <Gate title="Noch keine Familie eingerichtet." text="Leg in wenigen Schritten eure Familie an." href="/einrichten" cta="Familie einrichten" />;
  }
  const { family, email } = state;
  if (path.endsWith("/verbindungen")) return <Connections google={<GoogleLive />} />;
  if (path.endsWith("/kalender")) return <LiveCalendar family={family} />;
  if (path.endsWith("/planung")) return <LivePlanning family={family} />;
  if (path.endsWith("/profil")) return <LiveProfile family={family} email={email} signOut={signOut} />;
  return <LiveHome family={family} />;
}

function Gate({ title, text, href, cta }: { title: string; text: string; href?: string; cta?: string }) {
  return (
    <div className="fo-live">
      <EmptyState title={title} action={href ? <Link className="fo-button fo-button--primary" href={href}>{cta}</Link> : undefined}>{text}</EmptyState>
    </div>
  );
}

function Head({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <header className="fo-viewhead">
      <Eyebrow as="p">{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </header>
  );
}

const kids = (f: LiveFamily) => f.members.filter(m => m.role === "child");
const adults = (f: LiveFamily) => f.members.filter(m => m.role !== "child");

function LiveHome({ family }: { family: LiveFamily }) {
  const me = family.members.find(m => m.isMe);
  const google = useConnections();
  const range = useRange(1);
  const ev = useEvents(range.from, range.to);
  useAutoSync(google.items, () => { google.reload(); ev.reload(); });
  const connected = google.items.length > 0;
  const todayEvents = byDay(ev.events, range.day, 1)[0].events;
  const children = kids(family);
  const steps: { done: boolean; title: string; text: string; href: string; Icon: typeof Users }[] = [
    { done: children.length > 0, title: "Kinder eintragen", text: children.length ? children.map(c => c.name).join(", ") : "Noch keine Kinder.", href: "/einrichten", Icon: Users },
    { done: adults(family).length > 1, title: "Partner einladen", text: adults(family).length > 1 ? "Ihr plant zu zweit." : "Teile einen Einladungslink.", href: "/einrichten", Icon: UserPlus },
    { done: connected, title: "Google Kalender verbinden", text: connected ? `Verbunden: ${google.items.map(c => c.account).join(", ")}` : "Dann erscheinen deine Termine hier.", href: "/command/verbindungen", Icon: CalendarDays },
    { done: false, title: "Kindergeräte verbinden", text: "Kommt bald: QR-Code scannen, PIN wählen, fertig.", href: "/command/verbindungen", Icon: Smartphone }
  ];
  return (
    <div className="fo-live">
      <Head eyebrow={today()} title={`Hallo${me ? ` ${me.name}` : ""}.`} text={family.familyName} />
      <section aria-labelledby="live-today">
        <SectionHeading id="live-today" title="Heute" />
        {ev.loading ? <Skeleton lines={2} label="Termine werden geladen" />
          : todayEvents.length ? <EventList events={todayEvents} />
          : connected ? <EmptyState title="Heute steht nichts an.">Dein Google Kalender ist verbunden. Neue Termine erscheinen hier automatisch.</EmptyState>
          : <EmptyState title="Noch keine Termine." action={<Link className="fo-button fo-button--secondary" href="/command/verbindungen"><Plug size={16} aria-hidden="true" />Google Kalender verbinden</Link>}>
              Verbinde deinen Google Kalender, dann steht hier, was heute ansteht.
            </EmptyState>}
      </section>
      <section aria-labelledby="live-start">
        <SectionHeading id="live-start" title="So geht es weiter" />
        <ol className="fo-live-steps">
          {steps.map(s => (
            <li key={s.title} data-done={s.done}>
              <Link href={s.href}>
                <s.Icon size={20} aria-hidden="true" />
                <span><strong>{s.title}</strong><small>{s.text}</small></span>
                {s.done ? <StatusChip tone="success">Erledigt</StatusChip> : <StatusChip>Offen</StatusChip>}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function LiveCalendar({ family }: { family: LiveFamily }) {
  const google = useConnections();
  const range = useRange(7);
  const ev = useEvents(range.from, range.to);
  useAutoSync(google.items, () => { google.reload(); ev.reload(); });
  const days = byDay(ev.events, range.day, 7);
  return (
    <div className="fo-live">
      <Head eyebrow="Kalender" title="Die nächsten 7 Tage" text={family.familyName} />
      {ev.loading ? <Skeleton lines={4} label="Termine werden geladen" />
        : google.items.length === 0 && ev.events.length === 0
          ? <EmptyState title="Der Kalender ist noch leer." action={<Link className="fo-button fo-button--primary" href="/command/verbindungen"><CalendarPlus size={16} aria-hidden="true" />Google Kalender verbinden</Link>}>
              Verbinde deinen Google Kalender, dann erscheinen hier deine Termine.
            </EmptyState>
          : days.map(d => (
            <section key={d.day} aria-label={dayLabel(d.day)}>
              <SectionHeading level={3} title={d.day === range.day ? `Heute, ${dayLabel(d.day)}` : dayLabel(d.day)} />
              {d.events.length ? <EventList events={d.events} /> : <p className="fo-live-small">Keine Termine.</p>}
            </section>
          ))}
      {google.items.length > 0 && <p className="fo-live-small">Nur du siehst deine Google-Termine. Gemeinsame Familientermine kommen in einem nächsten Schritt.</p>}
    </div>
  );
}

function EventList({ events }: { events: CalEvent[] }) {
  return (
    <ul className="fo-live-events">
      {events.map(e => (
        <li key={e.id}>
          <span className="fo-live-events__time">{e.allDay ? "Ganztägig" : `${timeOf(e.startsAt!)}–${timeOf(e.endsAt!)}`}</span>
          <span><strong>{e.title}</strong>{e.location && <small><MapPin size={12} aria-hidden="true" /> {e.location}</small>}</span>
        </li>
      ))}
    </ul>
  );
}

/** Today (Berlin) and a window of n days as ISO bounds. Stable for the life of the component. */
function useRange(days: number) {
  const [r] = useState(() => {
    const day = berlinDate(new Date());
    return { day, from: new Date(Date.parse(`${day}T00:00:00Z`) - 2 * 3600e3).toISOString(), to: new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString() };
  });
  return r;
}

/** Refreshes Google at most every 15 minutes while a parent looks at the app; failures stay visible on the connection. */
function useAutoSync(items: Connection[], after: () => void) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || items.length === 0) return;
    const stale = items.some(c => !c.lastSyncedAt || Date.now() - Date.parse(c.lastSyncedAt) > 15 * 60_000);
    if (!stale) return;
    done.current = true;
    void syncGoogle().then(after);
  }, [items, after]);
}

const RESULT_TEXT: Record<string, { tone: "success" | "warning"; text: string }> = {
  "verbunden": { tone: "success", text: "Google Kalender verbunden. Deine Termine sind da." },
  "verbunden-ohne-termine": { tone: "warning", text: "Verbunden, aber die Termine konnten noch nicht geladen werden. Tippe auf „Jetzt aktualisieren“." },
  "abgebrochen": { tone: "warning", text: "Verbinden abgebrochen. Du kannst es jederzeit noch einmal versuchen." },
  "keine-berechtigung": { tone: "warning", text: "Google hat das Lesen der Kalender nicht erlaubt. Bitte beim Verbinden das Häkchen für den Kalender setzen." },
  "abgelaufen": { tone: "warning", text: "Der Vorgang hat zu lange gedauert. Bitte noch einmal verbinden." },
  "nicht-eingerichtet": { tone: "warning", text: "Google ist auf dem Server noch nicht eingerichtet." },
  "fehler": { tone: "warning", text: "Verbinden hat nicht geklappt. Bitte noch einmal versuchen." }
};
const noSubscribe = () => () => {};
/** Result of the Google redirect, captured once at page load (the address bar is cleaned right after). */
const GOOGLE_RESULT = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("google");

function GoogleLive() {
  const google = useConnections();
  const result = useSyncExternalStore(noSubscribe, () => GOOGLE_RESULT, () => null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { if (result) history.replaceState(null, "", window.location.pathname); }, [result]);
  const notice = result ? RESULT_TEXT[result] : undefined;
  const act = async (fn: () => Promise<string | null | void>) => { setBusy(true); setMessage(null); const m = await fn(); setBusy(false); if (m) setMessage(m); google.reload(); };
  return (
    <div className="fo-live-google">
      {notice && <p className={`fo-status fo-status--${notice.tone}`} role="status">{notice.text}</p>}
      {google.loading ? <Skeleton lines={1} label="Verbindung wird geladen" /> : google.items.length === 0
        ? <ActionButton disabled={busy} onClick={() => void act(startGoogle)}><CalendarPlus size={16} aria-hidden="true" />Mit Google verbinden</ActionButton>
        : google.items.map(c => (
          <div key={c.id} className="fo-live-google__row">
            <p><strong>{c.account}</strong><br />
              <small>{c.status === "connected" ? `Aktualisiert ${sinceText(c.lastSyncedAt)}` : c.status === "reauth_required" ? "Zugriff abgelaufen. Bitte neu verbinden." : `Letzte Aktualisierung fehlgeschlagen (${sinceText(c.lastSyncedAt)} zuletzt erfolgreich).`}</small></p>
            <div className="fo-live-google__actions">
              {c.status === "reauth_required"
                ? <ActionButton disabled={busy} onClick={() => void act(startGoogle)}>Neu verbinden</ActionButton>
                : <ActionButton tone="secondary" disabled={busy} onClick={() => void act(async () => { const r = await syncGoogle(); return r.ok ? null : r.message ?? (r.reconnect ? "Zugriff abgelaufen. Bitte neu verbinden." : "Aktualisieren hat nicht geklappt."); })}><RefreshCw size={16} aria-hidden="true" />Jetzt aktualisieren</ActionButton>}
              <ActionButton tone="quiet" disabled={busy} onClick={() => { if (window.confirm(`${c.account} trennen? Die Google-Termine werden aus FamilyOS gelöscht. In Google bleibt alles erhalten.`)) void act(() => disconnectGoogle(c.id)); }}><Unplug size={16} aria-hidden="true" />Trennen</ActionButton>
            </div>
          </div>
        ))}
      {message && <p className="fo-status fo-status--warning" role="alert">{message}</p>}
      <p className="fo-live-small">FamilyOS liest nur. Es ändert nichts in deinem Google Kalender. Die Termine siehst nur du.</p>
    </div>
  );
}

function LivePlanning({ family }: { family: LiveFamily }) {
  const children = kids(family);
  return (
    <div className="fo-live">
      <Head eyebrow="Planung" title="Lernen & Aufgaben" />
      {children.length === 0
        ? <EmptyState title="Noch keine Kinder eingetragen." action={<Link className="fo-button fo-button--primary" href="/einrichten">Kinder eintragen</Link>} />
        : children.map(c => (
          <SurfaceCard key={c.personId} aria-label={c.name}>
            <SectionHeading level={3} title={c.name} />
            <EmptyState title="Noch keine Aufgaben.">Aufgaben und Lernpläne für {c.name} kommen mit dem nächsten Ausbauschritt.</EmptyState>
          </SurfaceCard>
        ))}
    </div>
  );
}

function LiveProfile({ family, email, signOut }: { family: LiveFamily; email: string; signOut: () => Promise<void> }) {
  return (
    <div className="fo-live">
      <Head eyebrow="Profil" title={family.familyName} text={`Angemeldet als ${email}`} />
      <section aria-labelledby="live-members">
        <SectionHeading id="live-members" title="Familie" action={<Link className="fo-live-link" href="/einrichten">Ändern</Link>} />
        <ul className="fo-live-members">
          {family.members.map(m => (
            <li key={m.personId}><span aria-hidden="true">{m.name[0]}</span><strong>{m.name}{m.isMe ? " (du)" : ""}</strong><small>{m.role === "child" ? "Kind" : "Erwachsen"}</small></li>
          ))}
        </ul>
      </section>
      <Link className="fo-button fo-button--secondary" href="/command/verbindungen"><Plug size={16} aria-hidden="true" />Verbindungen</Link>
      <ActionButton tone="quiet" onClick={() => void signOut()}><LogOut size={16} aria-hidden="true" />Abmelden</ActionButton>
    </div>
  );
}

/** Connections overview, used in live and preview mode alike (it shows no family data). */
export function Connections({ footer, google }: { footer?: ReactNode; google?: ReactNode }) {
  return (
    <div className="fo-live">
      <Head eyebrow="Verbindungen" title="Woher kommen eure Daten?" text={google ? "FamilyOS verbindet sich nur über offizielle Wege und nur mit eurer Zustimmung." : "FamilyOS verbindet sich nur über offizielle Wege und nur mit eurer Zustimmung. In dieser Vorschau ist nichts verbunden."} />
      <ul className="fo-live-connections">
        {CONNECTIONS.map(c => (
          <li key={c.id}>
            <SurfaceCard aria-labelledby={`con-${c.id}`}>
              <div className="fo-section-heading"><h2 id={`con-${c.id}`}>{c.name}</h2><StatusChip tone={c.status === "next" ? "success" : c.status === "needs_info" ? "warning" : "secondary"}>{c.id === "google_calendar" && google ? "Verfügbar" : STATUS_LABEL[c.status]}</StatusChip></div>
              <p>{c.what}</p>
              {c.id === "google_calendar" && google}
              {!(c.id === "google_calendar" && google) && <>
                <p className="fo-live-small"><strong>So wird es funktionieren:</strong></p>
                <ul className="fo-live-how">{c.how.map(h => <li key={h}>{h}</li>)}</ul>
                <p className="fo-live-small">{c.until}</p>
              </>}
            </SurfaceCard>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
