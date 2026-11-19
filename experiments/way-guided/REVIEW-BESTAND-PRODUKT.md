# Unabhängige Produkt- und UX-Abnahme · Flächen und Bestand

Früherer Prüfbericht. Das Urteil bezieht sich auf den damaligen Versuchsauftrag. Den Abgleich mit der verbindlichen Geometrie- und Bestandsentscheidung führt der [Entwicklungsplan](../../PLAN.md#ist-abgleich-mit-2).

Geprüft am 19. November 2026 in eigenen Chromium-Sitzungen über Playwright. Maßstab sind §2 der Übergabe zur Bestandsaufnahme vor der isometrischen Planung, §10 zur Behandlung unklarer Erkennung und der beauftragte Umfang des isolierten Wegexperiments. Der Reviewer war an Implementierung und Methodenwahl unbeteiligt.

| Prüffall | Beobachtung und Urteil |
| --- | --- |
| Direktauswahl und Klassifizierung | In der Bagua-Vorlage „Sichtbares Bagua-Netz laden“ die innere Restfläche bei Bildpunkt (479, 275) gewählt. Die Seitenleiste zeigte genau einen Flächendatensatz. Fläche-10 startete als „Ungeklärt“ und ließ sich ausdrücklich als „Freifläche“ klassifizieren. Die Statistik blieb bei einer verbundenen Wegfläche. |
| Teilen, Zusammenführen und Korrigieren | In Fläche-10 wurde ein Viereck bei (449, 245)–(478, 280) abgetrennt. Der größere Rest behielt seine ID und „Freifläche“. Die abgetrennte Fläche erhielt Fläche-12 und blieb zunächst ungeklärt. Nach Bestätigung als Freifläche wurden beide durch direkte Auswahl der Nachbarfläche zusammengeführt. Fläche-12 und ihr Typ blieben erhalten. Eine neu gezeichnete Korrekturkontur mit Eckpunkten von (449, 245) bis (480, 282) behielt ebenfalls ID und Typ. |
| Schutz des Wegenetzes | Bei einem erneuten Versuch verhinderte die Anwendung das Zusammenführen zweier durch einen Weg getrennter Flächen und erklärte, dass eine gemeinsame Kante nötig ist. Eine quer über einen Weg gezeichnete Korrektur wurde mit erklärender Meldung abgewiesen. Die bestehende Flächenstatistik änderte sich in beiden Fällen nicht. |
| Bestandsobjekt über Grundfläche | Ein auf Fläche-12 gezeichnetes Gebäude war als Objekt-14 direkt auswählbar. Über „Grundfläche darunter auswählen“ ließ sich die darunterliegende Fläche-12 mit Typ „Freifläche“ wieder direkt aufrufen. Die Überlagerung blieb für den Nutzer unterscheidbar. |
| Luftbild und Unsicherheit | Die Prüfung der inneren Bagua-Fläche meldete 36 % grüne Bildfläche als ungeprüften Bildhinweis und fragte, ob der markierte Bereich eine eigene Grundfläche sei. Der erste Versuch verwarf den Hinweis. Im zweiten Versuch erhöhte sich die Zahl der Restflächen erst durch „Bildkontur als Teilfläche übernehmen“ von vier auf fünf. Die ausgewählte Fläche blieb ungeklärt. Diese Beobachtung prüft den Bestätigungsablauf und liefert keine fachliche Bestätigung einer erkannten Beetgrenze. |
| Abgrenzung zur Planung | Die geprüften Bestands- und Wegwerkzeuge enthielten keine sichtbare Kultur-, Aussaat- oder Erntezuweisung. Der bekannte Wegauswahlmodus blieb erreichbar und bot weiterhin Breite je Weg und Abschnitt. |

**Gefundener und behobener UX-Mangel.** In der ersten Fassung blieb nach Auswahl eines Weges der vorherige Flächenbereich neben den Wegeinstellungen sichtbar. Nach der Korrektur wurde die gesamte Bedienfolge erneut ausgeführt. Bei Auswahl von Weg-4, Abschnitt 2, war genau dessen Einstellbereich sichtbar. Der Einstellbereich für Grundfläche-12 war geschlossen.

**Produktabnahme bestanden.** Die Bedienfolge bleibt in §2 der Übergabe bei der Bestandsaufnahme. Der ausdrücklich zu bestätigende Bildhinweis erfüllt den beauftragten Umgang mit unklarer Erkennung nach §10. Die tatsächliche Genauigkeit der referenzierten Beetgrenzen und die Flächenbilanz beurteilt die technische Prüfung.

[Aktualisierte Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md) · [Projektplan](../../PLAN.md)
