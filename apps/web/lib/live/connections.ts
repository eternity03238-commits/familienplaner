/**
 * What FamilyOS can connect to, and how far each connection is. Single source for the "Verbindungen" page.
 * Honest by design (CONNECTORS.md): nothing is shown as connected, no password scraping, school portals only
 * through officially allowed interfaces after they are confirmed.
 */
export type ConnectionStatus = "next" | "planned" | "needs_info";
export interface ConnectionInfo {
  id: string;
  name: string;
  what: string;
  status: ConnectionStatus;
  how: string[];
  until: string;
}

export const STATUS_LABEL: Record<ConnectionStatus, string> = {
  next: "Kommt als Nächstes",
  planned: "Geplant",
  needs_info: "Braucht Angaben von euch"
};

export const CONNECTIONS: ConnectionInfo[] = [
  {
    id: "google_calendar",
    name: "Google Kalender",
    what: "Eure Termine erscheinen automatisch im Familienkalender, zum Beispiel Arzt, Training oder Elternabend.",
    status: "next",
    how: [
      "Unter „Verbindungen“ auf „Google Kalender verbinden“ tippen.",
      "Bei Google anmelden und nur das Lesen der Kalender erlauben.",
      "Auswählen, welche Kalender FamilyOS sehen darf, zum Beispiel nur „Familie“."
    ],
    until: "Termine von Hand eintragen kommt im selben Ausbauschritt."
  },
  {
    id: "lernsax",
    name: "LernSax",
    what: "Hausaufgaben, Termine und Nachrichten aus dem Schulportal.",
    status: "needs_info",
    how: [
      "Nur über offizielle Wege, zum Beispiel einen abonnierbaren Kalender, den die Schule freischaltet.",
      "Kein Einloggen mit dem Passwort eures Kindes durch FamilyOS."
    ],
    until: "Wir brauchen: welche Schule und welche Funktionen dort freigeschaltet sind."
  },
  {
    id: "vpplan",
    name: "VP Plan (Vertretungsplan)",
    what: "Ausfälle und Vertretungen des Tages, damit der Plan der Kinder stimmt.",
    status: "needs_info",
    how: ["Nur wenn die Schule eine erlaubte Schnittstelle oder einen Export anbietet."],
    until: "Wir brauchen: die Adresse eures Vertretungsplans und ob die Schule einen Export erlaubt."
  },
  {
    id: "beste_schule",
    name: "beste.schule",
    what: "Noten und Klassenarbeiten, um Lernzeiten vor Prüfungen einzuplanen.",
    status: "planned",
    how: ["Über die offizielle Schnittstelle von beste.schule, mit eurer Zustimmung pro Kind."],
    until: "Die Rechte der Schnittstelle prüfen wir vor dem Einbau."
  },
  {
    id: "dls",
    name: "DLS",
    what: "Weitere Schulinformationen, je nach Schule.",
    status: "needs_info",
    how: ["Nur über einen offiziell erlaubten Zugang."],
    until: "Wir brauchen: welches System genau gemeint ist und die Adresse eurer Schule."
  }
];
