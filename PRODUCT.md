# PRODUCT.md — FamilyOS Produktspezifikation v1.2

## Vision
Ein AI-first Familienplaner, der Kalender, Schule, Sport, Lernzeiten und Projekte zusammenführt. Nicht nur Ereignisse anzeigen, sondern nächste Schritte vorschlagen und planbare Aufgaben frühzeitig strukturieren.

## Ausgangsfall
- 2 Erwachsene, 2 Kinder in Klasse 5 (Kind A 10 Jahre, Gymnasium mit mathematischem Schwerpunkt laut bisheriger Beschreibung; Kind B Klasse 5 Gemeinschaftsschule, Alter noch unklar).
- Apple-Geräte / iPhones, Google Kalender.
- Schulplattformen: Nutzereingabe „lernlax“ (vermutlich LernSax, **zu bestätigen**), „VP plan“, „besteschule“, „DLS“; tatsächliche Anbieter-URLs und API-Berechtigungen offen.

## Jobs to be done
**Eltern**: Tages-/Wochenübersicht, Konflikte sehen, Aufgaben und Abgaben rechtzeitig erkennen, gute Planung bestätigen, nur relevante Benachrichtigungen bekommen.

**Kinder**: eigenen Tagesplan auf dem iPhone sehen, Aufgaben einfach abhaken, wissen warum/wann sie lernen, größere Projekte in kleinen Schritten schaffen.

## MVP-Funktionen (priorisierte Reihenfolge)
P0: Anmeldung/Eltern- und Kinderprofile; getrennte Rechte; Familienkalender; Aufgaben und Routinen; Aufgaben abhaken; responsive Tagesansicht.
P1: Hausaufgaben, Klassenarbeiten, Projekte, Sport, Fachzuordnung; manuelle Eingabe und quellmarkierter Import; verlässliche Kalenderintegration.
P2: AI-Lernplanvorschläge, passende Lernmethoden in Explore, Elternfreigaben, automatische Umplanung, Wochenzusammenfassung.

## Lernmethoden in Explore

Zu einer Hausaufgabe, Klassenarbeit oder einem Projekt schlägt FamilyOS eine kurze Methode vor, die zum Lernziel passt. Klasse 5 startet mit Abruffragen und Karteikarten, verteilten Wiederholungen, Sachtext-Leseschritten und erklärten Lösungsbeispielen. Das Kind kann die Methode ausprobieren, wechseln oder überspringen. Vorgeschlagene Wiederholungen folgen den bestehenden Planungs- und Freigaberegeln. [Lernmethoden, Forschungsgrundlagen und Akzeptanzkriterien](docs/learning/LERNMETHODEN.md).

## Später, explizit NICHT Sprint 0
Patchwork-Freigabeoberfläche, mehrere Haushalte, fremde Gast-/Betreuerkonten, weitere Kalender-/Login-Provider, Schul-Autoconnectors, Foto-/OCR-Pipelines, App-Store-Apps, öffentliche Multi-Familien-Plattform.

## Produktspezifische Regeln
- Aufgaben und Prüfungen pro Kind; Erwachsene sehen nur Berechtigtes.
- Schulische Quellen bleiben nachvollziehbar und unmodifiziert.
- Lernzeiten berücksichtigen Schule, Sport, Pausen, Belastung, Ruhezeiten und Abgabepuffer.
- Standardvorschläge für Klasse 5 (z.B. 25 Min. Block, maximal 60 Min. zusätzliche Lernzeit, 2 Tage Puffer) sind **einstellbar** und kein pädagogischer Zwang.
- Bei Mehrfachbelastung eher Konflikt anzeigen als Zeitpläne überfüllen.
- Planvorschläge sind bis zur erforderlichen Freigabe keine bestätigten Termine.
- Keine unnötigen Leistungsrankings für Kinder.

## Rollen (MVP)
Zwei Eltern / Erziehungsberechtigte mit administrativen Fähigkeiten; Kinder sehen und bearbeiten nur freigegebene eigene Inhalte. Erwachsene haben nicht automatisch Zugriff auf sämtliche privaten Erwachsenentermine.

## Patchwork-Vision
Ein Kinderprofil kann zu mehreren Haushalten in Beziehung stehen. Pro verantwortlicher Person und Kind können `school`, `sports`, `tasks`, `exams`, `projects` oder andere Bereiche lesbar/bearbeitbar freigegeben werden. Ablauf und Widerruf, revisionssichere Ereignisse, keine automatische Einsicht in Geschwisterdaten. Berechtigung zur Vergabe nach tatsächlich nachgewiesener Sorge-/Einwilligungssituation.

## Akzeptanzkriterien späterer MVP-Version
1. Nutzer A und Nutzer B können sich sicher anmelden.
2. Je Kind existiert ein eigenständiger Tagesplan ohne Datenvermischung.
3. Google-Termine erscheinen ohne Duplikate und nach Änderungen konsistent.
4. Hausaufgaben und Prüfungen sind manuell erfassbar.
5. KI-Vorschlag berücksichtigt harte Termine und kann abgelehnt werden.
6. Erledigung ist auf mehreren Geräten sichtbar.
7. Fehlende Connector-Berechtigungen liefern einen klaren Status statt angeblicher Sync-Erfolge.
8. Automatisierte Sicherheits- und Mandantentests schlagen bei unerlaubtem Datenzugriff fehl.
