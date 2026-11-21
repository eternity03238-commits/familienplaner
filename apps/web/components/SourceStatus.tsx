import { sourceText, type Source } from "../lib/preview/model.ts";
import { SyncIcon } from "./Icon.tsx";

/** Shows provenance and sync state honestly: never "abgeglichen" without a confirmed timestamp. */
export function SourceStatus({ source, now }: { source: Source; now: string }) {
  return (
    <span className={`fo-source fo-source--${source.status}`}>
      <SyncIcon status={source.status} />
      <span>{sourceText(source, now)}</span>
    </span>
  );
}
