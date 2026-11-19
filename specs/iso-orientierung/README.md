# ISO-Beetplan · Maßstab und Dunkelmodus

**Fassung 1.1 · 19. November 2026.** Grundlage sind die beiden Nutzeraufnahmen, [§§ 6–7 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md) und die [ISO-Kamera](../iso-camera/README.md). Die Browserabnahme erfolgt auf einer getrennten Krautgaart-Kopie.

```text
┌────────────────── ISO-Zeichenfläche ────────────────────────┐
│                                                   ↗ N     │
│                                                           │
│                      ◇ Garten                             │
│                                                           │
│    ╲  geneigte Maßlinie                                   │
│     ╲                                                     │
│    20 m                     Legende                        │
└───────────────────────────────────────────────────────────┘
```

- **Maßstab auf der Bodenebene.** Die Maßlinie sitzt unten links und folgt der projizierten geografischen Ost-West-Achse der Zeichnung. Ihre Endstriche folgen der dazu senkrechten Bodenachse. Die Kamera projiziert beide Achsen bei allen Kompassstellungen und während des Drehens. Die beschriftete Meterstrecke entspricht der Länge der projizierten Linie einschließlich Zoom. Der Zahlenwert nutzt runde Abstufungen und bleibt in der Drehung bei gleicher Ansicht stabil. Die Beschriftung bleibt aufrecht. Der Nordpfeil zeigt weiterhin geografisch nach Norden und bleibt oben rechts.
- **Dunkelmodus.** Die freie Zeichenfläche verwendet den dunklen Hintergrund der vorhandenen App-Palette. Nordpfeil, `N`, Maßlinie, Endstriche und Meterzahl sind weiß. Die Legende erhält denselben Hintergrund und kontrastierenden Text. Im hellen Schema behalten Papier und Orientierung ihre bisherigen Farben. Die Farbregel gilt im Beetplan und Rückblick für „Schraffuren/Grün“ und „Luftbild“. Die Zeichnung des Grundstücks, seiner Pflanzen und das Luftbild verwenden ihre vorhandenen Farben.
- **Randbedingungen.** Bei Zoom, Verschieben, Dockwechsel und Wechsel in den Rückblick bleiben beide Orientierungshilfen am Rand der sichtbaren Zeichenfläche. Bei 320 und 390 px passen Maßlinie, Nordpfeil und Texthinweise in ihre Zeichenfläche. Ein Schemawechsel verändert weder Projektstand noch Kamera oder Auswahl.

```text
Schmale Ansicht
┌────────────────────────┐
│ Schraffuren/Grün   Luftbild │
│ Quellen oder Ladestatus    │
├──────── Zeichnung ──────┤
│   Garten          ↗ N  │
│ ╲ 10 m        Legende │
└────────────────────────┘
```

**Ergänzung nach der ersten Browserabnahme.** In schmalen Ansichten erhält die Untergrundleiste einen eigenen Bereich über der Zeichnung. Ihre tatsächliche Höhe richtet sich nach den Schaltflächen, dem Ladestatus oder den Bildquellen. Bei geöffnetem Dock verbleiben auch in einem kurzen Fenster mindestens 96 CSS-Pixel für die Zeichnung. Erforderlicher Mehrplatz kann vertikal erreicht werden. Der sichtbare SVG-Ausschnitt folgt seiner tatsächlichen Höhe, der Kamerazustand bleibt erhalten. Auf dem Desktop liegt die Leiste weiterhin am oberen linken Rand der Zeichnung und lässt die Nordmarke frei.

| Prüffall | Beobachtbares Soll |
| --- | --- |
| Winkel und Maß | N/O/S/W und Zwischenstand einer Vierteldrehung prüfen. Projizierter Ost-West-Vektor und Maßlinie sind parallel. Die aus der inversen Projektion abgeleitete Bodenstrecke stimmt mit der Meterangabe überein. Zoom liefert weiterhin eine korrekte Strecke in runden Stufen. |
| Hell und Dunkel | Mit beiden Untergründen prüfen, dass die freie Papierfläche und die Legende abdunkeln und Pfeil, `N`, Balken und Meterzahl weiß sind. Anschließend den vorherigen Hellzustand wiederherstellen. |
| Arbeitsfläche und Daten | 1440, 390 und 320 px mit Dock auf und zu, Zoom, Ansicht im Rückblick und Projekt-/Sicherungsvergleich. Die sichtbare Orientierung bleibt innerhalb der Zeichenfläche und gerät weder unter Leiste noch Legende. Bei 320 × 568 px mit Luftbild und offenem Dock verbleiben ≥96 CSS-Pixel Zeichnung, auch beim Wechsel zwischen Ladestatus und sichtbaren Quellen. Der gespeicherte Garten bleibt identisch. |
