# Unabhängiges Review der Bedienoberfläche

Früherer Prüfbericht. Das Urteil bezieht sich auf den damaligen Versuchsauftrag. Den Abgleich mit der verbindlichen Geometrie- und Bestandsentscheidung führt der [Entwicklungsplan](../../PLAN.md#ist-abgleich-mit-2).

Geprüft am 19. November 2026 im lokalen Chromium mit einer eigenen Playwright-CLI-Sitzung. Der Reviewer war an der Umsetzung unbeteiligt.

| Prüffall | Beobachtung |
| --- | --- |
| Zoom und Navigation bei 1320 × 850 | Plus verkleinerte die sichtbare Breite des SVG-Koordinatenfensters von rund 568 auf 426 Bildkoordinaten. Das Mausrad verkleinerte sie weiter auf rund 297. Drag im Verschiebemodus veränderte die Ansicht. Minus und „Grundstück einpassen“ führten zurück zur ursprünglichen Ansicht. Die serialisierten Grundstücks-, Achsen-, Objekt-, Weg- und Restflächengeometrien waren vor und nach der Navigation identisch. |
| Zeichnen mit unterbrochener Navigation | Ein Viereck und zwei Achsen mit je drei Punkten eingezeichnet. Während der ersten Achse die Karte mit der mittleren Maustaste verschoben, das Grundstück eingepasst und weitergezeichnet. Beide Achsen enthielten danach genau drei Punkte. Die geteilte Kreuzungskoordinate rastete ein. Ergebnis waren eine zusammenhängende Wegfläche und vier Restflächen. |
| Standard-, Weg- und Abschnittsbreite | Standard auf 110 cm gesetzt und zur Nachbearbeitung gewechselt. Abschnittsregler erschien erst nach Auswahl eines Wegs auf der Karte. Dann am ersten Weg 140 cm und für dessen ersten Abschnitt 60 cm gesetzt. Nach globaler Änderung auf 130 cm ergaben sich für die zwei Achsen 60/140 cm und 130/130 cm. Eine eigene Querschnittsrechnung durch die Mitte der vier exportierten Abschnittspolygone bestätigte diese Breiten im lokalen metrischen Modell. |
| Nachbearbeitung und Belegung | Eine Region mit „Tomate“ belegt. Den gemeinsamen Kreuzungspunkt anschließend zu einem neuen Punkt versetzt. Beide Achsen blieben am gemeinsamen Punkt verbunden, mit einer Wegfläche und vier Restflächen. Die Belegung blieb bei `Fläche-6`. |
| Bagua-Vorlage | Die Vorlage des sichtbaren Bagua-Netzes lud alle sieben Achsen. Der metrische Arbeitsablauf lieferte eine verbundene Wegfläche und vier Restflächen. |
| Schmales Layout bei 390 × 844 | Karte 372 × 401 CSS-Pixel in der geprüften Bearbeitungsansicht. Das Dokument hatte keinen horizontalen Überlauf. Die Seitenleiste hatte einen eigenen Scrollbereich. Die sichtbare Kartennavigation und „Grundstück einpassen“ waren im schmalen Layout bedienbar. Der Browser meldete im Prüfdurchlauf keinen JavaScript-Fehler. |

**Isolation.** Die regulären Einstiegspunkte unter `src/` und `index.html` referenzieren den Versuch nicht. Der unabhängige Vite-Build in ein temporäres Verzeichnis erzeugte dieselben JS- und CSS-Assets mit identischem SHA-256 wie die bestehende Distribution. Der metrische Versuch nutzt weiterhin das vorhandene Polygon-Clipping für Schnitte, Vereinigungen und Restflächen sowie die bestehende Regionszuordnung. Die historisch gemessene automatische Pixelbreite bleibt im ursprünglichen Messpfad verfügbar.

**Grenzen der Prüfung.** Die Querschnitte prüfen die Umsetzung der Eingaben in Projektkoordinaten. Sie ersetzen keine Vermessung vor Ort. Die Navigation wurde mit Mausklicks, Mausrad und Drag geprüft, die schmale Seite mit simulierter Bildschirmgröße. Touch-Geräte und weitere Browser waren kein Teil dieses Reviews.
