# ADR 0002: Person, Auth-Konto, Familie und Haushalt getrennt
Status: Accepted · 2026-11-21

**Entscheidung:** Ein Auth-Account (`users`) identifiziert eine Person (`persons`), Haushalte und Familien sind separate Membership-Entitäten. Ein Kind kann zu mehreren Haushalten gehören. Zugriffe entstehen nicht durch Haushaltszuordnung allein, sondern durch konkrete Guardian-/Grant-Berechtigung.

**Konsequenzen:** Komplexeres Datenmodell, aber keine Sackgasse bei Patchwork, Angehörigen und späteren Familiengruppen. Scope-Based Grants bleiben anfangs nur Schema, nicht UI.
