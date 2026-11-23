"use client";
import type { ReactNode } from "react";
import { CalendarDays, House, Layers3, UserRound, Zap } from "lucide-react";
import { AppFrame } from "../AppFrame.tsx";
import { ExploreProvider } from "./ExploreState.tsx";
import { Notice } from "./Notice.tsx";
import { LIVE } from "../../lib/live/session.ts";

const nav = [
  { href: "/explore", label: "Mein Tag", Icon: House },
  { href: "/explore/kalender", label: "Kalender", Icon: CalendarDays },
  { href: "/explore/missionen", label: "Missionen", Icon: Zap },
  { href: "/explore/projekt", label: "Projekte", Icon: Layers3 },
  { href: "/explore/profil", label: "Profil", Icon: UserRound }
];
/** Live build: the child view stays an example until a child device is paired (next step), and says so. */
const LIVE_NOTE = "Beispielansicht. Die echte Kinderansicht erscheint auf dem Gerät eures Kindes, sobald es verbunden ist.";
export function ExploreFrame({ children }: { children: ReactNode }) {
  return <ExploreProvider><AppFrame role="child" nav={nav} demoNote={LIVE ? LIVE_NOTE : undefined}><Notice />{children}</AppFrame></ExploreProvider>;
}
