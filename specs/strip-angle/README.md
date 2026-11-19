# Frei drehbare Streifen im Beetplan

Grundlage sind [Übergabe §§2.9 und 3](../../Season-by-Season-Uebergabe-aktualisiert.md) und die [Entwurfs- und Konfliktregeln](../cycle-06/README.md). Die freie Richtung erweitert die bisherige Längs- und Querauswahl.

```text
Beetplan · ausgewähltes Beet
  Skizze: Beetkontur ─ Streifenvorschau ─ Drehgriff mit Pfeil
  Einstellungen: Anzahl Streifen | Winkel (°)
                  Unterteilung übernehmen
  Eindeutige Belegungen bleiben erhalten
  Unklare Belegungen → Rückfrage → bisherige Belegungen in der Prüfliste
```

- Winkel sind Kompasswinkel in der lokalen metrischen Bodenebene. 0° und 360° bedeuten Nord, 90° Ost, 180° Süd und 270° West. Im Uhrzeigersinn steigen die Werte. Die Werte 0–360° können numerisch eingegeben werden, gespeichert wird 0 ≤ Winkel < 360. Ein Pfeil zeigt die gewählte Orientierung. Eine Umkehr um 180° ergibt dieselben Streifengeometrien und dieselbe Reihenfolge. Die ISO-Projektion entscheidet allein über die Darstellung.
- Der Drehgriff liegt am ausgewählten bepflanzbaren Beet und folgt dem Zeiger im Bodenkoordinatensystem. Beim Ziehen ohne Shift gibt es keine Rastung. Gehaltenes Shift rastet beim Ziehen auf den nächstgelegenen 15°-Wert. Winkel und Anzahl aktualisieren die Vorschau sofort, einschließlich beim Tippen. Eine ungültige Eingabe kann nicht übernommen werden. Die Skizze kennzeichnet die Vorschau sichtbar. Die vorhandene Kulturwahl bleibt ausdrücklich an die zuletzt bestätigte Unterteilung gebunden. Die Vorschau bietet keine Pflanzziele. Nur „Unterteilung übernehmen“ speichert neue Streifen. Entwürfe aus dem laufenden Beetplan bleiben bei Ansichtswechsel und Neuladen erhalten.
- Die äußere Feldkontur bestimmt die Spannweite quer zur Richtung. Gleich breite parallele Bänder schneiden die nutzbare Nettofläche. Konkave Felder können mehrteilige Streifen ergeben. Löcher und Baukörper bleiben ausgespart. Vollständig abgeschnittene Bänder sind leer und nicht bepflanzbar. Feldkontur, Wege, Bestand und ihre IDs ändern sich dabei nicht.
- Alte Längs-/Quer-Teilungen behalten beim Öffnen und im Export ihre exakte Geometrie und ihre Kulturen. Ihr Winkel wird für die Anzeige aus der bisherigen Richtung abgeleitet. Neue gespeicherte Teilungen tragen den Bodenwinkel unabhängig von der Ansicht. Bei Anzahl 1 ist das Beet ungeteilt, ein bewusst gespeicherter Winkel kann für die nächste Teilung erhalten bleiben.
- Beim Übernehmen werden alte und neue nutzbare Geometrien räumlich verglichen. Eine Kultur wird genau dann automatisch übernommen, wenn sich altes und neues Ziel gegenseitig mindestens zu 85 % überdecken und einander eindeutig entsprechen. Eine Nummerngleichheit allein genügt nicht. Unklare Belegungen erfordern vor der Änderung eine Bestätigung und bleiben mit ursprünglichem Ziel und Kultur in der vorhandenen Prüfliste. Beim Abbruch bleiben Garten, Sicherung und Vorschauentwurf erhalten. Derselbe Schutz gilt bei der Übernahme einer älteren Unterteilung. Revisionskonflikte wirken wie bisher.

**Abnahme.** In Bagua eine freie Drehung, Shift-Rastung und numerische Eingabe beobachten. Speichern und erneut öffnen, auch mit früherer Längs-/Quer-Sicherung. An einem konkaven Beet mit Aussparung die deckungsgleiche Summe der Netto-Streifenflächen und fehlende Überlappungen prüfen. Eine Halbwendung erhält Kulturen. Bei einer starken Änderung bleiben unklare Kulturen nach Bestätigung in der Prüfliste, während Abbrechen nichts speichert. Karte, Bestand, Entwürfe und Konfliktzuordnung bestehender Projekte regressionsprüfen.

**Bedienfeld.** Neben „Unterteilungen“ steht die berechnete Breite eines Bands in Metern, gemessen quer zur Streifenrichtung. Anzahl und Winkel aktualisieren den Wert sofort. Der Winkel ist im Ausgangszustand ablesbar. „Winkel ändern“ schaltet Eingabe und Drehgriff frei. „Winkel fertig“ beendet den Modus und behält den Entwurf. Zuschnitt und Übernahme verwenden dieselbe Streifenspannweite.

**Wunschbreite.** Ein positiver Meterwert wählt unter 1–100 Unterteilungen die Anzahl, deren tatsächliche gleichmäßige Breite am nächsten liegt. Die Anzeige zeigt die berechnete Breite und die Skizze die zugehörige Teilung. Bei einer neuen Anzahl von Hand wird die Wunschbreite geleert. Übernommen werden Anzahl und Winkel.
