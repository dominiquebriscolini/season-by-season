# Unabhängige technische Abnahme · Flächenbestand

Früherer Prüfbericht. Das Urteil bezieht sich auf den damaligen Versuchsauftrag. Den Abgleich mit der verbindlichen Geometrie- und Bestandsentscheidung führt der [Entwicklungsplan](../../PLAN.md#ist-abgleich-mit-2).

Geprüft im lokalen Chromium mit einer eigenen Playwright-CLI-Sitzung am 19. November 2026. Der Reviewer war an Auswahl und Implementierung unbeteiligt. Getestet wurde der Jardin Bagua mit dem vorbereiteten Hauptwegenetz und 80 cm Standardbreite. Die Flächenprüfung verwendet die exportierten Polygonringe in Bildkoordinaten.

| Prüffall | Beobachtung |
| --- | --- |
| Ausgangsgeometrie | Eine zusammenhängende Wegfläche und vier ungeklärte Grundflächen. Die Summe aus Grund- und Wegflächen entspricht dem Grundstück bis auf 3,64 × 10⁻¹¹ Pixel². |
| Teilen, bearbeiten und zuordnen | Die gezeichnete Innenkontur erhöht die Zahl von vier auf fünf. Die größere Teilfläche behält `Fläche-10`, die abgetrennte Fläche erhält `Fläche-12`. Die Zuordnung „Freifläche“ und ihre ID bleiben nach einer versetzten Korrektur erhalten. Ein durch die Korrektur neu entstandener Rest ist ungeklärt. |
| Zusammenführen | Bei gemeinsamer Kante entsteht wieder eine Fläche mit der zuerst gewählten ID. Verschiedene Ausgangstypen führen zu „Ungeklärt“. Ein Zusammenführen über den Wegring wurde abgewiesen und ließ den exportierten Zustand unverändert. |
| Überlagerung und Grenzen | Ein gezeichneter Gehölzumriss erscheint getrennt im Export und verändert die Grundflächen nicht. Eine Korrektur über den südlichen Weg wurde abgewiesen. Der Punkt im Loch einer Grundfläche wurde im separaten Hit-Test nicht als Teil der Grundfläche erkannt. |
| Bilanz und Überlappungen | In den geprüften Exporten bleiben IDs eindeutig. Die Schnitte zwischen verschiedenen Grundflächen und zwischen Grundflächen und Wegen haben im Test Flächeninhalt null. Grundflächen bleiben innerhalb der Grundstücksgrenze. Der größte Bilanzfehler in den Bearbeitungsschritten liegt unter 6 × 10⁻¹¹ Pixel². Die Wegpolygone bleiben bei reiner Grundflächenbearbeitung im JSON identisch. |
| Luftbildfrage | Die Prüfung meldete beim zentralen Bereich 36 % grüne Bildfläche und fragte, ob der markierte Bereich eine eigene Grundfläche ist. Vorschau und Verwerfen ließen die Grundflächen unverändert. Die ausdrückliche Übernahme erzeugte aus vier fünf Grundflächen, alle ungeklärt. Es erschien kein JavaScript-Fehler. |

## Bildsignal und Quellen

Ein unabhängiger Node-Lauf mit der implementierten Methode lieferte je einen sichtbaren Vegetationskandidaten in den vier Bagua-Restflächen mit 10,79, 8,06, 19,95 und 6,45 m². Bezogen auf die zwei veröffentlichten Beetreferenzen ergab der jeweils beste Kandidat 16,69 % bzw. 0 % IoU. Die beiden Referenzen stammen aus der bestehenden Bildinterpretation. Der Befund stützt eine Rückfrage, aber keine automatische fachliche Beetabgrenzung oder Klassifikationsabnahme. [Lokale Beetreferenzen](../../evidence/segmentation/references.json)

Die lokal installierten Versionen entsprechen den angegebenen Upstream-Versionen `d3-contour` 4.0.2 (ISC) und `polygon-clipping` 0.15.7 (MIT). Das Orthofoto Bagua ist ACT 2023 unter CC0. Seine SHA-256-Prüfsumme stimmt mit dem protokollierten Abruf überein. Das Verfahren verwendet RGB-Werte ohne Modellgewichte. Der unabhängige Vite-Kontrollbuild erzeugte reguläre JS- und CSS-Bundles mit denselben SHA-256-Werten wie die bestehende Distribution. [d3-Lizenz](https://raw.githubusercontent.com/d3/d3-contour/v4.0.2/LICENSE) · [Polygon-Clipping-Lizenz](https://raw.githubusercontent.com/mfogel/polygon-clipping/v0.15.7/LICENSE.md) · [Amtliche Orthofotoquelle](https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-2023/) · [Bagua-Quellnachweis](../../evidence/segmentation/QUELLE.md)

## Befunde und Nachprüfung

- Im zuerst geprüften Stand vergrößerte eine Wegbreitenänderung von 80 auf 100 und zurück auf 80 cm nach manueller Bearbeitung die Zahl der Grundflächen von fünf auf neun. Temporär überdeckte Teile wurden beim Rückstellen zu neuen ungeklärten Streifen. Nach der Korrektur blieb die Zahl bei fünf, nach dem Rückstellen mit exakt derselben ID-Menge. Die Flächenbilanz blieb erhalten.
- Zunächst verschwand die Klassifizierung, wenn die Korrektur eine Nachbarfläche vollständig überzeichnete. Nach der Korrektur des Codes bestätigte ein eigener Browserdurchlauf, dass die überzeichnete `Fläche-12` mit dem Typ „Freifläche“ zur Prüfung im Export erhalten bleibt. Die bearbeitete Zielregion behielt `Fläche-10`.
- Auch die Kombination 80 → 100 cm, Teilen und Zusammenführen bei breiterem Weg, anschließend zurück auf 80 cm wurde nach der Korrektur unabhängig in Chromium wiederholt. Bei 80 cm lagen wieder dieselben vier Grundflächen-IDs vor. Der exportierte Bestand bestand die Bilanzprüfung nach der Rückstellung und nach der anschließenden Erfassung eines Gehölzumrisses. [Browserprüfung Bestand](inventory-browser.js)

**Urteil.** Die technische Abnahme für den beschriebenen isolierten Bagua-Ablauf ist bestanden. Der bestehende Browsercheck bestätigte Zoom, Positionsstabilität, Breitenprioritäten, Wegknoten, Bestands-ID und schmale Ansicht. Der reguläre Tandel-Test bestätigte Bestandsanalyse und die Wiederherstellung der gespeicherten Kultur im separaten Beetplan. [Regressionsprüfung Experiment](browser-check.js) · [Regressionsprüfung Planer](../../scripts/review-flow.js)
