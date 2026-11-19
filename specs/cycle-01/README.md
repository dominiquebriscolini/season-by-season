# Zyklus 01 · Verlässlicher Arbeitsstand

Maßgeblich sind [Übergabe §2](../../Season-by-Season-Uebergabe-aktualisiert.md#2-von-der-weltkarte-zum-garten--verbindliche-geometrie--und-bestandslogik) und die [Spezifikation zu Schritt 4](../step-4/README.md). Referenzen sind der [bisherige Kartenarbeitsplatz](../../evidence/cycle-01/before-tandel-map.png) und der [Bagua-Beetplan](../../evidence/cycle-01/before-bagua-iso.png).

```text
Größerer Bildschirm                  Schmaler Bildschirm
Kopf · Kartenausschnitt              Kopf · Ausschnitt · Vorlagen
Ansichten · Garten · Speichern       Ansichten · Garten · Speichern
Arbeitsstand                         Arbeitsstand
┌ Karte ─────────┬ Einstellungen ┐  Zeichenwerkzeuge · Abschluss
│ Zeichenwerkzeug│ Wegbreite       │  Karte mit Navigation
│ Luftbild       │ Bestand         │  Anleitung zur laufenden Aktion
└────────────────┴────────────────┘  Wegbreite, Bestand (Seite scrollt)
```

1. **Speicherstand im Arbeitsablauf.** Der Status folgt dem aktuellen Inhalt. Geänderte Geometrie, Klassifikation, Wegbreite und Name sowie eine laufende Kartenaktion sind als ungespeichert erkennbar. Ein erfolgreich gespeicherter Stand und ein Fehler sind unterscheidbar. Karte → Beetplan speichert weiterhin, wenn neue Eingaben vorliegen. Ein bloßer Ansichtswechsel oder eine identische Speicherung verändert weder Projektrevision noch letzten inhaltlich unterschiedlichen Wiederherstellungspunkt. Die Wiederöffnung folgt der Ansicht des zuletzt tatsächlich gespeicherten Stands. Beim Speichern aus ISO bleibt die vorhandene Revisionsprüfung wirksam.
2. **Laufende Kartenaktionen schützen.** Erneuter Klick auf dasselbe Zeichenwerkzeug oder dieselbe Phase erhält den Entwurf. Ein Werkzeug- oder Phasenwechsel, der Stützpunkte oder eine begonnene Korrektur verwirft, meldet das vorab und lässt den Nutzer abbrechen. Beim Abbruch bleiben Modus und Punkte erhalten. Nach Bestätigung wird das gewählte Werkzeug aktiv. Escape bleibt der bewusste Abbruch. Speichern und ISO-Wechsel weisen auf die aktive Aktion hin und lassen sie editierbar. Zoom und Verschieben bleiben während der Zeichnung möglich.
3. **Platz für Karte und Bedienelemente.** Bei 390 × 600 und 390 × 844 px ist das Luftbild mindestens 280 px hoch, mit sichtbarem Zeichenabschluss und ohne horizontalen Seitenüberlauf. Einstellungen sind über den Seitenfluss erreichbar. In ISO stehen Skizze und Formular auf kleinen Bildschirmen untereinander. Bei 1440 × 900 bleiben Karte und Einstellungen nebeneinander. Die vorhandene Bildsprache und die Bedienelemente des Wegeditors bilden die Referenz.

## Abnahme

| Ausgangspunkt | Sichtbares und technisches Soll |
| --- | --- |
| Bagua, sieben Streifen mit Möhre auf Streifen 1. Auf Bohne ändern, zwischen Karte und Beetplan wechseln und unverändert speichern. | Revision und Checkpoint bleiben beim bloßen Betrachten stabil. Der Checkpoint stellt Möhre wieder her. Ändern des Gartennamens und der Wegbreite zeigt einen offenen Speicherstand. Daten anderer Gärten, v1 und Konfliktschutz bleiben erhalten. |
| Neu gezeichnetes Grundstück in Tandel, zwei Punkte einer Wegachse gesetzt. | Aktives Werkzeug erneut wählen, Phase erneut wählen, Wechsel abbrechen und mit Enter abschließen. Die zwei ursprünglichen Punkte ergeben denselben Weg. Bewusst bestätigter Wechsel leert die Punkte. Wiederholung mit begonnener Korrektur. |
| Frischer Einstieg bei 390 × 600 und 390 × 844 px, Bagua und eigener Garten. | Karte mindestens 280 px hoch. Zeichnen, Abschluss, Flächenauswahl, Bestandsformular und Beetplan sind erreichbar. Vergleich mit Desktop und bisheriger Oberfläche anhand von Screenshots und Browsermaßen. |

Der Auftrag führt die vorhandenen Karte-, Planungs- und Speicherfunktionen weiter. Flächenalgorithmus, Datenformat, Kulturregeln, Kartenausschnitte und bestehende Gartendaten sind die unveränderten Referenzen.
