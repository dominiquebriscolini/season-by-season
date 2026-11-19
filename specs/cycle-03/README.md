# Zyklus 03 · ISO-Entwurf und Auswahlwechsel

Es gelten die [Flächen- und Planungsregeln aus Schritt 4](../step-4/README.md) und die [Fokus- und Dialogregeln aus Zyklus 02](../cycle-02/README.md).

```text
Beetplan · Grundfläche / Streifen · ungespeicherte Eingaben
  Karte ↔ Beetplan  → dieselbe Auswahl und Eingaben, sofern weiter nutzbar
  anderes Ziel    → Rückfrage, falls Eingaben verloren gingen
                    Abbrechen: Auswahl, Werte und Fokus behalten
                    Verwerfen: zum gewählten Ziel wechseln
```

- Anzahl, Richtung und Kultur bleiben im laufenden Garten erhalten. Navigation speichert allein keine ISO-Eingaben. Der Beetplan zeigt nach einer Kartenbearbeitung die aktuelle Geometrie. Der Entwurf bleibt an seinen IDs und wird keiner anderen Fläche zugewiesen. Ist das Ziel nicht verfügbar, zeigt ISO dies an, hält den Entwurf fest und erlaubt bewusstes Verwerfen. Der normale Schutz beim Ersetzen oder Schließen des Gartens gilt auch von der Karte aus.
- Grundflächen- und Streifenwechsel in der Liste sowie in der Zeichnung prüfen denselben Entwurf. Eine unveränderte Auswahl und ein Wechsel ohne Entwurf brauchen keine Rückfrage. Nach Abbruch stimmen Liste, Skizze und Formular weiterhin überein. Die Tastaturführung aus Zyklus 02 gilt weiter.
- Unterteilung und Kultur behalten ihre vorhandenen Aktionen zum Speichern. Eine Kulturänderung, die durch Anwenden einer neuen Unterteilung nicht übernommen werden kann, verlangt ebenfalls eine Rückfrage.

**Browserabnahme.** In Bagua Anzahl, Richtung und Kultur ändern, mehrfach Karte ↔ Beetplan wechseln und Werte, Identitäten sowie unveränderte Revision prüfen. Grundfläche und Streifen per Tastatur und Zeichnung zu wechseln versuchen. Abbruch erhält Auswahl und Werte, Bestätigung gibt die alte Eingabe auf. Eine Karte mit weiterhin kompatibler Fläche und eine ausgefallene Fläche prüfen. Bei offenem ISO-Entwurf auf der Karte Garten schließen und abbrechen.
