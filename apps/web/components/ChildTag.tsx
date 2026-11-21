import type { ChildKey } from "../lib/preview/model.ts";

/** Member marker: letter + shape (A square, B round) — colour is only a secondary cue. */
export function ChildTag({ child, long = false }: { child: ChildKey; long?: boolean }) {
  return (
    <span className={`fo-child-tag fo-child-tag--${child}`}>
      <span className="fo-child-tag__mark" aria-hidden="true">{child}</span>
      <span className={long ? undefined : "fo-sr-only"}>Kind {child}</span>
    </span>
  );
}
