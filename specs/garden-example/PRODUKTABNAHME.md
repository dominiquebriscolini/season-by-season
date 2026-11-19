# Unabhängige Produkt- und UX-Abnahme · Garden_Example

**19. November 2026 · Lokaler Produktionsbuild freigegeben.** Geprüft wurde [Fassung 1.0](README.md) mit Chromium im [lokalen Pages-Unterpfad](http://127.0.0.1:5176/season-by-season/). Die prüfende Rolle war an Standortwahl, Entwurf und Umsetzung unbeteiligt.

| Prüffall | Beobachtung | Mangel und Urteil |
| --- | --- | --- |
| Einstieg bei 1440 und 390 CSS-Pixeln | Startadresse und Beispiellink öffnen „Garden_Example“ auf der Karte. Die Ortswahl benennt Jardin Bagua Kirchberg. Amtliches Luftbild, Grundstück, Ringweg und vier Grundflächen sind sichtbar. Der Beispielhinweis verweist auf den Beetplan. | Bestanden. Die Navigation bleibt ohne horizontalen Überlauf erreichbar. Der erste Karteneinstieg benötigt keine externen Requests. |
| Weltkarte | Der Ortswert ist vorausgefüllt. Die Weltkarte lädt auf beiden Breiten die zentrale OSM-Kachel `/19/271132/178645.png` am belegten Standort. Abbrechen führt zur offenen Beispielkarte zurück. | Bestanden. Die Live-Kacheln werden beim Öffnen des Dialogs geladen. |
| Beetplan und Ausgabe | Frühlingsbeet zeigt Kopfsalat und Radieschen auf zwei Streifen. Sommerbeet zeigt Möhre, Bohne und Zucchini auf drei Streifen. Tomatenbeet zeigt Tomate auf dem ganzen Beet. „Sommerbeet · Streifen 1“ erschließt Kulturwahl, Aussaat am 12. April 2026 und Erntefenster. Saisonsteuerung und Mondphase sind erreichbar. Druck und Excel zeigen jeweils sechs Belegungen des gesamten Gartens. | Bestanden. Auf Mobilgeräten sind die längeren Anbaudaten per Scrollen erreichbar. |
| Ablösung und lokaler Bestand | Der bisherige Link öffnet Garden_Example. In einem Prüfprofil mit Vorversionsstand ist die unveränderte alte Demo in der Bibliothek ausgeblendet. Eine bearbeitete alte Kopie öffnet weiterhin. Die getrennte lokale Krautgaart-Prüfung stellt einen vorhandenen ISO-Entwurf vorrangig wieder her. | Bestanden. Der gespeicherte Stand des privaten Gartens bleibt unverändert. |

Die ausführliche Prüftabelle, der Playwright-Ablauf und die Bildnachweise des öffentlichen Beispiels liegen lokal unter `evidence/garden-example/`.
