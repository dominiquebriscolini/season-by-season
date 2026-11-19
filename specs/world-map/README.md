# Weltkarte und Ortssuche

Grundlage ist die [Projektvision §2](../../Season-by-Season-Uebergabe-aktualisiert.md#2-von-der-weltkarte-zum-garten--verbindliche-geometrie--und-bestandslogik). Die bestehende Wege-, Flächen- und Bestandslogik bleibt für alle Kartenausschnitte maßgeblich.

```text
Karte → Weltkarte
  [ Ort oder Adresse suchen ] [ Suchen ]
  Trefferliste → Karte zentriert sich am gewählten Ort
  Weltkarte verschieben und zoomen → [ Ausschnitt übernehmen ]
Karteneditor → Grenze zeichnen → Enter → Wege und Bestand → Beetplan
  Saisonregler → Mondphase am Kalendertag der Zeitzone des Grundstücks
```

- Die Weltkarte öffnet separat. Suche und Navigation verändern den offenen Garten erst bei ausdrücklicher Übernahme. Die vorhandene Warnung vor ungespeicherten Änderungen gilt beim Start eines neuen Ausschnitts. Die lokalen Luxemburger Ausschnitte bleiben im Kartenausschnitt-Menü auswählbar.
- Ein übernommener Ausschnitt verwendet eine feste, metrisch interpretierbare Georeferenz. Der bestehende Karteneditor zeichnet darauf wie bisher. Straßenkarte und Luftbild zeigen ihre jeweilige Quelle an. Der gespeicherte Garten enthält die Georeferenz für Wiederöffnung, Sicherung und Saisonhistorie.
- Die Ortszeit für die Mondphase wird aus einem Punkt innerhalb der gezeichneten Grundstücksgrenze lokal ermittelt. Die bekannten Luxemburger Ausschnitte behalten ihre geprüfte Zeitzone. Ortssuchtext und Gerätezeitzone bestimmen die Mondphase nicht. Der Kalender bleibt bei einem Ausfall der Kartendienste nutzbar.
- Ortssuche wird nur auf ausdrückliche Suche ausgelöst. Bei einem Fehler bleibt die Karte navigierbar. Ein Ausfall der Kartenkacheln verhindert das Laden eines gespeicherten Grundstücks und seiner Planungsdaten nicht.

**Abnahme.** Tokio suchen, Treffer auf der Weltkarte auswählen, Ausschnitt übernehmen, Grundstück mit Enter schließen und speichern. Beetplan und Geometrie nach Wiederöffnung vergleichen, Datei exportieren und in einem frischen Browserprofil importieren. Mit abweichender Gerätezeitzone prüfen, dass der Neumond vom 7. Januar 2027 um 20:24 UTC in Tokio am 8. Januar erscheint. Abbruch der Ortsauswahl, einen Ausfall der Ortssuche sowie Bagua als Regression prüfen.

## Straßenkarte und Luftbild

```text
Weltkarte                         [ Straßenkarte | Luftbild ]
  Ortssuche · Navigation · Rahmen → Ausschnitt übernehmen
Karteneditor                       [ Straßenkarte | Luftbild ]
  Grenze zeichnen · Punkte setzen → Ansicht umschalten → Enter
```

- Beide Ansichten nutzen dieselbe Projektion. Der Wechsel lässt Kartenposition, Maßstab, Ausschnittrahmen, gesetzte und noch eingezeichnete Punkte sowie die Werkzeugeinstellung stehen. Die Wahl aus dem Dialog geht beim Übernehmen mit in den Editor. Der Wechsel selbst erzeugt keine Gartenrevision.
- Die Straßenkarte ist beim Öffnen eines gespeicherten Weltgartens die Startansicht. Ein Weltgarten lässt sich jederzeit auf Luftbild umschalten. Lokale Luxemburger Orthofotos behalten ihren eigenen Kartenmodus.
- Die Bildquelle wird an der Karte genannt. Detailreiche Orthofotos stehen regional zur Verfügung. Außerhalb der Detailabdeckung bleibt das gröbere Satellitenbild derselben Ansicht sichtbar. Bei Ausfall der Bildquelle bleiben Straßenkarte, Zeichnung und Speicherstand erreichbar.

**Browserabnahme.** In Berlin den gleichen Ausschnittrahmen auf Straßenkarte und Luftbild prüfen und mit Luftbild übernehmen. Nach den ersten Punkten des Grundstücks umschalten, mit Enter schließen und die Punkte und Georeferenz vergleichen. Für Tokio Satellitenabdeckung prüfen. Erneutes Öffnen, Bagua und simulierten Ausfall der Luftbildkacheln prüfen.

## Aktuelle Luftbilder für Luxemburg

```text
Luftbild · gleicher Ausschnitt in Weltkarte und Karteneditor
  Luxemburg mit Bilddaten  → ACT-Aufnahme Mai 2025 über der Weltabdeckung
  außerhalb / ACT-Ausfall  → vorhandenes VersaTiles-Bild
  Nahansicht des Gartens   → lädt entsprechend dem Bildschirmmaßstab
  Bildrand                 → Quellenlinks zeigen die regionale Zuordnung
```

- Das pixelige Luftbild aus der Nutzerrückmeldung ist die visuelle Referenz. Für Luxemburg muss ein vergleichbarer Gartenausschnitt sichtbare Kanten von Wegen, Beeten und Gebäuden zeigen. Die Luftaufnahme stammt aus Mai 2025 und hat laut ACT eine Bodenauflösung von bis zu 10 cm pro Pixel. Die Auflösung der Anzeige hängt von der Zoomstufe ab.
- ACT deckt Luxemburg ab. Außerhalb der ACT-Abdeckung und bei ausgefallenen ACT-Kacheln bleibt VersaTiles sichtbar. Bei einer gemischten Ansicht kennzeichnen die Links ACT als Luxemburger Quelle und VersaTiles als weiteren Anbieter. Das Datum bezieht sich allein auf ACT. Falls keine Quelle verfügbar ist, bleibt der Wechsel zur Straßenkarte möglich.
- Kartenrahmen, Georeferenz, Zoom und laufender Grenzentwurf bleiben beim Kartenwechsel gleich. Beim Vergrößern im Editor wird die Bildauflösung bis zur verfügbaren Stufe nachgeführt. Der vorhandene Zoom und die bestehenden lokalen Beispielausschnitte behalten ihr Verhalten.
- **Browserabnahme.** Dieselbe Luxemburger Georeferenz mit VersaTiles allein und dann mit ACT im Browser vergleichen. Das Aufnahmedatum, erkennbare Gartenkanten und tatsächliche Bildantworten im Dialog und nach der Übernahme prüfen. Beim Zoomen die angeforderte Bildauflösung beobachten. Im Regelbetrieb und bei simuliertem ACT-Ausfall Straßenkarte und Luftbild mitten im Zeichnen wechseln. Einen Ausschnitt an der Landesgrenze sowie Tokio außerhalb der Abdeckung prüfen. Der gespeicherte Gartenstand muss beim Kartenwechsel gleich bleiben.
