import type { ReactNode } from "react";

export function PageHeader({ title, meta, children, level = 1 }: { title: string; meta?: ReactNode; children?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? "h1" : "h2";
  return (
    <header className="fo-page-header">
      {meta && <p className="fo-page-header__meta">{meta}</p>}
      <H className="fo-page-header__title">{title}</H>
      {children}
    </header>
  );
}

export function SectionHeading({ id, title, aside }: { id: string; title: string; aside?: ReactNode }) {
  return (
    <div className="fo-section-heading">
      <h2 id={id}>{title}</h2>
      {aside && <span className="fo-section-heading__aside">{aside}</span>}
    </div>
  );
}
