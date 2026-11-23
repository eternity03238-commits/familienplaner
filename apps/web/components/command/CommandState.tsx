"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { guardianViewer, missions as allMissions, proposals as allProposals } from "../../lib/preview/fixtures.ts";
import { decideProposal, toggleMission, type ChildFilter, type Mission, type StudyProposal } from "../../lib/preview/model.ts";

interface CommandState {
  filter: ChildFilter;
  setFilter: (f: ChildFilter) => void;
  missions: Mission[];
  proposals: StudyProposal[];
  toggle: (id: string) => void;
  decide: (id: string, d: "approved" | "rejected") => void;
}
const Ctx = createContext<CommandState | null>(null);

/** Parent perspective state; the guardian viewer decides which data are visible at all (filters only narrow it). */
export function CommandProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<ChildFilter>("all");
  const [missions, setMissions] = useState(allMissions);
  const [proposals, setProposals] = useState(allProposals);
  return (
    <Ctx.Provider value={{
      filter, setFilter, missions, proposals,
      toggle: id => setMissions(ms => toggleMission(ms, id, guardianViewer)),
      decide: (id, d) => setProposals(ps => decideProposal(ps, id, d, guardianViewer))
    }}>{children}</Ctx.Provider>
  );
}
export function useCommand(): CommandState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCommand outside CommandProvider");
  return v;
}
