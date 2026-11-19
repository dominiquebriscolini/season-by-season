# Unabhängiges Review · Weggestützte Gartenanalyse

Früherer Prüfbericht. Das Urteil bezieht sich auf den damaligen Versuchsauftrag. Den Abgleich mit der verbindlichen Geometrie- und Bestandsentscheidung führt der [Entwicklungsplan](../../PLAN.md#ist-abgleich-mit-2).

Geprüft am 19. November 2026 im lokalen Chromium. Der Reviewer war an Wahl und Implementierung des Verfahrens unbeteiligt. Verglichen wurden die tatsächliche Browserbedienung, die erzeugten Geometrien und ihre Bewertung, die Produktseite sowie Bild-, Bibliotheks- und Modellherkunft.

## Geometrie und Erkennung

Die folgende Kontrollrechnung verwendet die ausgegebenen Polygone, ein eigenes Web-Mercator-Mapping und eine unabhängige Punkt-in-Polygon-Rasterung mit 4 × 4 Teilpixeln je Bildpixel. Die Referenzdateien waren bei diesem Folgeversuch bereits zugänglich.

| Prüfabschnitt | Querprofile · IoU | Dieselbe Achse mit 8 px · IoU |
| --- | ---: | ---: |
| Tandel | 72,61 % | 78,42 % |
| Hesperange | 36,44 % | 38,98 % |
| Bagua · Weg 1 | 28,41 % | 39,29 % |
| Bagua · Weg 2 | 17,43 % | 12,95 % |

Der Mittelwert liegt bei rund 38,7 % mit Querprofilen und 42,4 % mit fester Breite. Die Rasterwerte bestätigen die Rangfolge der Vektormessung. Der Browser zeigte im gleichen Vergleich 8, 5 und 12/4 Pixel als typische Breiten. Die Abweichungen in Hesperange und Bagua betreffen auch Achsenlage und Wegenden. Bei Bagua Weg 2 fielen 17 von 22 Profilstationen aus dem Breitenvergleich, weil ihre Mitte außerhalb des abgeglichenen Referenzwegs liegt. Die Breitenfehler gelten für die erfassten Stationen. Der Wert einer Bestätigung durch den Nutzer wurde nicht gemessen. [Vektormessung](measurements.json)

Restfläche gegen Grundstück abzüglich der **referenzierten Wege** ergab im Raster 99,74 %, 98,58 % und 94,46 % IoU. An den Rasterpunkten ergab sich weder eine Lücke zwischen Weg und Restfläche noch eine doppelte Flächenbelegung. Diese hohe Rest-IoU misst vor allem die große gemeinsame Grundstücksfläche. Alle drei Prüfgärten erzeugten in diesem Vergleich je eine einzige ungeklärte Restfläche. Ihre Überlappung mit einzelnen Beetkonturen liegt laut Vektormessung bei rund 2–7 %. Die Referenzringe beschreiben sichtbare Grenzen im Luftbild und sind keine Bodenvermessung. Vollständige Objektklassen und Wege liegen für keinen der drei Gärten als Referenz vor.

Die Bagua-Vorgabe „Hauptwegenetz“ lieferte im Browser aus sieben Achsen eine zusammenhängende Wegfläche und vier Restflächen. Die Vektormessung weist dabei eine Restfläche von nur rund 0,015 m² und niedrige beste Beet-IoU von rund 3,8 % und 5,8 % aus. Auf Basis dieser Stichprobe ist die zusammenhängende Geometrie belegt. Für die Vollständigkeit des Netzes fehlt eine Referenz. Den synthetischen Sollwechsel der Breite von 7 auf 17 Pixel bildet die Auswertung mit 5 auf 15 Pixel ab. Das belegt den Erhalt des Wechsels bei systematischer Unterschätzung in diesem Fall.

## Bedienung und Korrektur

- Unabhängige Chromium-Eingabe auf dem Bagua-Orthofoto mit einem Rechteck und einer kontrollierten Kreuzung. Vier Grenzpunkte und zwei Achsen mit je drei Punkten erforderten zusammen 16 Aktionen, davon 10 Bildklicks, drei Moduswahlen und drei Abschlüsse. Der Reset ist separat. Ergebnis waren eine verbundene Wegfläche und vier Restflächen.
- Eine Teilfläche wurde als Beet markiert und erhielt Kopfsalat. Die erste Abschnittsbreite wurde auf 10 Pixel gesetzt. Nach Versetzen des gemeinsamen Knotens von (340, 310) nach (345, 317) änderten sich beide Achsen. Die ID `Fläche-6` und Kopfsalat blieben erhalten. Der Korrekturschritt bestand aus der Wahl des Versetzmodus und zwei Bildklicks. Je ein weiterer Moduswechsel und Bildklick fügte einen Stützpunkt auf einer Achse ein bzw. entfernte ihn. Ein separater dreieckiger Objektumriss war anschließend als `Objekt-10` auswählbar.
- Nach Entfernen einer Achse wurden aus den vier Teilflächen zwei. `Fläche-6`, der Typ Beet und Kopfsalat erschienen als „Zuordnung prüfen“. Damit geht die Kultur im laufenden Versuch bei einer mehrdeutigen Verschmelzung nicht stillschweigend auf eine neue Fläche über. Für die spätere Zuordnung gibt es bislang keine Wiederübernahmefunktion.
- Die Vorlagenabfrage im Browser ergab etwa 10–36 ms für die einfachen Gärten und 28 ms für das Bagua-Hauptwegenetz in diesem Lauf. Bildladen und menschliche Orientierung fehlen in dieser Zeit. Die dokumentierten Laufzeiten sind lokale Stichproben. RSS- und Heap-Werte vor und nach einer Messreihe eignen sich nicht zur Bestimmung eines Peak-Speicherbedarfs.

Eine Knotenverschiebung bewegt Achspunkte mit identischen Koordinaten gemeinsam. Geometrisch kreuzende Linien ohne gemeinsamen Stützpunkt bilden zwar eine vereinigte Wegfläche, haben jedoch keinen gemeinsam verschiebbaren Knoten. Manuelle Polygone können bearbeitet werden und erhalten gegebenenfalls einen Überschneidungshinweis. Automatisch abgeleitete Restflächen werden durch die Achsen und die Grundstücksgrenze bearbeitet. Sie besitzen keine separaten frei editierbaren Beetgrenzen. Die Grünfraktion ist ein Bildhinweis. Sie liefert keine Nutzungsentscheidung und erkennt weder Gebäude noch Gehölze als eigene Objekte. Die Frage nach dem Typ geht daher an den Nutzer. Die Frage nach der Breite wird durch schwache Kanten ausgelöst. Eine starke Kante an Pflanzen oder Schatten kann trotzdem zu einer falschen Breite ohne Warnung führen.

## Herkunft und bestehende Anwendung

- **Bildmaterial.** ACT-Orthofoto 2023, offiziell CC0. Die lokalen SHA-256-Werte aller drei PNGs stimmen mit den dokumentierten WMS-Prüfsummen überein. Der WMS wurde im Review nicht erneut abgerufen. Die Quelle nennt höchstens 10 cm Bodenpixelgröße und höchstens 20 cm absoluten planimetrischen RMSE. [ACT-Datensatz](https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-2023/) · [Tandel](../../public/garden/QUELLE.md) · [Hesperange](../../evidence/transfer/QUELLE.md) · [Bagua](../../evidence/segmentation/QUELLE.md)
- **Software und Gewichte.** Aus den vorhandenen Paketversionen stammen die Gebietsschnitte aus polygon-clipping 0.15.7 (MIT), die Koordinatentransformation aus OpenLayers 10.11.0 (BSD-2-Clause) und das Dekodieren im Node-Vergleich aus pngjs 7.0.0 (MIT laut installiertem Lizenztext). Die Rechenpfade laden keine Modellgewichte. Ihre Prüfbarkeit hängt daher allein an lokalem Programmcode, Eingaben und Bilddaten. [polygon-clipping-Lizenz](https://raw.githubusercontent.com/mfogel/polygon-clipping/v0.15.7/LICENSE.md) · [OpenLayers-Lizenz](https://raw.githubusercontent.com/openlayers/openlayers/v10.11.0/LICENSE.md)
- **Regression.** Im separaten Browserprofil lief der bestehende Tandel-Prüfablauf am selben Vite-Server. Er bestätigte 61,3 % Beet-IoU, 68,2 % Weg-IoU, ISO-Auswahl, gespeicherte Möhre nach Neuladen, Wiederherstellung der lokalen Sicherung und Erhalt der Belegung nach erneuter Analyse. Das Experiment schrieb während der geprüften Bedienfolge keine `localStorage`-Schlüssel. [Bestehender Prüfablauf](../../scripts/review-flow.js)

**Empfehlung.** Die Weggeometrie eignet sich als separat weiter zu untersuchendes Bearbeitungswerkzeug. Eine Integration als Erkennungsverfahren ist mit diesen Ergebnissen verfrüht. Eine bessere nächste Messung verwendet einen zuvor ungenutzten Garten mit unabhängig markiertem vollständigem Wegenetz, geprüften Breiten und referenzierten Objektklassen. Gleiche Achsen einmal mit einfacher Breitenvorgabe und einmal mit profilbasiertem Vorschlag prüfen. Nutzerkorrekturen und ihre Dauer separat erfassen. Einen Test zur Klassifikation nur mit hierfür geeigneten Referenzen bewerten.
