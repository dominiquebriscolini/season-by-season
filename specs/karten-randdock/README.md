# Variante B in der regulären Kartenansicht

**Fassung 1.0 · 19. November 2026.** Maßgeblich sind [§2 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md), die [verbindliche Flächenpartition](../../PLAN.md#verbindliche-flächenpartition), [Variante B](../visual-design-audit-01/README.md#b--zeichentisch-mit-randdock) und die [ISO-Umsetzung](../iso-randdock/README.md). Die Änderung betrifft Rahmen, Platz und Erreichbarkeit des vorhandenen regulären Karteneditors. Weg- und Bestandslogik, Geometrie, Speicherstruktur und der eigenständige Wegversuch behalten ihren bestehenden Stand.

```text
Breit                                           Kompakt
┌───────────────────────────────────────────┐    ┌────────────────────────┐
│ Gartenname · Karte / Beetplan · Aktionen  │    │ Gartenname · Ansichten │
│ Weltkarte · Kartenausschnitt · Vorlagen   │    │ Weltkarte · Quellen    │
├──────────────────────────┬──────────┬─────┤    ├────────────────────────┤
│                          │ Karten-  │ +   │    │ Bagua-Orthofoto        │
│     Bagua-Orthofoto      │ details  │ −   │    │ Auswahl · Quellenlink  │
│     mit Auswahl        │ Breite   │ Pan │    ├────────────────────────┤
│     und Quellenlink      │ Bestand  │ ▣   │    │ + − Pan ▣ Kartendetails│
│                          │ scrollbar│ ☷   │    │ [Kartendetails optional]│
├──────────────────────────┴──────────┴─────┤    ├────────────────────────┤
│ Wegenetz zeichnen / Weggeometrie bearbeiten│   │ Phase 1 · Phase 2       │
│ Werkzeuge · letzten Punkt / abschließen   │    │ Werkzeuge umbrechen    │
│ Status und Speicherstand                  │    │ Letzten Punkt / fertig │
└───────────────────────────────────────────┘    │ Zeichen-/Speicherstatus│
                                                 └────────────────────────┘
```

## Anordnung und Bedienung

- Dieselbe kompakte Kopfzeile wie im Beetplan zeigt Gartenname, Karten- und Beetplanwechsel sowie die vorhandenen Gartenaktionen. Die Kartenquellen erhalten eine eigene schmale Zeile. Weltkarte, örtliche Ausschnitte, Vorlagen und beim Weltgarten Straßenkarte/Luftbild verwenden die vorhandenen Bedienelemente samt Attribution, Fehlertext und Fokus. Die Zeichenfläche nutzt den verfügbaren Raum. Auf breiten Schirmen stehen Kartennavigation an der rechten Kante und Kartendetails daneben. Auf Tablet und Mobil stehen Navigation und Kartendetails unter der Karte. Die bestehende Hell-/Dunkelpalette gilt für die Arbeitsoberfläche. Orthofoto und Geometriezeichnung behalten ihre Farben.
- Die Kartenwerkzeuge liegen am unteren Rand. „Wegenetz zeichnen“ und „Weggeometrie nachbearbeiten“ stehen unabhängig vom Detaildock zur Verfügung. Zeichen-, Korrektur- und Bestandswerkzeuge sind bestehende Textaktionen. In kompakten Ansichten bilden sie bis zu drei flexible Spalten mit Umbruch innerhalb der Beschriftungen. „Letzten Punkt löschen“ und „Zeichnung abschließen“ haben bei aktiver Zeichnung einen festen Platz außerhalb der Werkzeuggruppe. Der Platz bleibt bereits vor dem ersten Punkt reserviert. Die Bedienelemente sind mit sichtbarem Fokus und per Zeiger oder Berührung erreichbar. Auf Touch messen die primären Werkzeuge mindestens 44 × 44 CSS-Pixel.
- „Kartendetails“ schaltet das nichtmodale Dock mit Wegbreite, ausgewähltem Weg sowie Flächen, Objekten und Hüllen. Das Dock startet offen, bleibt beim Schließen intern erhalten und kann unabhängig vom Zeichenzustand wieder geöffnet werden. Sein Inhalt scrollt vertikal. Öffnen fokussiert den Titel. Schließen liefert den Fokus zum Auslöser zurück. Escape innerhalb des Docks oder am Auslöser schließt es ohne aktiven Entwurf. Bei aktivem Entwurf hat der bestehende Editorabbruch Vorrang. Enter und die beiden Entwurfsaktionen behalten ihre bisherigen Wirkungen. Schließen ändert weder Auswahl noch Entwurf. In sehr kleinen Hochformaten und kurzem Querformat ist vertikales Seitenscrollen zulässig. Kein horizontaler Seitenüberlauf.
- Der vorhandene Map-ResizeObserver hält den Kartenmittelpunkt und Bildpixel pro CSS-Pixel beim Ein- und Ausklappen. Der Ausschnitt wird um diesen Mittelpunkt größer oder kleiner. Die Zeichenaktion speichert weiter Bildkoordinaten aus der tatsächlichen SVG-Matrix. Die Karte springt beim ersten Zeichenpunkt durch das Erscheinen der Entwurfsaktionen nicht. „Grundstück einpassen“ bleibt die ausdrückliche Aktion für eine neue Einpassung.

## Unabhängige Abnahme in Bagua

| Fall | Erwartung |
| --- | --- |
| Mobilreproduktion | Chromium bei 1440 × 900, 768 × 1024, 390 × 844 und 360 × 780. Zusätzlich 320 × 568 und kurzes Querformat als Randfälle. Zeichnen, Nachbearbeiten, aktiver Entwurf und geöffneter Bestand passen ohne horizontalen Seitenüberlauf. Der reale Zeiger bzw. die echte emulierte Berührung erreicht „Objektumriss zeichnen“, „Fläche auswählen“ und „Zeichnung abschließen“. Die Karte bleibt bei 360 und 390 px mit geöffneter Bearbeitung benutzbar. |
| Wegzeichnen und Nachbearbeitung | Bagua auswählen und Grenze plus eine vor dem Rand endende Wegachse zeichnen, bei aktiver Zeichnung einen Punkt zurücknehmen und mit Enter oder der sichtbaren Aktion abschließen. Reale Breite und gestrichelte virtuelle Trennlinien prüfen. Im Bagua-Vorlagennetz vier ungeklärte Grundflächen prüfen. Weg auswählen und eine metrische Breite bearbeiten. Klassifikation ändert die ID und die Grenzen der Grundfläche nicht. |
| Bestand und Bilanz | In Bagua ein Beet und einen Weg erkennen. Baum oder Hecke, Schuppen sowie Gewächshaus einzeichnen bzw. bearbeiten. Vegetation erhält die verfügbaren Flächen. Zwei überlappende Schuppen ziehen die überdeckte Nettofläche nur einmal ab. Das Ausblenden der Gewächshaushülle erhält die bepflanzbare Fläche. Wegachsen und die fachlich weiter zuordenbaren IDs bleiben erhalten. |
| Dock und Daten | Bei realem Zeigerzug oder aktivem Entwurf das Dock schließen und wieder öffnen. Kartenmittelpunkt, CSS-Maßstab, Punkte, Auswahl und Speicherzustand vergleichen. Nach der fachlich beabsichtigten Bearbeitung Testgarten speichern und wieder öffnen. Vollständige Gartenrevision und Wiederherstellungspunkt vor und nach reinen Ansichtsaktionen vergleichen. |
| Regression | Bestehende Integrations-, Weltkarten-, Bestands- und Geometriefälle sowie den Produktionsbuild ausführen. Rückkehr aus dem Beetplan zeigt die reguläre Karte. Die eigenständige Versuchsroute behält ihren bisherigen Arbeitsrahmen. |
