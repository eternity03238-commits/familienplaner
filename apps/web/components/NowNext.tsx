import type { ReactNode } from "react";

/**
 * Signature moment 1 — the single hero of a screen: exact time, what happens, one action.
 * Clipped corner + offset volt underline are the GAMEPLAN geometry; nothing else on the screen is this loud.
 */
export function NowNext(props: {
  label: string;
  time: string;
  title: string;
  meta?: ReactNode;
  current?: ReactNode;
  action?: { href: string; label: string };
  headingLevel?: 1 | 2;
}) {
  const H = props.headingLevel === 1 ? "h1" : "h2";
  return (
    <section className="fo-nownext" aria-labelledby="fo-nownext-title">
      <p className="fo-nownext__label">{props.label}</p>
      <p className="fo-nownext__time"><time className="fo-num">{props.time}</time></p>
      <H id="fo-nownext-title" className="fo-nownext__title">{props.title}</H>
      {props.meta && <p className="fo-nownext__meta">{props.meta}</p>}
      {props.action && <a className="fo-button fo-button--on-inverse" href={props.action.href}>{props.action.label}</a>}
      {props.current && <p className="fo-nownext__current">{props.current}</p>}
    </section>
  );
}
