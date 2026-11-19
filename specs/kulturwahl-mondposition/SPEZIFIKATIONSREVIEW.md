# Vorabreview · Kulturwahl und Mondposition

19. November 2026 · Unabhängige Produkt- und UX-Prüfung der [Spezifikation Fassung 1.0](README.md). **Zur Umsetzung freigegeben.**

| Prüffall | Beobachtung und Urteil |
| --- | --- |
| Anordnung und Bedienung | Das Dropdown kommt im Anbaubereich zuerst. Die separate, anfangs eingeklappte Eigeneingabe folgt darunter. Das entspricht der Nutzeraufnahme und der Ergänzungslogik in § 5. Das native Bedienelement kann mit Zeiger oder Tastatur geöffnet werden. Die Abnahme prüft die tatsächliche Öffnung und die unverändert vorhandenen Optionen beim Fokus. Bestanden. |
| Kulturen und Sorten | Eine breite alphabetische Auswahl gebräuchlicher Gemüsekulturen passt zur Wahl am Beet oder Streifen. Der vorhandene Weg für konkrete Sorten mit Richtwerten und Quellen bleibt in den Anbaudaten. Neue Namen benötigen keine erfundenen Kulturwerte. Das Eintragen eines Namens wählt die Kultur aus. Erst „Belegung speichern“ schreibt in den Gartenstand. Bestanden. |
| Persönliche Bibliothek und Belegungen | Die Fassung verlangt, dass frühere eigene Namen und Profile bei Überschneidung mit der Standardliste verwendbar bleiben und in der Liste nur eine normalisierte Option erscheint. Für den Browserfall eine ältere persönliche Kultur mit eigener Schreibweise und den dazugehörigen Richtwerten verwenden. Beim Speichern und Wiederöffnen den ursprünglichen Belegungsnamen prüfen. Bestanden. |
| Saisonleiste und Mond | Die reservierte Spalte hält den Mond bei kurzen und langen Phasenbeschriftungen an derselben Position. Auf schmalen Ansichten hat die Anzeige eine eigene Zeile, der verbleibende Platz steht dem Text zur Verfügung. Die Fassung definiert die Toleranz von 0,5 CSS-Pixeln, beide Seiten der 420-Pixel-Schwelle und alle acht Phasen. Die Meldung ohne berechenbare Phase verwendet denselben Textbereich. Das passt zur Datumsbindung in § 4. Bestanden. |

Die Browserabnahme verwendet eine getrennte Krautgaart-Kopie. Für die Mondposition X und Y sowie 26 × 26 CSS-Pixel messen und vollständige Phasentexte auch bei erforderlichem Umbruch prüfen. [Übergabe §§ 4–5](../../Season-by-Season-Uebergabe-aktualisiert.md#4-saison-hauptjahr-und-anbaugeschichte)
