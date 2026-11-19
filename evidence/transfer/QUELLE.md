# Bildquelle · Jardin d’Hesperange

Der Ausschnitt zeigt den Garten an der Alzette in Hesperange, Luxemburg. Der Forschungsbericht des Centre for Ecological Learning Luxembourg nennt den „Jardin d’Hesperange“ bei 49,57541° N, 6,15406° O in Tabelle 2 auf Seite 9. [Forschungsbericht Jardins partagés fOnt Science](https://eisegaart.cell.lu/wp-content/uploads/sites/16/2023/12/TEST-Rapport-Final-JOS.pdf#page=9)

- Amtliches RGB-Orthofoto der Administration du cadastre et de la topographie (ACT), Ausgabe 2023. Die Quelle gibt eine Bodenauflösung von höchstens 10 cm/Pixel und einen absoluten planimetrischen RMSE von höchstens 20 cm an. Der konkrete Flugtag des Ausschnitts ist offen. [Veröffentlichung und CC0-Freigabe](https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-2023/)
- Die Bilddatei enthält die unveränderte PNG-Antwort des amtlichen WMS-Layers ortho_2023, mit demselben Abrufverfahren wie in Tandel. Die 624 × 624 Pixel decken 96 × 96 Einheiten in EPSG:3857 ab. Das entspricht rund 10,0 cm pro Pixel am Boden. Die Pixelmatrix ist nach Norden ausgerichtet. Der GetMap-Aufruf und seine projizierte Ausdehnung stehen in [fixture.json](fixture.json). [Amtliches WMS-Verzeichnis und CC0-Freigabe](https://data.public.lu/fr/datasets/bd-l-ortho-webservices-wms-et-wmts/)
- SHA-256 der WMS-Antwort und der lokalen Datei: b18b2381776a1cb8745c8dc8e95599783bcdfafb4e2901e0b0b36d419d7b4d22.
- Ausgewählt wurde ein Versuchsbereich mit mehreren klar sichtbaren Anbauflächen und einem schmalen Weg. Die Versuchskontur um diesen Bereich dient der gleichen flächenbegrenzten Analyse wie in Tandel. Sie ist ein Bildzuschnitt am Garten und keine Katastergrenze.

## Verdeckte Referenz

Ein eigener Agent markierte drei Referenzkonturen visuell auf einem Raster der unveränderten PNG. Er speicherte die Ringe getrennt von der Testeingabe, bevor der für die Vorhersagen zuständige Agent Bild und Metadaten erhielt. Die ursprüngliche Datei wurde nach Prüfung der [eingefrorenen Vorhersagen](frozen-predictions.json) als [references.json](references.json) freigegeben. Ihr SHA-256-Wert blieb 3f724e16e76b43f79ddb6f1fa254604ca7ff75495a70d933050e6c7b1566a200.

Die Beete sind zusammenhängende sichtbare Anbauflächen und können mehrere Reihen enthalten. Die Wegenden grenzen den sichtbaren Prüfungsabschnitt ab. Übergänge zu bewachsenen Ecken, Vegetation neben dem Weg und die Enden des Abschnitts bleiben Bildinterpretation. Eine Bodenvermessung liegt nicht vor. Die Ringe wurden aus Bildpixeln mit der WMS-Ausdehnung nach EPSG:3857 und anschließend nach WGS84 (Längengrad, Breitengrad) überführt.

| Kennung | Markierter Bereich | Grenzen der Bildinterpretation |
| --- | --- | --- |
| Beet 1 | Südliches, unbedecktes Beet direkt am Weg, 21,33 m² | Der Übergang zum bewachsenen Streifen am Südrand ist unscharf. |
| Weg 1 | Schmaler, heller Querweg nördlich von Beet 1, 6,35 m² | Der Prüfabschnitt beginnt am Anschluss links von Beet 1 und endet am beginnenden Bewuchs beziehungsweise Schatten rechts. Die nur wenige Pixel breite Spur ist auf beiden Seiten unscharf. |
| Beet 2 | Längeres, hellbraunes Beet im nordwestlichen Prüfbereich, 41,92 m² | Unregelmäßige Übergänge zu Gras und Bewuchs am Rand. |
