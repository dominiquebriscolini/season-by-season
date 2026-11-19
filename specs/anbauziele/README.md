# Anbau planen · Gesamtbeet und Streifenziele

**Fassung 1.0 · 19. November 2026.** Maßstab sind die Nutzeraufnahme von „Beet · Test 01“ und [§§ 3–5 und 8 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md). In der Aufnahme stehen sechs geplante Unterteilungen im Feld, zusammen mit einer noch sichtbaren Kulturwahl für das zuletzt gespeicherte Gesamtbeet. Die Zahl im Beispiel ist ein Prüfwert. Dieselbe Regel gilt für jede gespeicherte Anzahl zwischen zwei und hundert.

## Bedeutung der Auswahl

Das Gesamtbeet ist die Grundfläche aus der Karte. Der Beetplan hat einen Namen und eine optionale Unterteilung dieser einen Fläche. Bei einer Unterteilung ist jede nutzbare Zelle ein eigener Streifen mit eigener Belegung und eigenen Anbaudaten. Außenkontur, Flächentyp, Wege und gespeicherte Kennungen folgen der bisherigen Datenlogik. Die bestehende Zuordnungsprüfung bei Änderungen der Unterteilung erhält eindeutige Zuordnungen und zeigt mehrdeutige in der Prüfliste. Die persönliche Kulturbibliothek bleibt an einem tatsächlich bepflanzbaren Ziel erreichbar.

```text
Gesamtbeet, gespeichert 1        Gesamtbeet, gespeichert 6        Ausgewählter Streifen der 6
┌ Anbau planen ──────────┐       ┌ Anbau planen ──────────┐       ┌ Anbau planen ──────────┐
│ Grundfläche  [Test 01] │       │ Grundfläche  [Test 01] │       │ Grundfläche  [Test 01] │
│ Beet · Test 01         │       │ Beet · Test 01         │       │ Beet · Test 01         │
│ ▾ Beet und Unterteilung│       │ Streifen [Ganzes Beet] │       │ Streifen  [Streifen 2] │
│   Name und Unterteilung│       │ ▾ Beet und Unterteilung│       │ ▸ Beet und Unterteilung│
│                        │       │   Name und Unterteilung│       │   Anbau · Streifen 2   │
│ Anbau · Ganzes Beet    │       │ 6 Streifen gespeichert │       │   Kultur wählen        │
│   Kultur wählen        │       │ Streifen wählen        │       │   Eigene Kultur …      │
│   Eigene Kultur …      │       │                        │       │   Belegung speichern   │
└────────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

- **Grundfläche und Streifenwahl.** Die Grundfläche bleibt über der Auswahl. Bei gespeicherter Teilung bietet der Streifenwähler das ganze Beet und die nutzbaren Streifen. Ein Klick in der Zeichnung wählt denselben Streifen. Vollständig vom Bestand verdeckte Streifen werden bei Bedarf als nicht nutzbar gekennzeichnet. Der Gesamtbereich ist unabhängig von der Streifenwahl erreichbar. Am eingeklappten Abschnitt muss klar sein, dass er Name und Unterteilung enthält. Bei Auswahl eines Streifens öffnet sich zunächst sein Anbau. Der zusammenklappbare Beetabschnitt bewahrt geöffnete Eingaben, solange die Auswahl gleich bleibt.
- **Vorschau auf neues Anbauziel.** Wird ein ungeteiltes Beet mit zwei oder mehr Streifen entworfen, zeigt die Vorschau die Teilung und der Dockhinweis führt zu „Unterteilung übernehmen“ und anschließend zur Streifenwahl. Kulturwahl, Bibliotheksaktion und Anbaudaten des ganzen Beets treten während dieser Vorschau zurück. Die Ernteerfassung für das Gesamtbeet pausiert, eine frühere Ernte bleibt als Historie zugänglich. Wird die Eingabe auf eins zurückgesetzt, ist das Gesamtbeet wieder als Anbauziel verfügbar. Ein bereits eingegebener Kulturentwurf bleibt bis zu einer ausdrücklichen Konfliktentscheidung verfügbar.
- **Gespeicherte Unterteilung.** Erst nach Übernahme stehen die neu berechneten Streifen als auswählbare Ziele mit eigener Kultur bereit. Die Aufteilung am Gesamtbeet bleibt erreichbar. Bei einem Entwurf an einem bereits gespeicherten Streifen bleibt dessen bisherige Belegung im vorhandenen Teilentwurfsweg bearbeitbar. Der Hinweis nennt die gespeicherte Geometrie. Anbau, Anbaudaten und Ernte beziehen sich auf das gültige Anbauziel. Die Ausgabe verwendet dieselben gespeicherten IDs. Die Vorjahresansicht zeigt gespeicherte Zielauswahl und Daten schreibgeschützt.

## Toolbar und Saisonleiste

```text
Desktop · rechter Rand        Mobil · unter der Zeichnung
┌──────┐                      ┌────────────────────────────────┐
│  ◐   │                      │ ◐                Beetdetails │
│  N   │                      │ N  O  S  W                     │
│  O   │                      │ Ansichtsdrehung · Zoom · Hand  │
│  S   │                      └────────────────────────────────┘
│  W   │                      Saisonleiste · [Mond 24 px] Vollmond
│ …    │
└──────┘
```

- **Farbschema.** Icon-only „Farbschema“ steht direkt oberhalb von N/O/S/W im Beetplan und Rückblick. Die Karte behält ihren Auslöser in der Kopfleiste. Die Auswahl „System“ verwendet dieselbe helle Palette wie „Hell“, auch bei dunkler Betriebssystemvorgabe. „Dunkel“ wirkt weiter über beide Ansichten. Die gespeicherte Einstellung und Fokus-Rückgabe zum tatsächlich benutzten Auslöser gelten weiter. Mobil hat der Auslöser 44 × 44 CSS-Pixel.
- **Mondphase.** Ein runder, mindestens 24 × 24 CSS-Pixel großer, zweifarbiger Mond aus den vorhandenen Vorder- und Hintergrundfarben der Oberfläche ersetzt das farbige Emoji. Die acht Phasen haben unterscheidbare Formen, die Textanzeige bleibt lesbar und der Mond selbst bleibt dekorativ. Saisonregler, Ortsdatum und zugrunde liegende Phasenberechnung verwenden den bisherigen Ablauf. Bei 320 und 390 px bleiben alle erreichbaren Funktionen im Dokument horizontal sichtbar. In kurzen Fenstern darf die Oberfläche vertikal scrollen.

## Abnahme auf einer Krautgaart-Kopie

| Prüffall | Beobachtbares Soll |
| --- | --- |
| Ganzes Beet → Vorschau 6 → speichern | Ganzes Beet mit gespeicherter Anzahl 1 bietet Kultur und Anbaudaten. In der Sechser-Vorschau verschwinden diese Aktionen am ganzen Beet. Bei Übernahme bleiben Außenkontur und ID gleich. Im Gesamtbeet bleiben sechs bestätigte Streifen wählbar und die Kulturaktion bleibt ausgeblendet. |
| Streifen 1 und 6 belegen | Je einen Streifen per Liste bzw. Plan wählen und eine Kultur speichern. Namen und Kultur erscheinen am passenden Ziel. Nach Wiederöffnen besitzt jeder der beiden Streifen seine Kultur. Anbaudaten, Ernte und Ausgabe gehören zum jeweils gespeicherten Streifen. |
| Entwürfe und Bestand | Eingabe 6 auf 1 zurücksetzen stellt die Ganzbeet-Kulturwahl samt älterem Entwurf wieder her. Für einen bereits gespeicherten Streifen bleiben Teilentwürfe getrennt speicherbar. Die Prüfliste übernimmt mehrdeutige frühere Belegungen. Nicht nutzbare Streifen können keine Kultur speichern. |
| Rückblick | Verknüpftes Vorjahr mit gespeicherter Teilung öffnen. Streifenauswahl und historische Belegung sind sichtbar. Editoren bleiben gesperrt. |
| Farbschema und Mond | Desktop sowie 390 und 320 px. Icon oberhalb des Kompasses und mit Rückfokus. Bei dunkler Systemvorgabe sind „System“ und „Hell“ visuell gleich. „Dunkel“ bleibt wählbar. Acht Phasen behalten ihre Bezeichnung und nutzen allein die Farbpalette. Die an der Oberfläche gemessene Mondscheibe ist mindestens 24 × 24 CSS-Pixel groß. |
