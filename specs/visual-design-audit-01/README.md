# Visual Design Audit 01 · Layoutspezifikation

**Fassung 1.1 · 19. November 2026.** Prüfstand für zwei lokale Entwürfe. Die Produktgrundlage sind [§§2–9 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md), die [verbindliche Flächenpartition](../../PLAN.md#verbindliche-flächenpartition) und die [Kameraspezifikation](../iso-camera/README.md). Die Vorlagen setzen bei der Oberfläche an. Pflanzenzeichnung, Gartenlogik, Geometrien, Daten, Sicherung und Exportformate liegen außerhalb der Änderung. Motiv ist der aus dem laufenden Planer exportierte [Bagua-Beetplan](../../evidence/visual-design-audit-01/iso/bagua-plot.svg) mit sieben Streifen. Die Entwurfsvorschauen arbeiten mit lokalen Ansichtsbeispielen und flüchtigem UI-Zustand.

## Gemeinsamer Nutzerweg

Bagua als Saisonprojekt 2028 öffnen. Im Beetplan steht das Projektmenü gemäß §3 oben links. „Karte“ und „Beetplan“ haben dieselbe Position beim Ansichtswechsel. Im Beetplan stehen Grundfläche und Streifen im Kontext von Auswahl und Kamera. Bei einem gewählten Streifen öffnet „Beetdetails“ die Bearbeitung. Ein Klick auf ein Beet kann die Auswahl ändern, ohne das Panel automatisch aufzuziehen. Beim ausdrücklichen Öffnen des nichtmodalen Panels wechselt der Tastaturfokus zum Titel oder ersten sinnvollen Feld. „Beetdetails schließen“ und Escape führen zum Auslöser zurück und erhalten Auswahl, Kamerafokus und Entwurf. Die Alternative zur grafischen Auswahl ist die bestehende Grundflächen- und Streifenliste.

Am Rand liegen die direkte Kompasswahl N/O/S/W, beide Vierteldrehungen, Zoom und Verschieben. Der Zoomfaktor und der Bodenpunkt im Zentrum der freien Zeichenfläche bleiben bei einem Layoutwechsel erhalten. Die bereits spezifizierte Kameraantwort auf Drehen, Zoom, Verschieben und reduzierte Bewegung gilt fort. Der Regler hat stets Datum, Tageswechsel, Wiedergabe und Mondphase. Die Planansicht bleibt in der Saisongruppe erreichbar. Ein Rückblick zeigt Jahr und „Schreibgeschützt“ in der Saisongruppe und im Kontextpanel. Der Weg zurück zum aktuellen Projekt bleibt an derselben Stelle.

Die Bildsprache kommt aus der Schraffur des vorhandenen Bagua-Motivs, einer matten Zeichenfläche, dünnen Trennlinien und linearen Zeichen für Werkzeugaktionen. Hell und Dunkel teilen Geometrie, Lesereihenfolge und Kontrastanforderungen. Das Motiv bleibt in den Vorschauen in seinen Originalfarben als eingebettete Zeichnung auf einem ruhigen Papierfeld. Der spätere Dunkelmodus der Zeichnung hat eigene Abnahmekriterien gemäß §6 und betrifft die Pflanzenarbeit. Für die UI sind die Werte in [DESIGNSYSTEM.md](DESIGNSYSTEM.md) eine prüfbare Entwurfspalette. Die endgültigen Akzenttöne einschließlich der globalen Auswahlfarbe entscheidet der Auftraggeber.

## A · Freie Zeichenfläche

Die ISO-Fläche reicht von der kompakten Kopfzeile bis zum unteren Fensterrand. Links oben sitzt die direkte Kompasswahl, links unten die Kameraleiste. Die Saisonsteuerung schwebt unten mittig, der Detaildialog als nichtmodales Panel rechts oben. Kantenabstand 16 px, Panelbreite 296 px. Das Panel legt sich über den Arbeitsflächenrand. Im gezeigten Ausgangsausschnitt bleibt der Garten daneben. Erst bei bewusst bis zum Rand verschobener Ansicht kann ihn das Panel teilweise verdecken. Schließen schafft in einem Schritt die gesamte Sicht zurück. Die Zeichenfläche bleibt beim Öffnen gleich groß. Bei der späteren Implementierung bleibt die Kamera beim Overlay-Wechsel identisch.

```text
Desktop · 1440 × 900                           Mobil · 390 × 844
┌─────────────────────────────────────────┐    ┌────────────────────┐
│ Projekt ▾       Karte│Beetplan    Status │    │ Projekt ▾  Aktionen│
├─────────────────────────────────────────┤    │ Karte │ Beetplan   │
│ N O S W                      ┌────────┐ │    ├────────────────────┤
│                              │ Details│ │    │ N O S W     Details│
│        [ ISO · Bagua ]        │ Beet   │ │    │    [ ISO Bagua ]   │
│                              │ Streifen││    │ [↶ ↷ − + Versch.] │
│                              └────────┘ │    │ [Details optional] │
│ [↶ ↷ − + Versch.]     [ Saisonregler ]  │    │ [Datum/Spiel/Mond]  │
└─────────────────────────────────────────┘    └────────────────────┘
```

Mobil wird aus dem seitlichen Panel ein unteres, intern scrollbares Fach über der Saisonsteuerung. Die Kameraleiste bleibt über dem Fach bedienbar. Der obere Kompass und der Projektschalter bleiben sichtbar. Bei weniger Platz schrumpft zuerst das Motiv in der freien Zeichenposition, Steuerungen und Berührungsziele bleiben lesbar. Die Panelhöhe bleibt unter 44 % des Arbeitsbereichs und lässt nach Kompass, Kamera und Saison mindestens 96 px freie Motivhöhe.

## B · Zeichentisch mit Randdock

Das Motiv liegt in einer freien Hauptfläche mit festen, klar getrennten Funktionsrändern. Saison und Status Dock unten, Kamera in einer vertikalen Gruppe am rechten Rand. Deren Spalte ist 56 px breit. Rechts vor der Kameragruppe kann ein 312 px breites, intern scrollendes Detaildock geöffnet werden. Die Zeichenfläche verkleinert sich um diese Breite. Motiv und Panel überschneiden sich nicht. Wenn das Dock geschlossen wird, kommt die gesamte Breite direkt der Zeichenfläche zugute. Die Kamerazone bleibt am selben Rand. Die spätere Umsetzung erhält beim Öffnen und Schließen des Docks Bodenfokus und Zoom und berechnet die Projektion nur für die neue Bildschirmmitte.

```text
Desktop · 1440 × 900                           Mobil · 390 × 844
┌─────────────────────────────────────────┐    ┌────────────────────┐
│ Projekt ▾       Karte│Beetplan    Status │    │ Projekt ▾  Aktionen│
├───────────────────────────┬────────┬────┤    │ Karte │ Beetplan   │
│                           │ Details│ N  │    ├────────────────────┤
│                           │ Beet   │ O  │    │                    │
│      [ ISO · Bagua ]      │ Streifen│…  │    │    [ ISO Bagua ]   │
│                           │        │ +  │    │                    │
│                           │        │ ↶  │    ├────────────────────┤
│                           │        │ ↷  │    │ [Details optional] │
├───────────────────────────┴────────┴────┤    │ [Kamera] [Details] │
│ [Datum / Tageswechsel / Spiel / Mond]    │    │ [Datum/Spiel/Mond]  │
└─────────────────────────────────────────┘    └────────────────────┘
```

Mobil schwenkt der Rand in ein festes unteres Dock. Kompass und Kamerawerkzeuge sitzen in zwei Reihen, jede mit eindeutigem Namen im Accessibility Tree. Das Detailfach öffnet sich als zusätzliche, intern scrollbare Reihe über dem Dock. Es bleibt unter 38 % des Arbeitsbereichs und lässt nach Kompass, Kamera und Saison mindestens 96 px freie Motivhöhe. Die Saisonbedienung bleibt unter den Werkzeugen verfügbar.

## Übertragung auf vorhandene Oberflächen

| Vorhandener Zugang | Soll für beide Varianten |
| --- | --- |
| Einstieg und lokaler Kartenausschnitt | Dieselbe Kopfzeile mit Gartenbezug. Auf der Karte bleiben „Weltkarte“, Kartenausschnitt und Vorlagen direkt in der Kartengruppe. Werkzeugleiste und Schritt-/Bestandspanel verwenden dieselbe Dichte wie im Beetplan. Kartenattribution bleibt an der Karte sichtbar. |
| Zeicheneditor | Der linke bzw. feste Werkzeugbereich zeigt aktive Phase und aktives Werkzeug. Unmittelbare Aktionen für Abschließen, letzten Punkt und Abbruch bleiben in der Zeichengruppe. Karteninteraktion, Zeichnen mit Enter und vorhandene Tastaturbefehle behalten ihre Semantik. Klassifikation, Korrektur virtueller Linien, Wegbreite, Bestandsobjekte und Flächenbilanz kommen in das zugehörige Panel. |
| Weltkarte, Straßenkarte/Luftbild und Ortswechsel | Bestehender modaler Dialog. Suche, Ebenenwechsel und Fehlerstatus oberhalb der Karte, Übernahme und Abbruch am unteren Dialogrand. Kartenausschnitt und Zuschreibung bleiben lesbar, auch während der Meldung über nicht verfügbare Kacheln. |
| Gartenkopf, gespeicherte Gärten, Sicherung und Altansicht | Namenseingabe bzw. Umbenennen, „Garten speichern“ und „Garten schließen“ über die Gartenaktionen. Speichermeldung, offener Entwurf und Fehler bleiben sichtbar bzw. werden angekündigt. Beim Schließen behält ein ungespeicherter Garten die vorhandene Rückfrage. Der Bibliotheksdialog zeigt zuerst Gartenname und „Öffnen“, gruppiert Sicherung und Wiederherstellen je Eintrag und behält Import, leere Liste, Fehlermeldungen und v1-Ansicht. Altansicht trägt einen lesbaren Hinweis auf Schreibschutz. |
| Saisonprojekte | Zugang links oben im Beetplan. Hauptjahr, neues Projekt, Kopiervorschlag, Vorjahresbezug und gespeicherte Projekte bleiben im modalen Projektdialog. Kein neuer KI-Einstieg. |
| Flächenwahl, Unterteilung, Änderung am Winkel | „Beetdetails“ mit Auswahl, getrennten Gruppen für „Aufteilung“ und „Streifen“, Breite und Winkel samt bestehender Streifenvorschau. Die Kamera bleibt vom Streifenwinkel getrennt. Bei Winkelbearbeitung und ungeklärter Wiederzuordnung bleibt der Bearbeitungsstatus lesbar. |
| Kultur, Sorte, Profil, Anbaudaten, Ernte | Im Kontext des ausgewählten Streifens. Formulare mit Einheiten und Feldfehlern, Werte und Quellen bleiben zugeordnet. Umfangreiche Anbaudaten und verschachtelte Bibliotheken verwenden den vorhandenen Dialogpfad. Erntejournal bleibt beim Streifen und im Rückblick lesbar. |
| Prüfliste, ältere Entwürfe und Konflikte | Sichtbarer Status im Kontext der betroffenen Fläche, lesbarer Vergleich und separate Aktionen für Übernehmen, Zuordnen oder Verwerfen. Auf schmalen Screens werden Spalten als beschriftete Zeilen dargestellt. Keine automatische Zuordnung durch UI-Änderung. |
| Druck / Excel | Über den bestehenden Beetplan-Ausgabepfad erreichbar. Anwendungstokens gelten für den Ausgabeeinstieg. Die bestehende beschriftete Draufsicht, Druckdaten, Einheiten und native Excel-Tabellen behalten ihre fachliche Struktur. |

## Prüffälle und Messgrenzen

| Fall | Erwartung an die isolierte Vorschau | Danach im regulären Planer nachzuweisen |
| --- | --- | --- |
| Fläche | Chromium 1440×900, 1280×720, 1024×768, 768×1024, 390×844 und 320×568. Kopfzeile ≤ 56 px hoch, ≤ 96 px kompakt (bis 900 px). Kein horizontaler Seitenüberlauf. A Zeichenfläche füllt den Arbeitsbereich ab Kopfzeile, B reserviert höchstens 56 px für Seitenwerkzeuge und 96 px für den Desktop-Saison-Dock. Ohne Panel ≥ 77 % Fensterfläche frei bei 1440×900 und ≥ 55 % bei 390×844. | SVG passt dauerhaft in dieselben Grenzen inklusive Tablet-Landschaft, Reflow bei 200 % und mobilem Browserzoom. Karten- und ISO-Nutzungsflächen bleiben einzeln messbar. |
| Panel | Bei 1440×900 Detailzustand A max. 296 px, B max. 312 px. Schließen bei beiden mit sichtbarem Rückweg. Bei 390×844 interner Scroll, andere Bedienelemente sichtbar, auch am kleinsten Prüffall 320×568 mindestens 96 px Motivbereich im offenen Zustand. Standardmotiv darf im dargestellten Ausgangsausschnitt nicht von Panel oder Werkzeugleiste überdeckt sein. | Pan, Fokus, Maßstab, Streifen-/Beetauswahl und laufende Eingaben bleiben beim Schließen und bei Viewportwechsel erhalten. Dialogöffnung für Unterteilung, Bibliothek und Konfliktvergleich respektiert dieselbe Auswahl. |
| Bedienung und Tastatur | Tab zum Steuerelement, Enter/Leertaste für Aktionen, native Tastaturbefehle für Regler, Auswahl- und Datumsfelder. Benannte Icon-Aktionen. Escape schließt oberste Ebene. Modal mit geschlossenem Fokuszyklus und Rückgabe zum Auslöser. Sichtbarer Fokus. Interaktive Ziele ≥ 32×32 CSS-px für Mausbedienung bzw. ≥ 44×44 CSS-px in kompakten und Touchansichten. | Bestehende SVG-Selektion, Verschiebegesten, Shift beim Winkelgriff, Enter beim Grenzzeichnen, Pfeiltasten am Regler und read-only Sperren regressionsprüfen. |
| Licht und Kontrast | Identischer Aufbau in Hell und Dunkel. 4,5:1 für Standardtext, 3:1 für wesentliche Umrisse, Fokus und Zustandsmarkierung. Aktive Ansicht, Auswahl und Schreibschutz zusätzlich in Form oder Text. | Tokens an realen Formularen, echten Kartenüberlagerungen und Ausfallmeldungen prüfen. Spektren für die spätere Zeichnung separat auswählen. |
| Projekt und Saison | Projekt oben links, Projektbeispieldialog, aktueller Plan, Rückblick und Rückkehr im selben Vorschaufenster. Datum, Mondphase, Tageswechsel, Wiedergabe und Planansicht erreichbar. Das Beispiel zeigt den Schreibschutz eindeutig. | Bagua 2027/2028 aus regulärer Speicherung prüfen. Fünf historische und sieben aktuelle Streifen, Ernten, gleichbleibende Kamera und vollständige gespeicherte Datensätze vergleichen. |
| Karte und Dialoge | Atlasartige Zeichenfläche durch Beispiel-Orthofoto oder Kartenaufnahme repräsentiert. Kartenzustand, Projektmenü und kompakte Beetdetails lassen sich durchspielen. Die restlichen Dialoge sind oben verbindlich zugeordnet. | Karte → belegtes Beet → Details → Rückblick → Druck/Excel mit bestehenden Golden Cases. Für Weltkarte, Bestand, Sicherung und v1 die vorhandenen Browserfälle wiederverwenden. |

Die Prozentwerte beziehen sich auf die zusammenhängende, für das Motiv verfügbare rechteckige Zone geteilt durch die Fensterfläche. Die Motivzone endet vor dauerhaft sichtbaren Überlagerungen oder Docks. Eine Panelöffnung darf die Position der Vorschauillustration in dieser Zone anpassen. Die spätere Abnahme prüft separat die beständige logische ISO-Kamera. Archivansicht, Sorten, Bestandsworkflow und die Ausgaben werden im Ist-Audit separat nachgewiesen.

## Lokale Entwurfsvorschau

[Beide Layouts vergleichen](http://127.0.0.1:5173/specs/visual-design-audit-01/). Die interaktiven Ansichten demonstrieren Projektwahl und Rückblick, Anbaudaten-Dialog, Panel, Moduswechsel, Zoom und Ausschnitt sowie Deutschformat im ruhenden Datumsfeld. Der Kalender verwendet das native Steuerelement und dessen Spracheinstellung beim Bearbeiten. Die Saisonprobe umfasst jeweils den 12. bis 23. Mai. Die Kompassknöpfe demonstrieren die Auswahl und ihre Zustände um ein aufgezeichnetes Motiv. Die tatsächliche Drehung und die grafische Streifenauswahl gehören zu den Regressionen im regulären Planer. Die Karte zeigt das [vorhandene Bagua-Orthofoto](../../evidence/segmentation/QUELLE.md) mit Zuschreibung. Fensterinterne Eingaben werden für den Test gehalten.
