# Zyklus 05 · Älteren ISO-Entwurf vergleichen

Grundlage sind [Schritt 4](../step-4/README.md), [Zyklus 03](../cycle-03/README.md) und [Zyklus 04](../cycle-04/README.md).

```text
Beetplan · neuere Gartenrevision
Unterteilung der Grundfläche | Älterer Entwurf | Gespeichert
  Unterteilung übernehmen / verwerfen
Kultur der Grundfläche oder des Streifens | Älterer Entwurf | Gespeichert
  Kultur übernehmen / verwerfen
```

- Die Prüfung zeigt nur im Entwurf vorhandene Teile und deren aktuellen Gegenwert. Der Nutzer kann jeden Teil ausdrücklich übernehmen oder verwerfen. Der übrige Entwurf bleibt auch nach Neuladen prüfbar. Bereits gleiche Werte lassen sich ohne neue Revision erledigen.
- Die Übernahme speichert nach Bestätigung mit der bisherigen Revisionsprüfung. Ändert die übernommene Unterteilung die belegten Streifen, nennt die Rückfrage die Archivierung der aktuellen Belegungen. Archivierung und Abgleich verwenden die bisherigen Planungsregeln.
- Ein fehlendes oder unbrauchbares Ziel bleibt lesbar und verwerfbar. Die Kultur eines Streifens benötigt dieselbe Flächen-ID, Streifendefinition und Basis-/Netto-Geometrie. Fehlt ein Vergleichswert oder hat er sich geändert, bleibt die Kultur gesperrt. Die Übernahme einer Unterteilung wendet einen separat offenen Kulturvorschlag erst nach gesonderter Entscheidung an.
- Reines Anzeigen, Abbrechen und Verwerfen verändern die gespeicherte Revision oder Sicherung nicht. Ein weiterer Schreibkonflikt bewahrt den Entwurf und wird angezeigt.

**Browserabnahme.** Bagua in zwei Tabs mit gegensätzlicher Streifenkultur und offener Unterteilung prüfen. Vergleich lesen, Vorgang abbrechen, eine Kultur gezielt übernehmen, die restliche Unterteilung nach Reload vergleichen und verwerfen oder übernehmen. Auch veränderte Streifendefinition, fehlendes Ziel und einen neueren Schreibkonflikt prüfen.
