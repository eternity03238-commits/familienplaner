"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { missions as allMissions, project } from "../../lib/preview/fixtures.ts";
import { toggleMission, toggleStage, type Mission, type Stage, type Viewer } from "../../lib/preview/model.ts";

export const exploreViewer: Viewer & { kind: "child" } = { kind: "child", id: "A" };

interface ExploreState {
  missions: Mission[];
  stages: Stage[];
  world: "dusk" | "night";
  notice: string | null;
  toggle: (id: string) => void;
  toggleStage: (i: number) => void;
  setWorld: (w: "dusk" | "night") => void;
  clearNotice: () => void;
}
const Ctx = createContext<ExploreState | null>(null);

/** Lives in the /explore layout, so mission and stage state survives tab navigation. Local only, never persisted. */
export function ExploreProvider({ children }: { children: ReactNode }) {
  const [missions, setMissions] = useState(() => allMissions.filter(m => m.child === exploreViewer.id));
  const [stages, setStages] = useState<Stage[]>(project.steps);
  const [world, setWorld] = useState<"dusk" | "night">("dusk");
  const [notice, setNotice] = useState<string | null>(null);
  const toggle = (id: string) => {
    const before = missions.find(m => m.id === id);
    setMissions(ms => toggleMission(ms, id, exploreViewer));
    if (before) setNotice(before.done ? `„${before.title}“ ist wieder offen.` : `Erledigt: „${before.title}“.`);
  };
  const flipStage = (i: number) => {
    const before = stages[i];
    setStages(st => toggleStage(st, i, exploreViewer, project.child));
    if (before) setNotice(before.done ? `Etappe „${before.title}“ ist wieder offen.` : `Etappe „${before.title}“ geschafft.`);
  };
  return (
    <Ctx.Provider value={{ missions, stages, world, notice, toggle, toggleStage: flipStage, setWorld, clearNotice: () => setNotice(null) }}>
      {children}
    </Ctx.Provider>
  );
}
export function useExplore(): ExploreState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useExplore outside ExploreProvider");
  return v;
}
