# Krautgaart · Vier Bedienverbesserungen

**Fassung 1.0 · 19. November 2026.** Grundlage sind [§§2–3 und 6–7 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md), die [Flächenpartition](../../PLAN.md#verbindliche-flächenpartition) und die [ISO-Kamera](../iso-camera/README.md). Die Browserprüfungen verwenden eine lokale Prüfkopie von „Krautgaart“. Der gespeicherte Nutzergarten bleibt beim Prüfen unberührt.

```text
Gemeinsamer Kopf · Karte und Beetplan
Gartenname                 Karte | Beetplan       [Farbschema ◐]  Aktionen
Farbschema öffnet: System | Hell | Dunkel

Karte · Wegenetz zeichnen
Wegachse zeichnen → Punkte → Enter schließt → Enter startet neue leere Achse

Beetplan · Kamerafläche
Mauszeiger ● → Rad vor/zurück → dieselbe Bodenstelle unter ●

Beetdetails
Grundfläche [ Beet · Fläche-47 ▾ ]
Beet · Fläche-47
Name der Fläche [ Kräuterbeet ] [ Flächenname speichern ]
                       ↓
Beet · Kräuterbeet                    Flächen-ID weiterhin Fläche-47
```

- **Farbschema.** „Farbschema“ steht in der gemeinsamen Kopfleiste auf Karte und Beetplan. Mobil hat es ein benanntes Symbol mit einem Ziel von mindestens 44 × 44 CSS-Pixeln. Die Auswahl bietet System, Hell und Dunkel, weist die aktive Wahl aus und gilt sofort für beide Oberflächen. Feldfarben, Orthofoto und ISO-Papier behalten ihre fachliche Darstellung. „System“ ist der Startwert, sofern im Browser keine Auswahl gespeichert ist. Die Auswahl ist eine Browserpräferenz. Escape und Schließen führen zum Auslöser zurück. Bei 320 und 390 px bleibt die Kopfzeile ohne horizontalen Überlauf benutzbar.
- **Wegachsen.** Enter schließt wie bisher einen gültigen Achsentwurf ab. Ein anschließendes Enter im Zeichenbereich oder bei Fokus auf der Karte reaktiviert „Wegachse zeichnen“ mit leerem Entwurf. Eine anhaltend gedrückte Taste löst keine Wiederholung aus. Ein unvollständiger Entwurf zeigt den vorhandenen Hinweis. Escape, eine andere Bearbeitungsphase, ein anderes Zeichenwerkzeug oder ein neu geöffneter Garten setzen die Wiederholung zurück. Eingaben, Dialoge und native Schaltflächen behalten ihre eigenen Tastaturaktionen. Der Start einer neuen leeren Achse schreibt noch keine Wegdaten.
- **ISO-Mausrad.** Über der ISO-Zeichnung vergrößert bzw. verkleinert das Rad mit der Empfindlichkeit des Kartenzooms. Bei gleicher Fenstergröße bleibt der Bodenpunkt unter dem Zeiger beim Zoomen erhalten, auch bei gedrehter Ansicht. Die vorhandenen Zoomgrenzen, der jeweils geöffnete Garten und dessen Kamerapräferenz gelten fort. Die Plus-/Minustasten arbeiten weiter um die Zeichenflächenmitte. Außerhalb der Zeichnung bleibt das Rad für den üblichen Scrollvorgang verfügbar. Die Zoomfunktion des Browsers per Strg/Ctrl bleibt verfügbar.
- **Flächenname.** Im aktuellen Beetplan erhält eine ausgewählte Fläche vom Typ Beet oder Anbaufläche ein editierbares Namensfeld. Speichern ersetzt nur den sichtbaren Namensteil in Auswahl und Beetdetails. Leeren und erneutes Speichern stellt die Anzeige der bisherigen Flächen-ID wieder her. Namen sind pro stabiler Fläche gespeichert, maximal 80 Zeichen, mit entfernten Rand-Leerzeichen. Flächentyp, Flächen-ID, Wege, Geometrie und Streifen-/Kulturbezüge bleiben erhalten. Das Namensspeichern darf offene Streifen- und Kulturentwürfe nicht verwerfen. Altstände ohne Namen zeigen weiterhin die ID. Folgesaisons übernehmen die Namen vom kopierten Grundstück, auch wenn ohne Streifen gestartet wird. Der verknüpfte Rückblick zeigt den jeweiligen gespeicherten Namen schreibgeschützt. Ausgabe und Kartenklassifikation behalten ihre ID-basierten Kennungen.

| Prüffall | Soll in „Krautgaart“ |
| --- | --- |
| Farbschema | Unter entgegengesetzter Systempräferenz Hell und Dunkel erzwingen. Zwischen Karte und Beetplan wechseln und neu öffnen. Das Dialogfeld, die Kopfzeile und die gewählte Einstellung bleiben bei 390 und 320 px erreichbar. |
| Achsfolge | Auf einer Prüfkopie per Zeiger zwei Punkte setzen. Enter schließt die Achse. Zweites Enter startet im Zeichenschritt mit leeren Punkten, drittes Enter nach zwei neuen Punkten erzeugt eine zweite selbstständige Achse. Esc, Eingabefeld, Tastenwiederholung und ungültiger Entwurf erzeugen keine weitere Achse. |
| Mausrad | In der Ostansicht außerhalb der Mitte rein- und rauszoomen. Inverse Bildschirmmatrix vor/nach jedem Schritt vergleicht die Bodenkoordinate. Auswahl, Richtung, Gartenrevision und Wiederherstellungspunkt bleiben dabei gleich. |
| Flächenname | Ein vorhandenes Beet auswählen, benennen und wieder öffnen. Im Label bleibt der Typ „Beet“. Identische Geometrie und IDs mit neuer optionaler Namensangabe nachweisen. Offenen Unterteilungsentwurf beim Speichern prüfen. JSON-Import, leeres Feld, bestehende namenlose Stände und verknüpfter schreibgeschützter Rückblick bleiben kompatibel. |
