# Unabhängige Vorabprüfung · Krautgaart-Bedienung

**19. November 2026 · Fassung 1.0.** Geprüft wurden die [Spezifikation](README.md), [§§2–3 und 6–7 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md), die [Flächenpartition](../../PLAN.md#verbindliche-flächenpartition) und die [ISO-Kamera](../iso-camera/README.md). Die Prüfung fand vor der Implementierung statt.

| Prüfaspekt | Beobachtung und Urteil |
| --- | --- |
| Gemeinsames Farbschema | Die gemeinsam genutzte Kopfleiste ist der passende Ort für eine Auswahl, die sich auf Karte und Beetplan auswirkt. System als Ausgangswert erhält die vorhandene automatische Wahl. Hell und Dunkel können unabhängig von der aktuellen Systempräferenz geprüft werden. Sichtbarer Zustand, 44-Pixel-Ziel mobil und Fokus nach Schließen sind überprüfbar. Geeignet. |
| Wegachsen und Enter | Der vorhandene Wegabschluss hat Vorrang. Erst die nächste getrennte Betätigung nach einer erfolgreich abgeschlossenen Achse startet einen leeren Entwurf. Escape, Werkzeug- und Projektwechsel begrenzen den Geltungsbereich. Ein zusätzlicher Fall sollte die Wiederholung nach Abschluss über die sichtbare Schaltfläche prüfen, da diese beim Abschluss ausgeblendet wird. Die fachliche Wegbildung und Breitenlogik bleiben unverändert. Geeignet. |
| Mausrad und Kamerapunkt | Die Skalierung bezieht sich auf den Bodenpunkt unter dem Mauszeiger. Die Abnahme soll den außerhalb der Mitte liegenden Punkt nach einer Ost-Drehung über die tatsächliche inverse Welt-SVG-Bildschirmmatrix vor und nach dem Zoom vergleichen. Vorhandene Schaltflächen, Zoomgrenzen und der Tastaturmodifikator für Browserzoom haben getrennte Erwartungen. Geeignet. |
| Flächentyp, Name und Daten | Der frei gewählte Name bezeichnet eine vorhandene stabile ID. Der Typ kommt weiterhin aus der Klassifikation. Leeres Feld setzt die Anzeige zurück. Namenlose historische Stände, benannte verknüpfte Vorjahre, offene Beetentwürfe und der JSON-Rückweg haben eindeutige Prüffälle. Bei Geometrieänderungen darf der Name keinem anderen Flächenbezug zufallen. Geeignet. |
| Prüfkopie und Nachweise | Die sichtbare Browserabnahme verlangt „Krautgaart“. Eine getrennte Prüfkopie schützt den regulären Nutzergarten bei Tests mit Speicher- und Geometrieänderungen. In der Dokumentation genügen Beobachtungen und relative Messwerte ohne gespeicherte Nutzerdaten. Geeignet. |

**Urteil.** Die Spezifikation ist für die begrenzte Umsetzung freigegeben. Technische Abnahme und Produktabnahme folgen am Browser-Nutzerweg mit der getrennten Prüfkopie.
