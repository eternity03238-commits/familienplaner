import test from "node:test";
import assert from "node:assert/strict";
import { explain, inviteLink, readInviteToken, previewBackend } from "../apps/web/lib/setup/backend.ts";
import { supabaseConfig } from "../apps/web/lib/supabase/browser.ts";

test("errors become short German next steps, server text is never shown", () => {
  assert.match(explain({ status: 429, message: "email rate limit exceeded" }), /zu viele Codes/);
  assert.match(explain({ code: "otp_expired", message: "Token has expired or is invalid" }), /neuen an/);
  assert.match(explain({ message: "email_address_not_authorized" }), /noch keine E-Mail/);
  assert.match(explain({ code: "22023", message: "Invite is not valid" }), /Einladung/);
  assert.match(explain({ code: "23505" }), /schon zu einer Familie/);
  assert.match(explain({ code: "42501" }), /Berechtigung/);
  const other = explain({ message: "relation public.secret does not exist" });
  assert.ok(!other.includes("secret"), "internal details are not leaked");
});

test("invite token travels in the URL fragment and is parsed strictly", () => {
  const link = inviteLink("https://familyos.example", "", "AbC_def-123456789012345678901234");
  assert.equal(link, "https://familyos.example/einrichten/#einladung=AbC_def-123456789012345678901234");
  assert.equal(readInviteToken(new URL(link).hash), "AbC_def-123456789012345678901234");
  assert.equal(readInviteToken("#einladung=<script>"), null);
  assert.equal(readInviteToken("#einladung=short"), null);
  assert.equal(readInviteToken(""), null);
});

test("browser config: missing values mean preview; secret keys are refused", () => {
  assert.equal(supabaseConfig({ url: undefined, key: undefined }), null);
  assert.deepEqual(supabaseConfig({ url: "https://abcdefghijklmnopqrst.supabase.co", key: "sb_publishable_x" }), { url: "https://abcdefghijklmnopqrst.supabase.co", key: "sb_publishable_x" });
  assert.throws(() => supabaseConfig({ url: "https://abcdefghijklmnopqrst.supabase.co", key: "sb_secret_abc" }), /secret/);
  assert.throws(() => supabaseConfig({ url: "http://evil.example", key: "k" }), /supabase\.co/);
  const jwt = (role: string) => `x.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.y`;
  assert.ok(supabaseConfig({ url: "https://abcdefghijklmnopqrst.supabase.co", key: jwt("anon") }));
  assert.throws(() => supabaseConfig({ url: "https://abcdefghijklmnopqrst.supabase.co", key: jwt("service" + "_role") }), /secret/);
});

test("preview backend never needs a network", async () => {
  const b = previewBackend();
  assert.equal(b.mode, "preview");
  assert.equal(await b.loadFamily(), null);
  assert.equal(await b.createFamily("A", "B"), "preview-family");
});
