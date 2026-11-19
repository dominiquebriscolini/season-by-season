# Unabhängige Spezifikationsprüfung · Garden_Example

**19. November 2026 · Freigabe für Fassung 1.0.** Geprüft wurden die [visuelle Spezifikation](README.md), das Nutzerziel im [Entwicklungsplan](../../PLAN.md#öffentliche-vorschau-011--garden_example) und [§§ 2–5 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md#2-von-der-weltkarte-zum-garten--verbindliche-geometrie--und-bestandslogik). Die prüfende Rolle war an Entwurf, Standortwahl und Umsetzung unbeteiligt.

| Prüffall | Beobachtung an der Spezifikation | Mangel und Urteil |
| --- | --- | --- |
| Öffentlicher Einstieg | Projektname, Standort und Luftbild stehen am Anfang des beschriebenen Nutzerwegs. Das Öffnen der Weltkarte macht den referenzierten Standort auffindbar und führt nach Abbrechen zum offenen Beispiel zurück. | Kein Spezifikationsmangel. Das Kartenbild samt Standortbezug und der Weltkarten-Ausschnitt sind auf Desktop und Mobilgerät prüfbar. |
| Geometrie und Beetplan | Die Karte verwendet Grundstück, Bestandswege und daraus abgeleitete Grundflächen. Die Beispielkulturen liegen auf benannten ganzen Beeten oder auf deren Planungsstreifen. Der Wechsel in den Beetplan erschließt die Anbaudaten. | Kein Spezifikationsmangel. Im offenen Streifen müssen seine Kultur und der dazugehörige Beetname erkennbar sein. Mindestens fünf Belegungen müssen im vollständigen Gartenexport erscheinen. |
| Einordnung des realen Orts | Der dokumentierte Ort liefert einen verständlichen räumlichen Bezug. Die Bezeichnungen kennzeichnen die Pflanzungen als Beispiel. | Kein Spezifikationsmangel. Die Abnahme prüft, ob die Kennzeichnung im sichtbaren Nutzerweg verständlich ist. |
| Sichere Ablösung | Die Weiterleitung erhält den bisherigen öffentlichen Link. Die alte automatisch angelegte Demo wird durch ihre Unverändertheit abgegrenzt. Bearbeitete Kopien, private Projekte und Entwürfe behalten ihren Zugriff. | Kein Spezifikationsmangel. Die Abnahme erfordert je einen frischen und einen bereits verwendeten Browserzustand. |

Die Freigabe betrifft den Entwurf. Die Produktabnahme folgt am gebauten Stand mit der öffentlichen Vorschau im isolierten Browser und dem privaten Krautgaart als getrennter lokaler Regression.
