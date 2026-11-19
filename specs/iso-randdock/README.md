# Variante B im regulären Beetplan

**Fassung 1.0 · 19. November 2026.** Verbindliche Vorlage sind der geprüfte [Zeichentisch mit Randdock](../visual-design-audit-01/README.md#b--zeichentisch-mit-randdock), das [Designsystem](../visual-design-audit-01/DESIGNSYSTEM.md), die [ISO-Kamera](../iso-camera/README.md) und die [Übergabe §§3–7](../../Season-by-Season-Uebergabe-aktualisiert.md). Die Etappe betrifft den regulären aktuellen und historischen Beetplan. Karteneditor, v1-Altbestand, Datenformate, Pflanzenzeichnung, Flächenberechnung und Exporte bleiben wie im geprüften Projektstand.

```text
Breiter Beetplan, z. B. 1440 × 900
┌────────────────────────────────────────────────────────────────────┐
│ Saisonprojekte · Gartenname          Karte | Beetplan      Aktionen │
├──────────────────────────────────────────┬──────────────────┬──────┤
│                               Beetdetails│ Anbau planen [×] │  N   │
│                                          │ Grundfläche      │  O   │
│                  Bagua                  │ Aufteilung       │  S   │
│                  Mittelpunkt            │ Streifen         │  W   │
│                                          │ Anbaudaten …     │  ↶ ↷ │
│           Maßstab · Legende              │ eigener Scroll   │ − +  │
├──────────────────────────────────────────┴──────────────────┴──────┤
│ Datum · Tag zurück / weiter · Saisonregler · Play · Planwahl · Mond  │
└────────────────────────────────────────────────────────────────────┘

Kompakter Beetplan, z. B. 390 × 844
┌───────────────────────────────┐
│ Saisonprojekte        Aktionen│
│ Gartenname     Karte | Beetplan│
├───────────────────────────────┤
│        Bagua · Mittelpunkt   │
│        Maßstab · Legende      │
├───────────────────────────────┤
│ Anbau planen              [×] │
│ Grundfläche / … (scrollt)     │
├───────────────────────────────┤
│ N O S W           Beetdetails │
│ ↶ ↷ − + Verschieben           │
├───────────────────────────────┤
│ Datum · Tageswechsel · Play   │
│ Saisonregler · Planansicht    │
│ Projektstatus · Mondphase     │
└───────────────────────────────┘
```

## Bedienung und Anordnung

- Die kompakte Kopfzeile gehört nur dem regulären Beetplan. „Saisonprojekte“ sitzt links oben und verwendet den bestehenden Dialog. Die vorhandenen Ansichts-, Namens-, Speicher-, Bibliotheks- und Schließaktionen bleiben erreichbar. Auf schmalen Screens dürfen die drei Gartenaktionen auf benannte Zeichen mit Tooltip reduziert werden. Status und Fehlermeldungen bleiben lesbar. Der ISO-Rahmen übernimmt die geprüften hellen und dunklen UI-Farbrollen nach Systemeinstellung. Die Zeichnung behält in beiden Modi ihr bisheriges Papier und ihre bisherigen Farben.
- Oberhalb 900 CSS-px hat der Beetplan eine 56 px breite Kameraspalte, ein 312 px breites optionales Detaildock und eine Zeichenfläche, die den Rest nutzt. Auf schmalen Screens stehen die beiden Kameragruppen unten über dem Saisonbereich. Das geöffnete Dock liegt als begrenzte, vertikal scrollende Reihe darüber. Im niedrigsten Hochformat (320 × 568 px) lässt es mindestens 96 px Zeichenhöhe frei. Der Inhalt bleibt bei engem Platz intern erreichbar. Im kurzen Querformat darf die Seite vertikal scrollen, damit alle Bedienelemente erreichbar bleiben. Kein horizontaler Seitenüberlauf. Gleiches Fenster, gleiche Dockstellung und vorhandene Planwahl ergeben auch bei langen Vorjahresnamen dieselbe Rahmenhöhe. Der Schreibschutzhinweis bleibt dabei vollständig sichtbar.
- Der erste ISO-Aufruf zeigt das Dock offen. „Beetdetails“ öffnet und schließt es. Ein explizites Öffnen fokussiert die Überschrift. Schließen oder Escape aus dem Dock und seinem Auslöser führt zum Auslöser zurück. Native Dialoge und der bestehende Escape-Befehl zum Beenden des Verschiebemodus haben Vorrang. Die vorhandene SVG-Selektion und die Auswahlfelder bleiben zugänglich. Eine Auswahl auf der Zeichnung zieht das geschlossene Dock nicht automatisch auf. Nichtmodales Dock, eigener Scrollbereich, kein Fokusfang. Mindestens 44 × 44 CSS-px für zentrale Schaltflächen auf Touch.
- Die Dockstellung ist flüchtiger Ansichtszustand je geöffnetem Garten. Sie gilt vorwärts und rückwärts bei Datum, Planansicht und Karte → Beetplan. Schließen und Öffnen des Docks erhält die Auswahl, Eingaben und einen offenen Winkelentwurf. Historischer und aktueller Plan behalten ihre eigenen Auswahlen. Bei erstmaligem Betreten übernimmt der Rückblick eine vorhandene passende Streifen-ID. Wenn ein aktueller Streifen im früheren Plan fehlt, zeigt das Dock dessen Grundfläche, sofern vorhanden, und lässt die Streifenauswahl leer. Bei Rückkehr ist der aktuelle Streifen wieder gewählt. Bei Datum oder Manuellwahl bleibt der Schreibschutz vollständig erhalten.

## Geometrischer Sollfall

```text
offen                        geschlossen
┌────────────┬──────┬─┐       ┌───────────────────┬─┐
│     ●      │ Dock │K│       │         ●         │K│
└────────────┴──────┴─┘       └───────────────────┴─┘
● gleicher Bodenpunkt in neuer Zeichenflächenmitte; gleicher Maßstab
```

Die laufende ISO-Kamera verwendet in beiden Jahresansichten denselben Bodenfokus, dieselbe Blickrichtung und denselben Zoomfaktor. Öffnen und Schließen verändert den verfügbaren Ausschnitt und dessen Bildschirmmitte. Die Bildskalierung bezieht sich auf den bei gleicher Fenstergröße verfügbaren Bereich mit geschlossenem Dock. In einem schmaleren oder niedrigeren Ausschnitt bleiben damit bei gegebener Fenstergröße auch die CSS-Pixel pro Welteinheit gleich. Fenstergrößenwechsel dürfen die Darstellung neu einpassen. Nordmarke und Maßstab bleiben im sichtbaren Ausschnitt. Trefferkoordinaten und Winkelgriff stammen weiterhin aus der realen SVG-Transformation. Das Dock löst weder einen neuen Zeichenvorgang noch eine Speicherung aus.

## Unabhängige Abnahmekriterien

| Prüffall in Bagua | Beobachtbares Soll |
| --- | --- |
| Kamera bei Dockwechsel | Auf Osten drehen, zweimal zoomen, mit Zeiger verschieben. Vorher, offen, geschlossen und erneut offen den tatsächlichen CSS-Pixel-Mittelpunkt der nutzbaren SVG-Fläche per inverser `world.getScreenCTM()` auslesen. Bodenfokus stimmt innerhalb 0,00001 ISO-Koordinaten. Beim logischen Zoom und bei `a,b,c,d` der Bildschirmmatrix `world.getScreenCTM()` gilt bei gleicher Fenstergröße die Toleranz 0,000001. Kamera und Planwerkzeuge überschneiden sich nicht. |
| Sieben aktuelle / fünf historische Streifen | 2027 Fläche-10 mit fünf Streifen, Tomate und Ernte anlegen. 2028 mit sieben Streifen öffnen. Streifen 3 wählen, ungespeicherte Zahl und Winkel festhalten. Bei Datum oder manueller Planwahl bleibt Kamera, Rückblick zeigt historische Kultur und Ernte. Dort anderen Streifen wählen und Dock umschalten. Bei Rückkehr sind Streifen 3 und beide Felder erhalten. Erneute Rückkehr ins gleiche Vorjahr zeigt dessen letzte Wahl. Separater Fall für Streifen 7, der im Vorjahr fehlt. |
| Zeiger und Tastatur | Nach Größenänderung dieselben realen SVG-Geometrien per Zeiger und Enter auswählen. Im gedrehten Zustand Winkelgriff bedienen. Escape im Dialog, Verschiebemodus und Dock mit jeweiligem Fokusziel prüfen. Ein geschlossenes Dock emittiert keine fokussierbaren Felder. Planwahl, Tagesregler und Mondphase bleiben erreichbar. |
| Responsive | Chromium bei 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844 und 320 × 568 sowie kurzes Querformat. Desktop und Mobil mit geöffnetem und geschlossenem Dock, Rückblick mit langem Projektnamen, beide Farbmodi und Touch-Emulation prüfen. Zeichnung und Kamera bleiben sichtbar und nutzbar. |
| Daten und Regression | Von beiden Gartenrevisionen und Wiederherstellungspunkten vollständige Inhalte vor und nach den Ansichtsvorgängen vergleichen. Vorhandene Kamera-, Saison-, Streifen- und Geometrietests sowie Produktionsbuild ausführen. Der reguläre Kartenweg und die v1-Ansicht behalten ihr bisheriges Layout. |
