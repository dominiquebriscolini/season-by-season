# Bildquelle · Jardin Bagua Kirchberg

Der Forschungsbericht des Centre for Ecological Learning Luxembourg nennt den Gemeinschaftsgarten „Jardin Bagua Kirchberg“ in Luxembourg-Ville bei 49,62967° N, 6,17201° O in Tabelle 2 auf Seite 8. [Forschungsbericht Jardins partagés fOnt Science](https://eisegaart.cell.lu/wp-content/uploads/sites/16/2023/12/TEST-Rapport-Final-JOS.pdf#page=8)

- Amtliches RGB-Orthofoto der Administration du cadastre et de la topographie (ACT), Ausgabe 2023. Die amtliche Angabe zur Bodenauflösung lautet höchstens 10 cm/Pixel. Der absolute planimetrische RMSE beträgt laut Quelle höchstens 20 cm. [Veröffentlichung und CC0-Freigabe](https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-2023/)
- Die lokale PNG ist die unveränderte Antwort des amtlichen WMS-Layers ortho_2023, mit demselben Abrufverfahren wie in Tandel und Hesperange. 624 × 624 Pixel decken 96 × 96 Einheiten in EPSG:3857 ab, entsprechend rund 10,0 cm je Pixel am Boden. Die Pixelmatrix ist nach Norden ausgerichtet. Der GetMap-Aufruf und seine projizierte Ausdehnung stehen in [fixture.json](fixture.json). [Amtliches WMS-Verzeichnis und CC0-Freigabe](https://data.public.lu/fr/datasets/bd-l-ortho-webservices-wms-et-wmts/)
- SHA-256 der WMS-Antwort und der lokalen Datei: 4d5e02b580577b75c9bb1981e53ed32508dbb9e171853163de662a3e0ba02c2b.
- Die gemeinsame Versuchsgrenze um den sichtbar bepflanzten Gartenbereich ist eine Arbeitsgrenze des Versuchs und keine Katastergrenze.

## Versiegelung der Handreferenzen

Ein Agent zeichnete vor dem Übergeben von Orthofoto und Metadaten zwei Beete und zwei Wege anhand des unveränderten Bildes. Die Datei blieb außerhalb des Projektordners. Die [Versiegelung](reference-seal.json) hält Dateiprüfsumme und Zeitpunkt fest. Die Vergleichsobjekte waren für die Operatoren nur qualitativ beschrieben. Eckpunkte und abgeleitete Maße blieben bis zur Fixierung sämtlicher Vorhersagen verborgen.

Die drei Ergebnisdateien und ihre Eingaben wurden vor der Freigabe im [Vorhersagemanifest](seal.json) mit SHA-256 fixiert. Der Referenzagent verifizierte alle Dateiprüfsummen und kopierte die ursprüngliche Datei nach [references.json](references.json). Der Zeitpunkt und die beiden verifizierten Prüfsummen stehen im [Freigabevermerk](reference-release.json).

| Handreferenz | Fläche |
| --- | ---: |
| Beet 1 | 5,99 m² |
| Beet 2 | 9,56 m² |
| Weg 1 | 3,75 m² |
| Weg 2 | 6,10 m² |

Die vier Ringe liegen vollständig innerhalb der gemeinsamen Versuchsgrenze. Die handgezogenen Ränder von Beet 2 und Weg 1 überlappen um 0,005 m², weniger als ein Bildpixel. Die Referenzen geben eine Bildinterpretation bei unscharfen Pflanzen- und Übergangsrändern wieder. Die Wegenden begrenzen die beschriebenen Prüfabschnitte. Es liegt keine Bodenvermessung vor.
