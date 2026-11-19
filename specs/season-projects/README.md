# Saisonplanung und Rückblick am Beet

Grundlage sind [Übergabe §§3–5, 9–10](../../Season-by-Season-Uebergabe-aktualisiert.md), der integrierte Beetplan und seine vorhandenen Anbaudaten.

```text
Beetplan
  Saisonprojekte   [ Hauptjahr einrichten | Saisonprojekt öffnen | Neues Saisonprojekt ]
  Datum            [ 2027-05-15 ] [ Zurück | Regler | Weiter | Abspielen ]
  Aktuelle Ansicht [ Mai 2027 · Vorjahresprojekt · schreibgeschützt ]
  ISO-Beet         Fläche-10 · 5 historische Streifen · damalige Belegung
    Ernte          Datum, Menge, Einheit und Notiz der Pflückgänge

Neues Projekt 2028
  Name · Hauptjahr · Vorjahresprojekt 2027 (optional)
  [ ] Aufteilung des Vorjahrs kopieren
  Ergebnis         gleiches Grundstück, eigene ID, leere Belegung, eigener Plan
```

- Im Beetplan oben links sind Projekte desselben Grundstücks erreichbar. Ein bestehender Garten erhält erst bei ausdrücklicher Wahl ein Hauptjahr. Ein neues Projekt übernimmt die gespeicherte Grundstücks- und Bestandsgeometrie. Es erhält eigene ID, Aufteilung, Belegung, Termine und Ernten. Mehrere Varianten je Jahr sind möglich. Ein bereits eingetragenes Hauptjahr bleibt für diesen Projektstand fest.
- Das ausdrücklich gewählte Vorjahresprojekt gehört zum selben Grundstück und unmittelbar zum vorherigen Jahr. Pro verbundener Kette sind höchstens drei aufeinanderfolgende Hauptjahre erlaubt. Der Vorjahresstand ist eine schreibgeschützte Kopie der beim Verknüpfen gespeicherten Geometrie, Planung und Ernten. Die optionale Aufteilungskopie übernimmt nur eindeutig gleiche Flächen. Ungleiche Flächen werden ausgelassen und gemeldet. Kopie und Wechsel schreiben nicht in den Quellgarten.
- Datumsfeld, Regler und Wiedergabe teilen denselben Tag. Der Zeitraum reicht vom 1. Juli vor dem ältesten Hauptjahr bis zum 30. Juni nach dem aktuellen Hauptjahr. Im Kalenderjahr eines verknüpften Vorgängers zeigt die Ansicht standardmäßig dessen historischen Plan. In den Randmonaten ist sichtbar, welcher Plan angezeigt wird. Die Planansicht kann ausdrücklich gewechselt werden, damit überlappende Randmonate keine automatische Zuordnung von Anbau- oder Erntebuchungen auslösen. Die aktive Ansicht bestimmt Geometrie, Belegung und Zugriff. Das Datum zeigt geplanten Beginn und Erntefenster sowie bereits verbuchte Ernten bis zu diesem Tag. Vor einem bekannten Anbaubeginn erscheinen keine Pflanzensymbole. Unbekannte Werte bleiben offen.
- Eine Ernte am ausgewählten, belegten Beet oder Streifen wird dem geöffneten aktuellen Saisonprojekt zugeordnet. Ein Pflückgang umfasst Datum, positive Menge, Einheit und optionale Notiz. Mengen werden je Einheit getrennt summiert. Einträge halten die Bezeichnung zum Buchungszeitpunkt fest; bei veränderter Belegung oder Geometrie bleiben ursprüngliche Buchungen lesbar. Die Vorjahresansicht kann weder Buchungen ändern noch den Garten speichern. Der automatische historische Sollwert und jahrübergreifende Anbauzuordnung bleiben gemäß §10 offen.
- Gartenwechsel und Projektwechsel behandeln bestehende ISO-Entwürfe wie bisher. Ein Datumswechsel lässt den aktuellen Entwurf stehen. Während der Saisonansicht teilen aktueller und historischer Plan Zoom, Bildausschnitt und Blickrichtung. Kamerabewegungen in beiden Ansichten wirken beim nächsten Datumswechsel weiter. Bestehende Gartenstände ohne Saisondaten bleiben lesbar. Die vorhandene JSON-Sicherung enthält das neue Projekt mit verknüpfter Historie und seinen Ernten. Karte, Flächenpartition und Export verwenden die bestehenden Bausteine.

**Browserabnahme.** Bagua 2027 mit fünf Streifen und zwei datierten Ernten speichern. Ein verknüpftes Projekt 2028 mit Aufteilungskopie anlegen, dort sieben Streifen einstellen und den Mai 2027 anwählen. Fünf historische Streifen, ursprüngliche Kultur, je nach Datum sichtbare Pflückgänge und fehlende Bearbeitungsaktionen prüfen. Zurück in 2028 die sieben eigenen Streifen und leere Belegung prüfen. Unverbundene Projektvariante und Revisionsschutz prüfen. Datum, Wiedergabe, Projektgrenzen, Sicherung/Reimport in frischem Browserprofil und bestehenden Beet-/Exportweg prüfen.

## Mondphase

```text
Saisondatum [ 20.05.2027 ] [ ‹ ] [ Regler ] [ › ] [ Abspielen ]
Planansicht                              Mondphase · Vollmond
```

Das Datum steuert eine sichtbare deutsche Bezeichnung und ein Symbol für acht Mondphasen. Die vier Hauptphasen erscheinen am örtlichen Kalendertag des jeweiligen Ereignisses. Maßgeblich ist die Zeitzone des Kartenausschnitts des angezeigten Gartenstands. Die übrigen Tage zeigen die zunehmende oder abnehmende Zwischenphase. Die Berechnung läuft lokal auch während des Ziehens und der Wiedergabe. Ein Planwechsel bei gleichem Datum und Standort lässt die Phase stehen. Die Anzeige hält ihre Position ohne Verschieben des Reglers oder der Gartenansicht.

**Browserabnahme.** Bagua am Regler bis 20.05.2027 ziehen. Die Anzeige wechselt bereits beim Ziehen. Wiedergabe vom 19.05.2027 prüft zunehmenden Mond, Vollmond und abnehmenden Mond an aufeinanderfolgenden Tagen. Der 05.01.2028 zeigt das erste Viertel. Neumond am 06.04.2027 um 23:51 UT erscheint in Bagua am 07.04. Der Februar-Vollmond am 20.02. um 23:23 UT erscheint in Bagua am 21.02. Andere Gerätezeitzone, Planwechsel am selben Tag, mobile Anzeige und Kameraposition prüfen. [USNO-Referenz 2027](https://aa.usno.navy.mil/api/moon/phases/year?year=2027) · [USNO-Referenz 2028](https://aa.usno.navy.mil/api/moon/phases/year?year=2028)
