"use client";
import type { ReactNode } from "react";
import { CalendarDays, House, Layers3, UserRound, Zap } from "lucide-react";
import { AppFrame } from "../AppFrame.tsx";
import { ExploreProvider } from "./ExploreState.tsx";
import { Notice } from "./Notice.tsx";

const nav = [
  { href: "/explore", label: "Mein Tag", Icon: House },
  { href: "/explore/kalender", label: "Kalender", Icon: CalendarDays },
  { href: "/explore/missionen", label: "Missionen", Icon: Zap },
  { href: "/explore/projekt", label: "Projekte", Icon: Layers3 },
  { href: "/explore/profil", label: "Profil", Icon: UserRound }
];
export function ExploreFrame({ children }: { children: ReactNode }) {
  return <ExploreProvider><AppFrame role="child" nav={nav}><Notice />{children}</AppFrame></ExploreProvider>;
}
