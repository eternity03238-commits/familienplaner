"use client";
import type { ReactNode } from "react";
import { CalendarDays, House, Layers3, UserRound } from "lucide-react";
import { AppFrame } from "../AppFrame.tsx";
import { CommandProvider } from "./CommandState.tsx";
import { LiveCommand } from "../live/LiveCommand.tsx";
import { useLiveSession } from "../../lib/live/session.ts";

const nav = [
  { href: "/command", label: "Familie", Icon: House },
  { href: "/command/kalender", label: "Kalender", Icon: CalendarDays },
  { href: "/command/planung", label: "Planung", Icon: Layers3 },
  { href: "/command/profil", label: "Profil", Icon: UserRound }
];
/** Preview build: demo screens. Live build (Supabase configured): the family's real data, never demo data. */
export function CommandFrame({ children }: { children: ReactNode }) {
  const { state, signOut } = useLiveSession();
  if (state.kind !== "preview") {
    return <AppFrame role="parent" nav={nav} demoNote={null}><LiveCommand state={state} signOut={signOut} /></AppFrame>;
  }
  return <CommandProvider><AppFrame role="parent" nav={nav}>{children}</AppFrame></CommandProvider>;
}
