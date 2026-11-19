# Bildquelle und Handreferenzen · Jardin Op dem Kranz

Der Ausschnitt zeigt den Gemeinschaftsgarten Jardin Op dem Kranz in Tandel, Luxemburg. Der Garten ist im Forschungsbericht des Centre for Ecological Learning Luxembourg mit 49,88845° N, 6,17942° O verzeichnet (Tabelle 2, S. 9). [Bericht Jardins partagés fOnt Science](https://eisegaart.cell.lu/wp-content/uploads/sites/16/2023/12/TEST-Rapport-Final-JOS.pdf#page=9)

## Bild und Rechte

- Bild: amtliche RGB-Orthofotografie der Administration du cadastre et de la topographie (ACT), Ausgabe 2023. Die Aufnahme ist eine Orthofoto-Mosaikquelle mit einem Bodenpixelmaß von höchstens 10 cm und einer laut Produktbeschreibung absoluten planimetrischen RMSE von höchstens 20 cm. Der konkrete Aufnahmetag des Ausschnitts ist offen. [Veröffentlichung und CC0-Lizenz der Ausgabe](https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-2023/)
- Auslieferung: Open-Data-WMS der ACT, Layer ortho_2023, PNG, 624 × 624 Pixel. Der Ausschnitt ist unverändert aus der in fixture.json dokumentierten GetMap-Anfrage übernommen. Beide amtlichen Datenquellen nennen CC0. [WMS-Dokumentation und Lizenz](https://data.public.lu/fr/datasets/bd-l-ortho-webservices-wms-et-wmts/) · [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- Amtliches Ursprungskoordinatensystem EPSG:2169. Der WMS hat direkt nach EPSG:3857 reprojiziert. Die nach Norden ausgerichtete Pixelmatrix deckt [687841.888, 6426931.711, 687937.888, 6427027.711] ab. Das entspricht im Zentrum rund 9,9 cm am Boden pro Bildpixel. fixture.json enthält die umgerechnete WGS84-Ausdehnung in der Reihenfolge West, Süd, Ost, Nord. Bei der Pixelumrechnung zuerst nach Web Mercator projizieren und innerhalb der projizierten Ausdehnung interpolieren.
- SHA-256 der Originalantwort: dc2c201b20bce35246d596db9177a788a6fc1a644ef34e9643af59e9a58ec1f9.

## Vergleichsflächen

Zwei Bildgrenzen wurden vor der Auswertung von Hand am unveränderten Luftbild markiert. Die Werte in fixture.json sind geschlossene Ringe aus Paaren in der Reihenfolge Längengrad, Breitengrad. Die Grenzen sind eine Bildinterpretation zum Aufnahmezeitpunkt. Für den Versuchsvergleich liegt keine unabhängige Bodenvermessung vor.

| Kennung | Manuell markierter Bereich | Unsicherheit |
| --- | --- | --- |
| Beet 1 | Zusammenhängende keilförmige Anbaufläche mit mehreren Reihen südwestlich des zentralen Platzes. | Im Westen und Süden verschwimmt der Übergang zwischen Beet und Bewuchs. Die äußere Beetfläche wurde als Einheit markiert. |
| Weg 1 | Heller südlicher radialer Wegabschnitt östlich des Beets. | Die Breite folgt den sichtbaren Bildkanten. Das nördliche Ende wurde vor dem Übergang auf den breiten zentralen Platz gesetzt. Das südliche Ende liegt am sichtbaren Auslauf. |

suggestedBoundary ist eine händisch gezogene Auswahl um den Garten für den lokalen Versuch. Sie weist keine Eigentumsgrenzen aus.
