"use client";
/**
 * Parent views with the family's real data (live mode). Shown instead of the demo screens once signed in.
 * Only what exists is shown; empty areas say what to do next. Nothing claims a connection that does not exist.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CalendarPlus, LogOut, Plug, Smartphone, UserPlus, Users } from "lucide-react";
import type { ReactNode } from "react";
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
  if (path.endsWith("/verbindungen")) return <Connections />;
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
  const children = kids(family);
  const steps: { done: boolean; title: string; text: string; href: string; Icon: typeof Users }[] = [
    { done: children.length > 0, title: "Kinder eintragen", text: children.length ? children.map(c => c.name).join(", ") : "Noch keine Kinder.", href: "/einrichten", Icon: Users },
    { done: adults(family).length > 1, title: "Partner einladen", text: adults(family).length > 1 ? "Ihr plant zu zweit." : "Teile einen Einladungslink.", href: "/einrichten", Icon: UserPlus },
    { done: false, title: "Google Kalender verbinden", text: "Kommt als Nächstes. Dann erscheinen eure Termine hier.", href: "/command/verbindungen", Icon: CalendarDays },
    { done: false, title: "Kindergeräte verbinden", text: "Kommt bald: QR-Code scannen, PIN wählen, fertig.", href: "/command/verbindungen", Icon: Smartphone }
  ];
  return (
    <div className="fo-live">
      <Head eyebrow={today()} title={`Hallo${me ? ` ${me.name}` : ""}.`} text={family.familyName} />
      <section aria-labelledby="live-today">
        <SectionHeading id="live-today" title="Heute" />
        <EmptyState title="Noch keine Termine." action={<Link className="fo-button fo-button--secondary" href="/command/verbindungen"><Plug size={16} aria-hidden="true" />Woher kommen Termine?</Link>}>
          Sobald euer Google Kalender verbunden ist, steht hier, was heute ansteht und was als Nächstes kommt.
        </EmptyState>
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
  return (
    <div className="fo-live">
      <Head eyebrow="Kalender" title="Eure Woche" text={family.familyName} />
      <EmptyState title="Der Kalender ist noch leer." action={<Link className="fo-button fo-button--primary" href="/command/verbindungen"><CalendarPlus size={16} aria-hidden="true" />So kommt der Kalender rein</Link>}>
        Termine kommen bald aus eurem Google Kalender. Später könnt ihr sie auch von Hand eintragen.
      </EmptyState>
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
export function Connections({ footer }: { footer?: ReactNode }) {
  return (
    <div className="fo-live">
      <Head eyebrow="Verbindungen" title="Woher kommen eure Daten?" text="FamilyOS verbindet sich nur über offizielle Wege und nur mit eurer Zustimmung. Noch ist nichts verbunden." />
      <ul className="fo-live-connections">
        {CONNECTIONS.map(c => (
          <li key={c.id}>
            <SurfaceCard aria-labelledby={`con-${c.id}`}>
              <div className="fo-section-heading"><h2 id={`con-${c.id}`}>{c.name}</h2><StatusChip tone={c.status === "next" ? "success" : c.status === "needs_info" ? "warning" : "secondary"}>{STATUS_LABEL[c.status]}</StatusChip></div>
              <p>{c.what}</p>
              <p className="fo-live-small"><strong>So wird es funktionieren:</strong></p>
              <ul className="fo-live-how">{c.how.map(h => <li key={h}>{h}</li>)}</ul>
              <p className="fo-live-small">{c.until}</p>
            </SurfaceCard>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}
