# Aktueller Teststand · Saisonwerkzeuge finden

**Fassung 1.0 · 19. November 2026.** Grundlage sind die [Übergabe §§3–5](../../Season-by-Season-Uebergabe-aktualisiert.md), [Saisonprojekte und Mondphase](../season-projects/README.md) und [Variante B im Beetplan](../iso-randdock/README.md). Der Fall „Krautgaart“ wurde im laufenden regulären Planer untersucht. Das geöffnete Projekt war als „Ohne Hauptjahr“ gekennzeichnet. Die folgenden Regeln gelten für alle regulären Projekte.

```text
Beetplan · gespeicherter Garten ohne Saison
┌──────────────────────────────────────────────────────────┐
│ Saisonprojekte     Gartenname       Karte | Beetplan     │
│                                                          │
│ Zeichnung                               Anbau planen    │
├──────────────────────────────────────────────────────────┤
│ Ein Hauptjahr schaltet Saisonregler, Mondphase und        │
│ Erntejournal frei.                 [Hauptjahr einrichten]│
└──────────────────────────────────────────────────────────┘
                                 ↓
                           vorhandener Dialog
                     Hauptjahr [2026] [Hauptjahr speichern]
                                 ↓
                       Datum · Saisonregler · Mondphase
```

- Die verfügbare Einrichtung steht im unteren Saisonbereich, auch bei geschlossenen Beetdetails und bei 320–390 px Breite. Die Aktion öffnet denselben vorhandenen Dialog wie „Saisonprojekte“ und fokussiert nach dem Laden das Hauptjahr. Bei Abbruch kehrt der Fokus zur auslösenden Aktion zurück. Erst die ausdrückliche Hauptjahreswahl benutzt die bestehende Speicheroperation. Sie übernimmt weder eine fiktive Ernte noch eine rückwirkende Vorjahreszuordnung. Anschließend steht das Datumsfeld oder der Regler im Fokus. Ältere v2-Gärten ohne Jahr bleiben normal bearbeitbar. Der getrennte v1-Altbestand bleibt schreibgeschützt.
- Aktive Saisonwerkzeuge bleiben am vorgesehenen unteren Rand. Beim Wechsel Beetplan → Karte → Beetplan im selben geöffneten Garten bleiben das gewählte Datum und die Einstellung der Planansicht erhalten. Die laufende Wiedergabe stoppt beim Verlassen des Beetplans. Neues Öffnen oder neues Saisonprojekt beginnt mit dem vorhandenen Standarddatum. Rückblick bleibt an ein ausdrücklich verknüpftes Vorjahr gebunden.
- Die bestehende Grundflächenauswahl erklärt im Kontext, wie ein noch ungeklärter Bereich auf der Karte als Beet oder Anbaufläche planbar wird. Bei einer planbaren, unbelegten Fläche bzw. einem gewählten unbelegten Streifen steht der kurze Pfad zu Anbaudaten bei der Kulturaktion. Schrift, Platz und Sperren folgen Variante B. Geometrien, gespeicherte Pflanzen- und Erntedaten sowie Exportformate behalten ihre fachliche Bedeutung.
- Ein frisch gebauter regulärer Planer läuft lokal auf Port 5174 als eigener Teststand. Dort startet die Gartenliste leer und der Nutzer kann einen neuen Garten zeichnen oder die vorhandene Bagua-Vorlage bewusst laden. Der bisherige Browserstand auf Port 5173 bleibt separat. Eine kurze Prüfreihenfolge benennt die Voraussetzungen für Saison, Details, Ausgabe und Rückblick.

| Abnahmefall | Soll |
| --- | --- |
| Älterer v2-Garten | Einen gespeicherten Bagua-Stand ohne Hauptjahr öffnen. Einrichtung sichtbar ohne Dock. Öffnen und Abbruch per Tastatur bei 390 px, entspannter Desktoplauf und schmaler Zustand bei 320 px. Abbruch belässt Revision und Daten unverändert. |
| Neue Saison und Orientierung | Aus dem bestehenden Dialog das Hauptjahr 2027 ausdrücklich speichern. Vollmond am 20.05.2027 im Luxemburger Garten prüfen. Beim Kartenrückweg Datum, Mondphase und gewählte Planansicht vergleichen. Wiedergabe, Tageswechsel und Rückblick müssen funktionieren. |
| Vollständige Prüfkette | Auf der regulären Karte von leerem Projekt zu Bagua, Grenze/Wege, Bestands- und Flächentypen. Im Beetplan Streifen anlegen, Kultur/Sorte, Anbaudaten, Ernte, Folgeprojekt und Rückblick. Kamera, Bilduntergrund, Druck, Excel und Sicherung prüfen. Gebündelten Teststand mindestens einmal über die reguläre Oberfläche durchspielen. |
| Isolation und Daten | Produktionsbuild erfolgreich. Getrennte Browser-Origin enthält vor der Vorführung keine gespeicherten Gärten. Setup und Prüfung verwenden isolierte Playwright-Kontexte. Ein bestehender Datensatz erhält durch bloßes Öffnen oder Abbruch keine Revision. Alte Vorlagen und Speicheroperationen bleiben kompatibel. |
