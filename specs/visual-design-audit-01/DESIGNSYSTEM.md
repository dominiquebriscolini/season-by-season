# Designsystem · Visual Design Audit 01

**Entwurfsstand 1.1.** Beide Layouts verwenden dieselben Maße und Zustände. Semantische CSS-Variablen genügen für die lokale Vorschau. Licht- und Dunkelwerte gehören zum UI-Entwurf. Globale Auswahlfarbe, weitere Akzente und finale Zeichnungsfarbe werden nach der Entwurfsentscheidung abgestimmt.

## Typografie und Rhythmus

| Rolle | Größe / Zeile | Verwendung |
| --- | --- | --- |
| Schriftfamilie | Segoe UI, system-ui, sans-serif | Systemschrift für Bedienelemente, Werte und Formulare. Georgia bleibt als sparsame Referenz der bisherigen zeichnerischen Titel verfügbar, etwa für den Gartennamen im Auswahlbildschirm. |
| Projekttitel / Paneltitel | 15/20, Gewicht 650 | Name des aktuell geöffneten Projekts, ein Titel pro Panel. Dialogtitel 17/24. |
| Text und Bedienelement | 13/18, 400 oder 600 | Labels, Aktionen, Formwerte und Daten. Datums- und Mengenwerte mit Tabellenziffern. |
| Zusatzinformation | 12/16, 400 oder 600 | Einheiten, Status, Legende, Quellen und Hilfetext. Feldfehler bleiben am Feld. |
| Abstand | 4, 8, 12, 16, 24, 32 px | 4 innerhalb einer Funktionsgruppe, 8 zwischen Elementen, 12 zwischen Feldgruppen, 16 als Panelrand, 24 zwischen größeren Blöcken. |
| Form | Kanten 1 px, Radien 4 / 6 / 10 px | 4 für kompakte Aktionsgruppen, 6 für Felder, 10 für Paneele und Dialoge. Schwebende Ebenen mit einer zurückhaltenden Schattenstufe. |

Schriftgrößen im CSS in `rem`, Abstände relativ zur Schrift oder in kleinen festen Schritten, flexible Container mit `minmax(0, 1fr)`. Lange Gartennamen umbrechen im Menü oder Dialog. Der Kopfauslöser darf kürzen, wenn sein zugänglicher Name vollständig bleibt. Zwei kräftige Zustände genügen für normalen und ausgewählten Text. Geringere Kontraste für deaktivierte Aktionen werden zusammen mit `disabled` und einem nachvollziehbaren Grund eingesetzt.

## Semantische Farben

| Token | Hell | Dunkel | Verwendung |
| --- | --- | --- | --- |
| `--desk` | `#eeefe7` | `#18221d` | Zeichenfläche rund um das Motiv |
| `--surface` | `#f9faf5` | `#222f28` | Kopfzeile, Dock, Panel, Dialog |
| `--ink` | `#202c24` | `#e6eee7` | Text und wichtige Icons |
| `--muted` | `#4a5c50` | `#adbbb0` | Sekundärtext und Status |
| `--line` | `#d6dcd2` | `#40544a` | Dekorative Trennlinie |
| `--control-line` | `#818f83` | `#88a091` | Relevante Feldgrenze oder Knopfumriss |
| `--active` | `#dce7d9` | `#314f3e` | Hintergrund für aktive Ansicht, Auswahl und gedrückte Taste |
| `--accent` | `#24563e` | `#a9d7b5` | Ein primärer Akzent für Auswahl und Aktion |
| `--on-accent` | `#ffffff` | `#172820` | Text auf gefüllter Hauptaktion |
| `--focus` | `#216147` | `#b9e8c3` | 2 px Fokuslinie mit 2 px Abstand |
| `--warning` | `#77541b` | `#eed19a` | Ausfall, offener Entwurf, Schreibschutz sofern eine Hervorhebung nötig ist |
| `--danger` | `#963b33` | `#f2aea7` | Fehler und bestätigungspflichtige Löschaktion |

Haupttext ≥ 4,5:1. Wichtige grafische Steuerelemente und Fokus ≥ 3:1 zum angrenzenden Hintergrund. `--control-line` begrenzt Felder auf `--surface`. Auf der Zeichenfläche oder auf aktivem Hintergrund kommt für funktionsrelevante Konturen `--accent` zum Einsatz. Gewählter Zustand hat neben Farbe eine sichtbare Kontur, Unterstreichung oder ein Textmerkmal. Dialoge und Overlays sind deckend. Die Ortskarten und die Original-Bagua-Grafik werden nicht eingefärbt. Kartenzuschreibungen und Warnungen sitzen auf einer ruhigen eigenen Fläche.

## Komponenten

| Komponente | Verhalten und Maße |
| --- | --- |
| Kopfzeile | Desktop 52 px, kompakt zwei Reihen zu je 46 px. Projekt links oben, Ansichten mittig bzw. in Reihe zwei. Rechts Status und Aktionen. Textschaltfläche für „Karte“ und „Beetplan“. |
| Kamera | Lineare Symbole, Kompassbuchstaben N/O/S/W, 32–36 px am Desktop. Kompakte/Touchansicht 44 px Mindestziel für jede Aktion. Aktive Richtung mit Kontur und `aria-pressed`. Gezielter Fokus bleibt am betätigten Werkzeug. |
| Eingaben und Aktionen | Desktop 32–34 px Mindesthöhe, bei Touch 44 px. Einheiten und Labels bleiben sichtbar. Primäraktion gefüllt, sekundäre Aktionen leise mit Umriss, destruktive Aktion mit Text. Icon-Aktionen haben zugänglichen Namen. Tooltip allein genügt nicht. |
| Detailpanel | Nichtmodal mit eigenem Titel, eindeutig benanntem Schließen und internem Scroll. Oben Auswahl, danach Bearbeitungsgruppe. Primäraktion zum jeweils offenen Bereich. Bei ungespeicherten Eingaben bleibt der Entwurf im Planer beim Einklappen erhalten. |
| Modaler Dialog | Zur Bestätigung, Bibliothek und Wechsel mit bestehendem Dialogverhalten. Titel, erster sinnvoller Fokus, Escape, Fokus zurück zum Auslöser. Maximalbreite 680 px. Höhe auf `100dvh` mit sicherem Rand begrenzt. Nutzbare Aktionen bleiben beim Scrollen erreichbar. |
| Saisonleiste | Datum mit Kalender plus Tagesregler, Tageswechsel und Wiedergabe. Mondphase mit Symbol und Text. Aktueller Plan oder Rückblick mit eindeutigem Status. Kalender und Planwahl bleiben mit der Tastatur erreichbar. |
| Kartenhinweise | Ruhige Textfläche auf der Karte und dauerhaft sichtbare Zuschreibung. Suche, Treffer, Ladezustand, fehlende Karte, Warnung zum Verwerfen und leere Auswahl erhalten jeweils ihren vorhandenen Informationsgehalt. |

Touchziele gelten für UI-Bedienelemente. Kleine räumliche Auswahlziele im SVG halten zusätzlich ihre bestehende zugängliche Alternative über Grundflächen- und Streifenliste. Standardbrowser-Zoom und schwere Systemschrift dürfen weder Panelfunktionen noch den Zugriff auf das ausgewählte Beet verdecken.
