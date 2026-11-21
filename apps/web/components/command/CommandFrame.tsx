"use client";
import type { ReactNode } from "react";
import { CalendarDays, House, Layers3, UserRound } from "lucide-react";
import { AppFrame } from "../AppFrame.tsx";
import { CommandProvider } from "./CommandState.tsx";

const nav = [
  { href: "/command", label: "Familie", Icon: House },
  { href: "/command/kalender", label: "Kalender", Icon: CalendarDays },
  { href: "/command/planung", label: "Planung", Icon: Layers3 },
  { href: "/command/profil", label: "Profil", Icon: UserRound }
];
export function CommandFrame({ children }: { children: ReactNode }) {
  return <CommandProvider><AppFrame role="parent" nav={nav}>{children}</AppFrame></CommandProvider>;
}
