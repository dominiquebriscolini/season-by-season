# Zyklus 02 · ISO-Auswahl und gespeicherte Gärten

Referenz sind [Schritt 4](../step-4/README.md), [Zyklus 01](../cycle-01/README.md) und [Übergabe §§2–3](../../Season-by-Season-Uebergabe-aktualisiert.md). Die vorhandene Bibliothek behält ihre Funktionen.

```text
Karte mit Entwurf oder ISO mit Auswahl
    ↓ Gespeicherte Gärten
[ Dialog · Zurück zum Garten · gespeicherte Gärten · Sicherungen ]
    ↳ Zurück oder Escape → dieselbe Ansicht und derselbe Arbeitsstand
    ↳ Ersetzende Aktion → bei offenen Änderungen Rückfrage
        ↳ Abbrechen → Dialog und Arbeitsstand bleiben erhalten
        ↳ Bestätigen → bewusst gewählten Garten oder Altstand öffnen
```

- Nach Auswahl per Tastatur bleibt der Fokus am gleichnamigen Auswahlfeld „Grundfläche“ oder „Streifen“. Weitere Pfeiltasten und Tab funktionieren. Plan und Formular zeigen dieselbe Auswahl. Bei Auswahl direkt in der Zeichnung bleibt deren Fokusführung erhalten.
- „Gespeicherte Gärten“ öffnet die Liste als Dialog über dem aktuellen Arbeitsstand. Beim Öffnen und Schließen erfolgen weder Speicherung noch Verwerfen-Rückfrage. Die Rückkehr erhält auch eine laufende Zeichnung und eine ausgewählte ISO-Parzelle mit aktuellen Formularwerten. Der Dialog erhält den Fokus, Escape schließt den Dialog und kehrt zum Auslöser zurück.
- Nur das bewusste Öffnen eines Eintrags, Neuanlegen, Importieren, Wiederherstellen oder Öffnen der Altansicht kann den aktuellen Garten ersetzen. Für ungespeicherte Änderungen gilt die bestehende Verwerfen-Rückfrage. Wiederherstellen behält zusätzlich die bestehende Bestätigung. Ein abgewiesener Wechsel oder ungültiger Import erhält den Arbeitsstand, und ein Export aus der Bibliothek lässt ihn geöffnet. „Garten schließen“ bleibt die ausdrückliche Aktion zum Verlassen.

**Abnahme im Browser.** In Bagua Grundfläche und Streifen wiederholt per Tastatur wählen und mit Tab weitergehen. Die Bibliothek aus Karte mit zwei ungespeicherten Wegpunkten und aus ISO mit ausgewähltem Streifen öffnen und schließen. Nach Abbruch eines Wechselversuchs beide Arbeitsstände wiederfinden. Einen anderen gespeicherten Garten ausdrücklich öffnen. Bibliothek öffnen, zurückkehren und Datenbankrevisionen vergleichen. Die bestehende Integration einschließlich Speichern, Öffnen und Wiederherstellen erneut prüfen.
