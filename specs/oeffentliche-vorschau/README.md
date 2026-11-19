# Öffentliche Vorschau · Krautgaart

**Fassung 1.0 · 19. November 2026.** Der Auftrag umfasst den geprüften Quellcode und eine öffentliche GitHub-Pages-Vorschau. Die Nutzungs- und Speicherlogik folgt [§§ 2–5 und 8 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md). Die bisherigen Krautgaart-Abnahmen bleiben auf der separaten privaten Prüfkopie lokal.

```text
Frischer Browser · …/season-by-season/?beispiel=krautgaart
┌ Gespeicherte Gärten · Druck · Excel · Saisonprojekte · Krautgaart ┐
│                            Karte · Beetplan                     │
├──────────────────────────────────────────────────────────────────┤
│   ISO: zusammenhängendes Wegenetz, fünf Flächen, Kulturstreifen   │
│   Beetdetails und Saisonleiste                                   │
└──────────────────────────────────────────────────────────────────┘
```

- Der Einstieg mit `?beispiel=krautgaart` öffnet den vorhandenen Beetplan mit einem ausdrücklich schematischen Krautgaart-Beispiel. Das Beispiel verwendet neu gezeichnete Flächen, frei gewählte Belegungen und fiktive Koordinaten. Die persönliche Gartensicherung, historischer Privatbestand und zugehörige Luftbilder bleiben lokal.
- Die Demo verwendet die vorhandenen Funktionen für Karte, Beetplan, Saisonprojekt sowie Druck und Excel. Speichern und erneutes Öffnen gelten im jeweiligen Browser. Weitere Besuche öffnen dieselbe dort gespeicherte Beispielkopie. Ein ungespeicherter Sitzungsentwurf hat beim Wiederöffnen Vorrang.
- Die normale Startadresse behält ihren Einstieg. Der existierende Kartenbildbestand bleibt über seinen bisherigen Ablauf verfügbar und verwendet auf GitHub Pages den Projekt-Unterordner. Das schematische Beispiel fordert kein Luftbild und keine Weltkartenkacheln an.

| Prüffall | Soll |
| --- | --- |
| Frischer Browser | Direkter Link zeigt „Krautgaart“ mit fünf Grundflächen, Wegeflächen und Beispielsaat beziehungsweise Kulturstreifen. Karte, Beetplan, Hauptjahr, Druck und Excel sind auf 1440 und 390 CSS-Pixeln erreichbar. |
| Daten und Wiederöffnung | Entwürfe und gespeicherte Änderungen bleiben browserlokal. Die Beispielkopie bleibt nach Neuladen eindeutig. Änderungen und Wiederherstellung benutzen den bestehenden Speicherweg. Die öffentliche Datei enthält keine private Ortsreferenz, Sicherung oder Nutzerdaten. |
| Veröffentlichung | Die ausgelieferte URL funktioniert ohne Anmeldung. Assets laden im Repository-Unterordner. Der veröffentlichte Stand lässt sich auf denselben geprüften Git-Commit zurückführen. |
