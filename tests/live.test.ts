import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CONNECTIONS, STATUS_LABEL } from "../apps/web/lib/live/connections.ts";
import { toFamily } from "../apps/web/lib/live/session.ts";

test("connections page never claims a connection that does not exist", () => {
  assert.deepEqual(CONNECTIONS.map(c => c.id), ["google_calendar", "lernsax", "vpplan", "beste_schule", "dls"]);
  for (const c of CONNECTIONS) {
    const text = [c.what, ...c.how, c.until, STATUS_LABEL[c.status]].join(" ");
    assert.doesNotMatch(text, /\bverbunden\b(?! ist)|synchronisiert|aktiv/i, `${c.id} must not sound connected`);
    assert.ok(c.how.length > 0 && c.until.length > 0, `${c.id} explains how and what until then`);
  }
  assert.equal(CONNECTIONS.filter(c => c.status === "next").map(c => c.id).join(), "google_calendar", "Google Calendar is the first provider (CLAUDE.md)");
  const school = CONNECTIONS.filter(c => c.id !== "google_calendar").map(c => c.how.join(" ")).join(" ");
  assert.match(school, /offizi/, "school portals only through official ways (rule 6)");
});

test("my_family rows become one family with roles; empty means no family", () => {
  assert.equal(toFamily([]), null);
  const f = toFamily([
    { family_id: "f", family_name: "Sommer", person_id: "p1", display_name: "Alex", role: "adult", is_me: true },
    { family_id: "f", family_name: "Sommer", person_id: "p2", display_name: "Mia", role: "child", is_me: false }
  ]);
  assert.equal(f?.familyName, "Sommer");
  assert.deepEqual(f?.members.map(m => `${m.role}:${m.name}:${m.isMe}`), ["adult:Alex:true", "child:Mia:false"]);
});

test("live parent frame never renders demo screens or the demo banner", () => {
  const src = readFileSync(new URL("../apps/web/components/command/CommandFrame.tsx", import.meta.url), "utf8");
  assert.match(src, /state\.kind !== "preview"[\s\S]*demoNote=\{null\}[\s\S]*<LiveCommand/);
});
