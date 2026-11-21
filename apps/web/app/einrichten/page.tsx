"use client";

import Link from "next/link";
import { useState } from "react";
import { artUrl } from "../../lib/art/paths.ts";
import styles from "./setup.module.css";

export default function FamilySetup() {
  const [family, setFamily] = useState("");
  const [firstName, setFirstName] = useState("");
  const [preview, setPreview] = useState(false);

  return (
    <main className={styles.page} data-fo-role="parent">
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><img src={(process.env.NEXT_PUBLIC_ASSET_BASE ?? "") + "/art/v3/familyos-symbol.svg"} width="36" height="36" alt="" />FamilyOS</Link>
        <span>Einrichtung · Designvorschau</span>
      </header>
      <div className={styles.panel}>
        <div className={styles.art}>
          <picture>
            <source media="(max-width: 720px)" srcSet={artUrl("observatory-dusk-mobile.webp")} />
            <img src={artUrl("observatory-dusk-wide.webp")} alt="" />
          </picture>
          <div className={styles.caption}><span>Familienplaner</span><strong>{family.trim() || "Eure Familie"}</strong></div>
        </div>
        <section className={styles.content} aria-labelledby="setup-title">
          <div className={styles.progress}>Schritt 2 von 5 · Familie
            <div aria-hidden="true">{[1, 2, 3, 4, 5].map(n => <i key={n} data-filled={n <= 2} />)}</div>
          </div>
          <h1 id="setup-title">{preview ? "Euer Familienprofil" : "Wie heißt eure Familie?"}</h1>
          {preview ? <>
            <p role="status">So erscheint euer Profil im Familienplaner.</p>
            <dl className={styles.summary}><dt>Familienname</dt><dd>{family.trim()}</dd><dt>Dein Vorname</dt><dd>{firstName.trim()}</dd></dl>
            <button onClick={() => setPreview(false)}>Angaben bearbeiten</button>
          </> : <>
            <p>Gib eurem gemeinsamen Kalender einen Namen und trag deinen Vornamen ein.</p>
            <form onSubmit={event => { event.preventDefault(); setPreview(true); }}>
              <label>Familienname<input required pattern=".*\S.*" maxLength={80} value={family} onChange={e => setFamily(e.target.value)} placeholder="z. B. Familie Sommer" /></label>
              <label>Dein Vorname<input required pattern=".*\S.*" maxLength={80} autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="z. B. Alex" /></label>
              <button type="submit">Profil ansehen <span aria-hidden="true">→</span></button>
            </form>
          </>}
          <small>Deine Eingaben bleiben nur in dieser Vorschau.</small>
        </section>
      </div>
    </main>
  );
}
