import { formatTime, kindLabel, type RailGroup, type VisibleEvent } from "../lib/preview/model.ts";
import { ChildTag } from "./ChildTag.tsx";
import { KindMark, LockIcon } from "./Icon.tsx";
import { SourceStatus } from "./SourceStatus.tsx";

/** Signature moment 2 — school, sport and study on one editorial vertical timeline; all-day items lead separately. */
export function TimeRail({ group, now, nowLabel, showChild = true, labelledBy }: { group: RailGroup; now?: string; nowLabel?: string; showChild?: boolean; labelledBy: string }) {
  const t = now ? Date.parse(now) : undefined;
  const nowIndex = t === undefined ? -1 : group.timed.findIndex(e => Date.parse(e.startsAt!) > t);
  return (
    <div className="fo-rail">
      {group.allDay.length > 0 && (
        <ul className="fo-rail__allday" aria-label="Ganztägig">
          {group.allDay.map(e => (
            <li key={e.id} className="fo-rail__allday-item">
              <span className="fo-rail__allday-label">Ganztägig</span>
              <span className="fo-rail__allday-title">{e.title}</span>
              {showChild && (e.owner === "A" || e.owner === "B") && <ChildTag child={e.owner} />}
            </li>
          ))}
        </ul>
      )}
      <ol className="fo-rail__list" aria-labelledby={labelledBy}>
        {group.timed.map((e, i) => (
          <TimeRailItem key={e.id} event={e} now={now} showChild={showChild} nowMarker={i === nowIndex && nowLabel ? nowLabel : undefined} />
        ))}
        {nowIndex === -1 && nowLabel && group.timed.length > 0 && <li className="fo-rail__now" aria-label={`Jetzt, ${nowLabel}`}><span>{nowLabel}</span></li>}
      </ol>
    </div>
  );
}

function TimeRailItem({ event: e, now, showChild, nowMarker }: { event: VisibleEvent; now?: string; showChild: boolean; nowMarker?: string }) {
  const past = now && e.endsAt ? Date.parse(e.endsAt) <= Date.parse(now) : false;
  return (
    <>
      {nowMarker && <li className="fo-rail__now" aria-label={`Jetzt, ${nowMarker}`}><span aria-hidden="true">{nowMarker}</span></li>}
      <li className={`fo-rail__item fo-rail__item--${e.kind} ${e.redacted ? "is-redacted" : ""} ${past ? "is-past" : ""}`}>
        <time className="fo-rail__time fo-num" dateTime={e.startsAt}>{formatTime(e.startsAt!)}</time>
        <span className="fo-rail__node"><KindMark kind={e.kind} /></span>
        <div className="fo-rail__body">
          <p className="fo-rail__title">
            {e.redacted && <LockIcon />}
            <span>{e.title}</span>
            {showChild && (e.owner === "A" || e.owner === "B") && <ChildTag child={e.owner} />}
          </p>
          <p className="fo-rail__meta">
            <span className="fo-num">{formatTime(e.startsAt!)}–{formatTime(e.endsAt!)}</span>
            <span>{e.redacted ? "belegt, Details privat" : kindLabel[e.kind]}</span>
          </p>
          {e.detail && !e.redacted && <p className="fo-rail__detail">{e.detail}</p>}
          {!e.redacted && now && <SourceStatus source={e.source} now={now} />}
          {past && <span className="fo-sr-only">(vorbei)</span>}
        </div>
      </li>
    </>
  );
}
