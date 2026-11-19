# Weggestützte Gartenanalyse

Nach [§2 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md#2-von-der-weltkarte-zum-garten--verbindliche-geometrie--und-bestandslogik) bestimmen die Wege einschließlich ihrer Verlängerungen bis zum Grundstücksrand die Grundflächen. Der [Entwicklungsplan](../../PLAN.md#abnahmen-der-umsetzung) enthält die unabhängigen Abnahmen.

## Lokal ausprobieren

Beim ersten Start im Projektordner `npm ci` ausführen.

```powershell
npm run dev -- --port 5191 --strictPort
```

Den Entwicklungsserver laufen lassen, solange der Versuch geöffnet ist. Im lokalen Browser [den Versuch öffnen](http://127.0.0.1:5191/experiments/way-guided/). Falls der Link aus Codex nicht öffnet, die Adresse direkt in die Browserleiste kopieren:

```text
http://127.0.0.1:5191/experiments/way-guided/
```

Beim Öffnen zeigt der Versuch das Orthofoto mit leerer Geometrie. Für eine Vorlage „Frühere Achsen laden“ oder in Bagua „Sichtbares Bagua-Netz laden“ wählen. Ein Testgartenwechsel mit einem laufenden Entwurf fragt vor dem Verwerfen nach.

1. **Wegenetz zeichnen.** Die Grundstücksgrenze zeichnen und abschließen. Dann die Standardbreite in Zentimetern eingeben (Startwert 80 cm) und die Wegachsen zeichnen. Nahegelegene Achspunkte rasten an vorhandenen Stützpunkten oder auf einem Achsensegment ein. „Vorlagen → Neu beginnen“ leert den Arbeitsbereich.
2. **Weggeometrie nachbearbeiten.** Einen Weg auf der Karte anklicken. Rechts erscheinen die Breitenfelder für den gewählten Weg und Abschnitt. Leere Felder übernehmen die nächsthöhere Breite. Über die Kartenleiste lassen sich Stützpunkte versetzen, einsetzen oder entfernen und zusätzliche Objektumrisse zeichnen. Explizit gemeinsame Stützpunkte können gemeinsam versetzt werden.
3. **Karte navigieren.** Am Mausrad oder mit Plus/Minus zoomen. Mit aktiviertem „Verschieben“ oder gedrückter mittlerer Maustaste ziehen. „Grundstück einpassen“ stellt die Übersicht wieder her. Die Navigation verändert die Geometrie und einen laufenden Entwurf nicht.

Hellblau gestrichelte virtuelle Trennlinien führen freie Enden bis zum nächsten geeigneten Rand oder Anschluss. Sie haben keine Breite. Wegflächen stammen aus den gezeichneten Achsen und den eingestellten Breiten. Unter **Weggeometrie nachbearbeiten** die gezeichnete Achse auswählen. „Verlängerung … korrigieren“ übernimmt die Richtung eines Kartenklicks. „Verlängerung … zurücksetzen“ verwendet wieder die Richtung des letzten gezeichneten Abschnitts. Die gezeichneten Punkte und Wegflächen bleiben bei diesen Aktionen erhalten. Für den Vierarmfall entsteht die zusätzliche Fläche in der Mitte aus einem bewusst gezeichneten geschlossenen Weg.

Mit **Fläche auswählen** direkt auf eine Restregion klicken. Jede Restregion ist eine Grundfläche mit ID und beginnt als „Ungeklärt“. Beet, Anbaufläche, Freifläche und Sonstige Fläche sind Typen derselben Geometrie. „Luftbild prüfen“ zeigt einen unverbindlichen Hinweis auf sichtbaren Bewuchs. Ändert sich die Partition durch Wegbearbeitung, übernimmt der Versuch eindeutige Zuordnungen. Frühere Typen mit unklarer Zuordnung erscheinen als Prüfhinweise.

Unter **Weggeometrie nachbearbeiten → Objektumriss zeichnen** Baum, Hecke, sonstiges Gehölz, Gebäude, Schuppen, Gewächshaus oder begehbaren Folientunnel zeichnen und klassifizieren. Temporäre niedrige Folie bei der Bestandsaufnahme auslassen. „Objekt verschieben“ nimmt einen Punkt im Umriss und dessen neue Position. „Umriss korrigieren“ ersetzt die Kontur unter derselben Objekt-ID.

Bei Grundflächen zeigt die Auswahl die Gesamtgröße und die nutzbare Fläche. „Grundfläche darunter auswählen“ wechselt vom Objekt zur Fläche. Treffen am Klickpunkt mehrere Objekte zusammen, stehen sie in der Auswahl namentlich zur Verfügung. Die nutzbare Wegfläche steht unter „Flächen und Bestand“. Nur Gebäude und Schuppen belegen Nettofläche. Überlappende Baukörper belegen ihre gemeinsame Fläche einmal. Gewächshaus und begehbaren Tunnel über die Schaltflächen im selben Abschnitt einzeln aus- und einblenden.

Im JSON-Export enthält `axes` die gezeichneten Achsen, `result.paths` die realen Wegflächen und `result.lines[].extensions` die breitenlosen Trennlinien. `regions` enthält die dadurch partitionierten Grundflächen. `net` gibt die nutzbaren Grund- und Wegflächen sowie den vereinigten Baukörperabdruck aus. Die reguläre Anwendung hat einen eigenen Datenstand. Kulturzuweisung und Unterteilung folgen in deren isometrischem Beetplan.

JSTS 2.12.1 knotet und polygonisiert das Liniennetz für den Versuch. Das Paket verwendet fastpriorityqueue. [JSTS-Paket](https://github.com/bjornharrtell/jsts/tree/2.12.1) · [EDL-1.0-Lizenz](LICENSE-JSTS-EDL.txt)

Breiten werden als lokale Bodenmeter aus der Georeferenzierung des Orthofotos berechnet und mit gerundeten Segmentpuffern vereinigt. Die JSON-Datei enthält Breiten in Metern und die Georeferenzierung der Bildkoordinaten. Der Prototyp hält die Sitzung im Arbeitsspeicher und exportiert sie über „Versuchsdaten speichern“. Dateiimport und Wiederherstellung nach Neuladen sind weiterhin offen. [Browseransicht](bedienoberflaeche-bagua.png) · [Unabhängiges Review der Bedienoberfläche](REVIEW-UI.md)

```powershell
node experiments/way-guided/measure.mjs
playwright-cli -s=way-test open http://127.0.0.1:5191/experiments/way-guided/
playwright-cli -s=way-test run-code --filename=./experiments/way-guided/browser-check.js
node experiments/way-guided/inventory-check.mjs
playwright-cli -s=way-test run-code --filename=./experiments/way-guided/inventory-browser.js
```

## Ursprünglicher Vergleich der automatischen Breitenmessung

Die folgenden Ergebnisse stammen aus dem früheren Forschungsablauf. Der separate Node-Messpfad verwendet weiterhin die adaptiven Querprofile. Die interaktive Oberfläche arbeitet mit der eingestellten metrischen Breite. Frühere Kulturbeispiele in den Messungen beziehen sich auf die interne Zuordnung von Testdaten. Das damalige Kulturfeld wurde nach dem Produktreview aus der Oberfläche entfernt.

### Prüffrage und technische Auswahl

Ergibt dieselbe zuvor gezeichnete Mittellinie mit RGB-Querprofilen eine bessere Wegfläche als mit einer konstanten Breite? Reicht die Differenz aus Gartengrenze und einem vollständigeren Wegenetz zur Trennung der bekannten Beete? Der schmale gerade Weg in Tandel, der geführte schräge Weg in Hesperange und zwei unterschiedlich klare Abschnitte in Bagua bilden den Vergleich. Ein eigener Bagua-Durchlauf untersucht den Rundweg mit seinen sichtbaren Anschlüssen. Eine synthetische Kreuzung prüft Topologie, Breitenwechsel und eine konkave Grundstücksecke ohne Bildinterpretation.

| Stand | Kandidat und Entscheidung |
| --- | --- |
| Erprobt | `polygon-clipping` 0.15.7 (MIT, `splaytree`, `robust-predicates`), bereits im Lockfile. Union, Schnitt und Differenz unterstützen MultiPolygone mit Löchern. Die Upstream-CI umfasst Jest und Regressionsfälle. Dieselben Paketimporte genügen im Browser und in Node. Dazu die vorhandene EPSG:3857-Projektion aus OpenLayers 10.11.0 (BSD-2-Clause) und PNG-Dekodierung in der Messung mit pngjs 7.0.0 (MIT, Entwicklungsabhängigkeit). [Polygonoperationen, Lizenz und Tests](https://github.com/mfogel/polygon-clipping/blob/v0.15.7/README.md) · [OpenLayers-Release](https://github.com/openlayers/openlayers/releases/tag/v10.11.0) · [pngjs](https://github.com/pngjs/pngjs) |
| Recherchiert | RivWidthCloud, Commit `eeec6e2b1f07f77e99b15122beb59c177f066936`, MIT-Datei, zuletzt 2022 aktualisiert. Querprofile und unsichere Messsituationen für Flussbreiten sind ein fachlicher Vergleich. Das Beispiel verarbeitet Landsat über Earth Engine. Eine Übernahme würde anderen Bildmaßstab, Dienste und eine Portierung erfordern. Der Versuch hat eigene Querprofile und übernimmt keinen Quellcode. [Beispiel](https://raw.githubusercontent.com/seanyx/RivWidthCloudPaper/eeec6e2b1f07f77e99b15122beb59c177f066936/README.md) · [Lizenz](https://raw.githubusercontent.com/seanyx/RivWidthCloudPaper/eeec6e2b1f07f77e99b15122beb59c177f066936/license) |
| Recherchiert | JTS `VariableBuffer` ab 1.18.1 mit späteren Korrekturen an Endkappen. Die Java-Bibliothek und ihre Tests sind ein Vergleich für variable Puffer. Für die vorhandene Browserarchitektur müsste die Funktion portiert oder in einem zusätzlichen Prozess ausgeführt werden. [Versionshistorie](https://github.com/locationtech/jts/blob/master/doc/JTS_Version_History.md) · [Projekt, Lizenz und Tests](https://github.com/locationtech/jts) |
| Recherchiert | SAM 2.1 Hiera Tiny, Commit `2b90b9f5ceec907a1c18123530e92e794ad901a4`, 38,9 M Parameter. Code und Checkpoint sind Apache-2.0. Das Trainingsmaterial unterliegt eigenen Bedingungen und wird im Versuch nicht bezogen. Das Projekt liefert Punkt-/Rechteck-Prompts, Demo und Benchmarks. Python, PyTorch und TorchVision vergrößern den Aufwand, WSL wird unter Windows empfohlen. SAM liefert Objektmasken, für Gartenklassen wäre ein separater Klassifikator oder eine Bestätigung nötig. Laufzeit auf der vorhandenen GTX 1650 Ti Max-Q mit rund 4 GiB VRAM bleibt offen. [Modell, Voraussetzungen und Lizenz](https://raw.githubusercontent.com/facebookresearch/sam2/2b90b9f5ceec907a1c18123530e92e794ad901a4/README.md) |
| Recherchiert | scikit-image 0.25.2 (BSD-3-Clause) mit scikit-learn RandomForest, z. B. 1.8.0 (BSD-3-Clause). Das offizielle Beispiel trainiert mit markierten Pixeln auf lokalen Farb-, Kanten- und Texturmerkmalen. NumPy/SciPy und scikit-learn laufen in einem lokalen Python-Prozess. Für messbare Gartenklassen braucht es getrennte Trainings- und Testgärten mit ausreichend Beispielen je Klasse. [Ausführbares Upstream-Beispiel](https://scikit-image.org/docs/0.25.x/auto_examples/segmentation/plot_trainable_segmentation.html) · [Forest-Tests](https://github.com/scikit-learn/scikit-learn/blob/1.8.0/sklearn/ensemble/tests/test_forest.py) |

Eigenleistung: RGB-Kanten links und rechts entlang senkrechter Profile im Abstand von höchstens vier Pixeln suchen. Der Suchradius liegt bei 2–15 Pixeln je Seite. Ein lokaler Median über bis zu fünf Stationen dämpft einzelne Ausreißer. Wegstreifen und Endkappen werden an Kreuzungen vereinigt und auf die Gartengrenze zugeschnitten. Die Restfläche wird vektoriell abgeleitet. Der Vegetationsanteil aus einer einfachen RGB-Regel liefert allenfalls einen Hinweis. Gebäude, Gehölze und Beete sind manuelle Nutzungsoptionen. Eine Wegbreitenfrage erscheint bei mindestens einem schwachen Querprofil eines Abschnitts. Der Prototyp markiert die Unsicherheit und liefert weiterhin eine vorläufige Geometrie.

Für eindeutige Regionszuordnungen ab IoU 0,55 werden ID, Nutzungsart und Kultur übernommen. Bei konkurrierenden Überlappungen archiviert der Versuch vorhandene beschriftete Datensätze und zeigt eine Nachfrage. Eine direkte Zuordnungsaktion für diese archivierten Daten fehlt. Ein manuell erfasster Objektumriss behält seine ID und Geometrie bei Wegkorrekturen. Eine Überschneidung mit dem Weg wird angezeigt.

## Gemessene Ergebnisse

Für die vier referenzierten Wegabschnitte nutzt der Vergleich exakt die früher erfassten RGB-Achsen. Der neue Lauf erhält weder Beetfenster noch Breitenwerte. Die Kontrollvariante verwendet dieselben Achsen, dieselben geometrischen Operationen und eine exemplarische Gesamtbreite von acht Pixeln (knapp 0,8 m). Die Referenzen sind öffentlich und stammen aus älteren Bildinterpretationen. Die Auswertung ist retrospektiv. Für jeden Abschnitt wird der Breitenfehler nur an Stationen gemessen, deren Achspunkt innerhalb seines Referenzwegs liegt. Damit bleibt die Breitenmessung bei fehlplatzierten Achsen unvollständig.

| Abschnitt | Weg-IoU adaptiv | Fest 8 px | Bisheriges RGB | Mittlerer absoluter Breitenfehler adaptiv / fest | Vergleichbare / ausgelassene Stationen |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tandel | 72,6 % | 78,4 % | 68,2 % | 0,20 / 0,12 m | 26 / 0 |
| Hesperange | 36,4 % | 39,0 % | 44,4 % | 0,26 / 0,26 m | 26 / 16 |
| Bagua Weg 1 | 28,4 % | 39,3 % | 50,4 % | 0,32 / 0,08 m | 13 / 0 |
| Bagua Weg 2 | 17,4 % | 12,9 % | 33,4 % | 0,56 / 0,26 m | 5 / 17 |

Im Bagua-Vergleich liegen Handzeichnung und GrabCut für die beiden Wege bei 46,8 % / 45,6 % bzw. 4,9 % / unter 0,01 %. Über beide Beete und beide Wege ergeben sich mit fehlenden Objekten als null im Mittel 11,5 % für den neuen Lauf, 20,9 % für RGB, 52,3 % für die Handzeichnung und 2,3 % für GrabCut. Die früheren Verfahren erhielten andere Arten von Eingaben. [Bagua-Vergleich](../../evidence/segmentation/score.json) · [Tandel und Hesperange](../../evidence/transfer/score.json)

Die idealisierte globale Restfläche ist Grundstück minus **die wenigen referenzierten Wegabschnitte**. Ihre IoU beträgt 99,7 % / 98,6 % / 94,5 % für Tandel, Hesperange und Bagua. Diese Zahl wird von der großen verbleibenden Grundstücksfläche dominiert. Die beste einzelne Restfläche erreicht pro Referenzbeet nur 1,9–6,8 % IoU. Der Prototyp erkennt daraus kein einzelnes Beet.

Ein eigener Bearbeiter zeichnete den sichtbaren Bagua-Rundweg und drei Zugänge am Rohbild. Das ergibt eine verbundene Wegfläche und vier Restpolygone (147,89 / 74,36 / 41,04 / 0,015 m²). Das kleinste ist ein etwa anderthalb Pixel großer geometrischer Splitter. Für die Beete erreicht die jeweils ähnlichste Restfläche 3,8 % und 5,8 % IoU. Die geschätzten Wege überdecken 6,0 % und 9,6 % der beiden Beetflächen. Schmale radiale Lücken und verdeckte Abschnitte blieben mehrdeutig. Das ganze Netz hat keine vollständige Handreferenz. [Browseransicht](bagua-browser.png)

Im synthetischen Kreuzungsfall entstehen eine zusammenhängende Wegfläche und vier Restflächen. Die Flächenbilanz weicht um weniger als 0,000001 Pixel² ab. Der Wechsel von 7 auf 17 Rasterpixel wird als Wechsel von 5 auf 15 Pixel erfasst. Die Breite hat in diesem Kontrasttest damit einen systematischen Fehler, der Wechsel bleibt sichtbar. Eine kleine Breitenkorrektur erhält die Kultur ihrer Fläche. Das Entfernen eines Kreuzungsastes führt zu einer Zusammenlegung und legt die Kultur zur Prüfung ab.

**Bedienung.** Der Browser-Test zeichnet die früheren Achsen mit 4 / 4 / 8 Aktionen (Modus, Bildklicks, Abschluss) und die Grundstücksgrenzen getrennt mit 9 / 13 / 10 Aktionen. Das Bagua-Hauptnetz benötigt 46 weitere Aktionen (7 Moduswahlen, 32 Stützpunkte, 7 Abschlüsse), meldet 12 Breitenfragen und lässt vier Nutzungen offen. Die reine Zahl von 8 Achsenaktionen ist mit den alten 39 / 14 / 20 Gesamtaktionen nur bei Beachtung der jeweils fehlenden Beetkonturen und Nacharbeit vergleichbar. Der Browser-Test versetzt einen gemeinsamen Knoten, setzt und entfernt einen Achspunkt, ändert eine Breite, zeichnet einen separaten Umriss und exportiert JSON. „Möhre“ bleibt an derselben Flächen-ID. Die Klicks sind Automationsereignisse mit vorbereiteten Positionen. Es gibt keine gemessene menschliche Bearbeitungszeit oder Studienstichprobe.

**Rechenaufwand.** Intel Core i7-10750H, 15,87 GiB RAM, Node v26.13.1, CPU-Ausführung. Die tatsächlichen Mediane der acht Wiederholungen im protokollierten Lauf liegen bei rund 5–11 ms für einzelne Gärten und 25 ms für das Bagua-Netz. Der erste Netzlauf lag bei 53 ms. Enthalten sind Weg- und Restflächenableitung samt Bildhinweis. PNG-Laden und Browserdarstellung sind separat. Der RGBA-Puffer pro 624²-Bild belegt 1.557.504 Bytes (1,49 MiB). Beim zuerst ausgeführten Netzfall stieg der Node-Prozess-RSS zwischen den beiden Messpunkten von rund 66 auf 76 MiB. Das sind Prozessstichproben inklusive Laufzeit und Abhängigkeiten. Spitzenbedarf und Skalierung auf größere Bilder bleiben offen. [Rohmesswerte mit Prüfsummen](measurements.json)

**Quellen.** Die Bilder sind lokale Ausschnitte des amtlichen ACT-Orthofotos 2023 unter CC0 mit rund 10 cm Bodenpixelmaß. Die Quellenblätter dokumentieren WMS-Aufrufe und SHA-256. Die Messläufe verwenden ausschließlich die lokalen Bilder, Geometriedaten und bereits installierten Pakete. [Amtliche Bildfreigabe](https://data.public.lu/en/datasets/orthophoto-officielle-du-grand-duche-de-luxembourg-edition-2023/) · [Tandel](../../public/garden/QUELLE.md) · [Hesperange](../../evidence/transfer/QUELLE.md) · [Bagua](../../evidence/segmentation/QUELLE.md)

## Historisches Messergebnis und aktueller Bezug

**Gemessen:** Die Geometrie kann aus explizit verbundenen Achsen zusammenhängende Wege ableiten und Änderungen mit benachbarten Flächen abgleichen. Die adaptive Breite ist im Mittel schlechter als die 8-Pixel-Kontrolle (38,7 % gegenüber 42,4 % Weg-IoU). Tandel liefert den einzigen Aufwärtstrend gegenüber dem früheren RGB-Verfahren.

**Aktueller Bezug.** Die frühere Beet-IoU bewertet die Annäherung an Bildreferenzen. Die aktuelle Grundflächenbildung verwendet die geometrische Wegpartition. Die Browser- und Geometrieprüfungen oben prüfen offene Achsenenden, Kreuzungen, Flächenbilanz und Nettoabzüge.
