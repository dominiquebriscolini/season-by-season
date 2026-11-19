# Unabhängige Vorabprüfung · Aktueller Teststand

**19. November 2026 · Fassung 1.0.** Geprüft wurden die [Spezifikation](README.md), die [Übergabe §§3–5](../../Season-by-Season-Uebergabe-aktualisiert.md), die [bisherigen Saisonregeln](../season-projects/README.md) und der [Beetplan im Layout B](../iso-randdock/README.md). Die Vorabprüfung fand vor der Implementierung statt.

| Prüfaspekt | Beobachtung und Urteil |
| --- | --- |
| Ursache und Umfang | Der reguläre Beetplan bindet den Kalender erst bei `project.season` ein. Das Erntejournal hängt am gesetzten Saisonjahr. Ein gespeicherter Garten ohne Hauptjahr passt zum beobachteten Zustand von „Krautgaart“. Der sichtbare Einstieg erklärt diese Voraussetzung und verwendet denselben Dialog und dieselbe Speicheroperation. Die verpflichtende ausdrückliche Jahreswahl und der getrennte, schreibgeschützte v1-Weg sind klar geregelt. Geeignet. |
| Auffindbarkeit und Fokus | Für 320 und 390 px sowie bei geschlossenem Dock ist der Saisonbereich als sichtbarer Ort festgelegt. Tastaturfokus beim Öffnen, Schließen und erfolgreichen Speichern hat ein überprüfbares Ziel. Kontexttexte zur Einstufung und Belegung erklären bestehende Ansichtsbedingungen. Geeignet. |
| Kartenrückweg | Datum und Planwahl sind bei Rückkehr in denselben geöffneten Beetplan Ansichtszustand. Projektwechsel beginnt mit dem gewohnten Standarddatum. Stoppen der Wiedergabe ist ausdrücklich geregelt. Ein manuell gewähltes verknüpftes Vorjahr macht den Fall prüfbar. Geeignet. |
| Leerer Teststand und Daten | Der getrennte Origin erlaubt einen vollständigen Neubeginn mit den vorhandenen Werkzeugen, wahlweise ab leerer Karte oder mit der vorhandenen Vorlage. Die Testdaten können im isolierten Browser aufgebaut werden. Der sichtbare Übergabebrowser zeigt seine leere Liste. Fehlendes Jahr nach Abbruch, unveränderte Revision sowie getrennte vorhandene Gartenliste sind konkrete Kontrollpunkte. Geeignet. |

**Urteil.** Die Fassung 1.0 ist zur Umsetzung freigegeben. Die Browserabnahmen prüfen gesondert den leeren Produktionsstand, den Kartenrückweg mit manuell gewähltem Vorjahr und die vollständige fachliche Prüfkette.
