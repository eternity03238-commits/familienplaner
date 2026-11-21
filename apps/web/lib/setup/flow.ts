/**
 * FamilyOS family setup flow (Sprint 1, docs/sprint1/PLAN.md). Pure logic, no IO.
 * Name rules mirror app_private.clean_name() in migration 0004 so the UI never accepts what the DB rejects.
 */
export const STEPS = ["konto", "familie", "kinder", "partner", "geraete", "fertig"] as const;
export type Step = (typeof STEPS)[number];
export const NAME_MAX = 60;
export const MAX_CHILDREN = 8;

export const STEP_TITLE: Record<Step, string> = {
  konto: "Konto", familie: "Familie", kinder: "Kinder", partner: "Partner", geraete: "Geräte", fertig: "Fertig"
};

/** Collapses whitespace and trims, like the database. Returns null when empty or too long. */
export function cleanName(raw: string): string | null {
  const v = raw.replace(/\s+/g, " ").trim();
  return v.length >= 1 && v.length <= NAME_MAX ? v : null;
}
export const validEmail = (raw: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
export const validCode = (raw: string) => /^\d{6}$/.test(raw.trim());

export interface Child { key: string; name: string }
export interface SetupState {
  step: Step;
  email: string;
  codeSent: boolean;
  signedIn: boolean;
  familyName: string;
  myName: string;
  children: Child[];
  inviteShared: boolean;
  pairedChildKeys: string[];
}
export const initialState: SetupState = {
  step: "konto", email: "", codeSent: false, signedIn: false, familyName: "", myName: "",
  children: [{ key: "k1", name: "" }], inviteShared: false, pairedChildKeys: []
};

/** 1-based number of the step for "Schritt n von 5"; the final summary has no number. */
export const stepNumber = (s: Step) => (s === "fertig" ? null : STEPS.indexOf(s) + 1);
export const STEP_COUNT = STEPS.length - 1;
export const next = (s: Step): Step => STEPS[Math.min(STEPS.indexOf(s) + 1, STEPS.length - 1)];
export const prev = (s: Step): Step => STEPS[Math.max(STEPS.indexOf(s) - 1, 0)];

/** Children that will actually be saved: named ones only, empty rows are ignored. */
export const namedChildren = (st: SetupState) =>
  st.children.map(c => ({ ...c, name: cleanName(c.name) })).filter((c): c is Child => c.name !== null);

/** Why the current step cannot continue yet (German, shown inline). null = ready. */
export function blocker(st: SetupState): string | null {
  switch (st.step) {
    case "konto":
      if (!st.signedIn) return st.codeSent ? "Bitte den 6-stelligen Code aus der E-Mail eingeben." : "Bitte eine gültige E-Mail-Adresse eingeben.";
      return null;
    case "familie":
      if (!cleanName(st.familyName)) return "Bitte einen Familiennamen eingeben (bis 60 Zeichen).";
      if (!cleanName(st.myName)) return "Bitte deinen Vornamen eingeben (bis 60 Zeichen).";
      return null;
    case "kinder":
      if (st.children.some(c => c.name.trim() !== "" && !cleanName(c.name))) return "Namen dürfen höchstens 60 Zeichen haben.";
      return namedChildren(st).length === 0 ? "Bitte mindestens ein Kind eintragen." : null;
    default:
      return null;
  }
}

let seq = 1;
export function addChild(st: SetupState): SetupState {
  if (st.children.length >= MAX_CHILDREN) return st;
  seq += 1;
  let key = `k${seq}`;
  while (st.children.some(c => c.key === key)) key = `k${++seq}`;
  return { ...st, children: [...st.children, { key, name: "" }] };
}
export function removeChild(st: SetupState, key: string): SetupState {
  const children = st.children.filter(c => c.key !== key);
  return { ...st, children: children.length ? children : [{ key: "k1", name: "" }], pairedChildKeys: st.pairedChildKeys.filter(k => k !== key) };
}
export function renameChild(st: SetupState, key: string, name: string): SetupState {
  return { ...st, children: st.children.map(c => (c.key === key ? { ...c, name } : c)) };
}
