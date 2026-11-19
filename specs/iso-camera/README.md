# ISO-Kamera mit festem Blickwinkel von oben

Grundlage sind [Übergabe §7](../../Season-by-Season-Uebergabe-aktualisiert.md) und die [freie Streifenrichtung](../strip-angle/README.md).

```text
Beetplan
  Kompass    [N] [O] [S] [W]     ← Vierteldrehung →
  Ausschnitt [−] [+] [Verschieben]
  Skizze     Bodenpunkt in Bildmitte bleibt beim Drehen dort
             Auswahl, Entwurf und Winkel bleiben am gewählten Beet
```

- N, O, S und W sind direkt wählbar. N verwendet die bisherige Ausgangsansicht. Zwei Pfeile wechseln je eine Vierteldrehung. Die Nordmarke in der Skizze zeigt weiterhin geografisch nach Norden. Die horizontale Bodenebene wird um eine vertikale Achse gedreht. Die bisherige ISO-Neigung bleibt fest. Eine Vierteldrehung dauert etwa 0,5 s, die direkte Gegenrichtung etwa 1 s. Der Wechsel nimmt den kürzeren Bogen. Reduzierte Bewegung schaltet direkt um.
- Der Fokus ist der Bodenpunkt in der Bildmitte. Die Zoomtasten ändern den Maßstab um die Bildmitte. Der Modus „Verschieben“ erlaubt es, einen anderen Bodenpunkt in die Mitte zu holen. Beim Drehen ändern sich weder Fokus noch Zoomfaktor. Die Grundfläche, Streifenauswahl und offenen ISO-Eingaben bleiben erhalten. Tastaturfokus auf dem betätigten Kamerabedienelement bleibt erhalten.
- Kameraeinstellungen sind Ansichtszustand des offenen Gartens, auch nach einem kurzen Wechsel zur Karte. Die Drehung schreibt keine Gartenrevision oder Sicherung. Der gespeicherte Winkel bleibt ein Kompasswinkel in Bodenkoordinaten. Der Drehgriff und die Vorschau richten sich auch nach einer Kameradrehung nach der Bodenebene aus.

**Browserabnahme.** Bagua mit gespeicherten 37,25°, ausgewähltem Streifen und offenem Winkelentwurf. Vergrößern, Ausschnitt verschieben, alle Richtungen und Pfeile betätigen. Den Bildpunkt des Bodenfokus, den Zoomfaktor, die unveränderten gespeicherten Datensätze und die Streifenauswahl vergleichen. Einen Zug am Streifengriff in einer gedrehten Ansicht prüfen. Auch kurze Gegenrichtungsanimation, reduzierte Bewegung und schmale Ansicht prüfen.

## Ansicht je Garten wieder öffnen

```text
Kompass wählen, zoomen oder verschieben → Ansicht für diese Garten-ID merken
Garten schließen → wieder öffnen → Beetplan zeigt den gemerkten Ausschnitt
Anderer Garten → eigene Ansicht oder Ausgangsansicht
```

Gespeichert werden Kompassziel, Mittelpunkt und Zoom im lokalen Browserspeicher. Auch ein Schließen während der Drehung merkt die gewählte Kompassrichtung. „Verschieben“ ist ein Werkzeugmodus und startet nach dem Öffnen ausgeschaltet. Gartenrevision, Sicherung, Streifenwinkel und gespeicherte Startseite bleiben von der Kameraansicht unabhängig. Ein neuer Garten oder eine als eigener Garten importierte Sicherung beginnt mit der Ausgangsansicht. Fehlende oder ungültige Ansichten verwenden dieselbe Ausgangsansicht.

**Browserabnahme.** Bagua nach Osten drehen, zoomen und verschieben. Schließen, erneut öffnen und den Kameratransform vergleichen. Einen zweiten Garten mit anderer Ansicht öffnen und zurückwechseln. Neu laden, den Garten wieder öffnen und die Ansicht vergleichen. Vollständige Garten- und Sicherungsrecords müssen identisch bleiben.
