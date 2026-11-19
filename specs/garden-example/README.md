# Öffentliche Vorschau · Garden_Example

**Fassung 1.0 · 19. November 2026.** Grundlage ist der Auftrag, das alte öffentliche Beispiel zu ersetzen, einen passenden Weltkartenstandort vorzubereiten und mehrere nachvollziehbare Belegungen zu zeigen. Grundlage für Geometrie und Anbau sind [§§ 2–5 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md).

```text
Öffentliche Startseite und ?beispiel=garden-example
┌ Garden_Example                 [Karte] [Beetplan] ┐
│ Weltkarte · Kartenausschnitt Jardin Bagua Kirchberg│
│ Offizielles Luftbild, Grundstück, Wege und Beete  │
│ Beispielplanung · Pflanzungen im Beetplan         │
└───────────────────────────────────────────────────┘
Weltkarte → Standort Jardin Bagua, Kirchberg, vorausgewählt
Beetplan  → benannte Beete, mehrere Kulturstreifen und Anbaudaten
```

- **Start und Ort.** Ein frischer Besuch der öffentlichen Vorschau öffnet „Garden_Example“ in der Kartenansicht. Das vorhandene amtliche Orthofoto des dokumentierten [Jardin Bagua Kirchberg](https://eisegaart.cell.lu/wp-content/uploads/sites/16/2023/12/TEST-Rapport-Final-JOS.pdf#page=8) zeigt den Standort und die eingezeichneten Wege und Grundflächen. Die Basiskarte lädt ohne Abhängigkeit von Live-Kacheln. Beim ersten Aufruf der Weltkarte aus dem Beispiel zentriert der Dialog auf diesen Standort und benennt ihn. Nutzer können den Dialog abbrechen und beim bestehenden Beispiel bleiben.
- **Lesbarer Plan.** Der Beetplan zeigt benannte Flächen. Mindestens zwei Beete enthalten jeweils mehrere Kulturstreifen mit unterschiedlichen Beispielkulturen. Ein weiteres bepflanzbares Beet zeigt eine zusammenhängende Belegung. Kulturwahl, Anbaudaten, Saisonleiste und Planausgabe sind benutzbar. Wege und bestätigte Streifen folgen dem bestehenden Modell. Die Bezeichnungen erklären, dass es sich um Beispielbepflanzung am realen Standort handelt.
- **Umstieg.** Der alte Vorschau-Link führt zum neuen Beispiel. Die Anwendung legt das ehemalige schematische Projekt nicht mehr an und blendet bereits automatisch erzeugte, unveränderte Kopien in der Bibliothek aus. Persönliche Gärten, bearbeitete Kopien, Sicherungen und Sitzungsentwürfe bleiben zugänglich. Vorhandene Entwürfe werden vorrangig wiederhergestellt. Der reguläre lokale Einstieg ohne Beispielparameter bleibt wie bisher.

| Prüffall | Beobachtbares Soll |
| --- | --- |
| Frisches Profil | Auf der öffentlichen Startadresse und am direkten Beispiel-Link bei 1440 und 390 CSS-Pixeln sind Garden_Example, Standort, Bild und Wege sofort sichtbar. Die Weltkarte zentriert korrekt und Abbrechen erhält den Garten. |
| Beispielbelegung | Der Beetplan zeigt zwei unterschiedlich unterteilte Beete mit mehreren Kulturen und ein weiteres bepflanztes Beet. Mindestens fünf gültige Belegungen mit nachvollziehbaren Anbaudaten sind in Druck und Excel enthalten. |
| Umstieg und Speichern | Alter Link öffnet das neue Beispiel. Ein frischer Browser erhält eine Garden_Example-Kopie. Keine doppelte Kopie beim Neuladen. Eine unveränderte alte automatisch angelegte Demo erscheint nicht mehr in der Bibliothek. Ein vorhandener privater Garten und ein lokaler Entwurf bleiben zugänglich. |
