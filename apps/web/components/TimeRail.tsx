import { BookOpen, CalendarClock, Dumbbell, LockKeyhole, School, Users } from "lucide-react";
import { formatTime, kindLabel, type EventKind, type RailGroup, type VisibleEvent } from "../lib/preview/model.ts";
import { ChildTag } from "./ChildTag.tsx";
import { SourcePill } from "./ui.tsx";

const KindIcon = ({ kind }: { kind: EventKind }) => {
  const I = kind === "school" ? School : kind === "sport" ? Dumbbell : kind === "study" ? BookOpen : kind === "family" ? Users : CalendarClock;
  return <I size={15} aria-hidden="true" className="fo-rail__icon" />;
};

/** Time rail (Command agenda + Explore calendar). All-day items lead; private slots show "belegt" only; a "jetzt" marker sits in time order. */
export function TimeRail({ group, now, nowLabel, showChild = true, showSource = true, labelledBy }: {
  group: RailGroup; now?: string; nowLabel?: string; showChild?: boolean; showSource?: boolean; labelledBy: string;
}) {
  const t = now ? Date.parse(now) : undefined;
  const nowIndex = t === undefined ? -1 : group.timed.findIndex(e => Date.parse(e.startsAt!) > t);
  const showNowAtEnd = nowLabel && nowIndex === -1 && group.timed.length > 0 && t !== undefined && group.timed.every(e => Date.parse(e.startsAt!) <= t);
  return (
    <div className="fo-rail">
      {group.allDay.length > 0 && (
        <ul className="fo-rail__allday" aria-label="Ganztägig">
          {group.allDay.map(e => (
            <li key={e.id}><span className="fo-rail__allday-label">Ganztägig</span><span className="fo-rail__allday-title">{e.title}</span>
              {showChild && (e.owner === "A" || e.owner === "B") && <ChildTag child={e.owner} />}</li>
          ))}
        </ul>
      )}
      <ol className="fo-rail__list" aria-labelledby={labelledBy}>
        {group.timed.map((e, i) => (
          <RailItem key={e.id} e={e} now={now} showChild={showChild} showSource={showSource} marker={i === nowIndex ? nowLabel : undefined} />
        ))}
        {showNowAtEnd && <li className="fo-rail__now"><span>{nowLabel}</span></li>}
      </ol>
    </div>
  );
}

function RailItem({ e, now, showChild, showSource, marker }: { e: VisibleEvent; now?: string; showChild: boolean; showSource: boolean; marker?: string }) {
  const past = now && e.endsAt ? Date.parse(e.endsAt) <= Date.parse(now) : false;
  return (
    <>
      {marker && <li className="fo-rail__now"><span>{marker}</span></li>}
      <li className={`fo-rail__item ${past ? "is-past" : ""}`}>
        <time className="fo-rail__time" dateTime={e.startsAt}>{formatTime(e.startsAt!)}</time>
        <div className={`fo-rail__card fo-rail__card--${e.redacted ? "private" : e.kind}`}>
          <p className="fo-rail__title">
            {e.redacted ? <LockKeyhole size={15} aria-hidden="true" className="fo-rail__icon" /> : <KindIcon kind={e.kind} />}
            <strong>{e.title}</strong>
            {showChild && (e.owner === "A" || e.owner === "B") && <ChildTag child={e.owner} />}
          </p>
          <p className="fo-rail__meta">
            <span>{formatTime(e.startsAt!)}–{formatTime(e.endsAt!)}</span>
            <span>{e.redacted ? "belegt, Details privat" : kindLabel[e.kind]}</span>
            {past && <span>vorbei</span>}
          </p>
          {e.detail && !e.redacted && <p className="fo-rail__detail">{e.detail}</p>}
          {showSource && !e.redacted && now && <SourcePill source={e.source} now={now} />}
        </div>
      </li>
    </>
  );
}
