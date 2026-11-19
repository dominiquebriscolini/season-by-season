# Unabhängige Produkt- und UX-Abnahme · Karte und Beetplan

Früherer Prüfbericht. Das Urteil bezieht sich auf den damaligen Versuchsauftrag. Den Abgleich mit der verbindlichen Geometrie- und Bestandsentscheidung führt der [Entwicklungsplan](../../PLAN.md#ist-abgleich-mit-2).

Geprüft am 19. November 2026 in einer eigenen Chromium-Sitzung mit Playwright. Der Reviewer war an der Korrektur und an den Review-Regeln unbeteiligt. Maßstab waren die verbindliche Übergabe (§2 Bestandsanalyse und Wechsel zur ISO-Ansicht, §§3–5 Projekte und Anbau, §§9–10 Prüffälle und offene Detailfragen), der lokale Stand in PLAN.md und der Auftrag für das isolierte Wegexperiment.

| Prüffall | Beobachtung | Urteil |
| --- | --- | --- |
| Wegexperiment · Bagua-Vorlage, Wegenetz zeichnen | Die Karte zeigt das Wegnetz. Die Standardbreite ist verfügbar, individuelle Breiten erscheinen erst in der Nachbearbeitung nach Auswahl einer Achse. | Entspricht dem beauftragten Ablauf und §2. |
| Wegexperiment · Bestand prüfen und Geometrie korrigieren | Eine Restfläche als „Beet“ klassifiziert, eine Abschnittsbreite auf 85 cm gesetzt und einen eigenen Gehölzumriss gezeichnet. Der JSON-Export enthielt dieselbe Bezeichnung und ID für die betroffene Restfläche, den neuen Gehölzumriss, eine verbundene Wegfläche und vier Restflächen. In den geprüften Kartenphasen und bei der Bearbeitung des neuen Objekts gab es keine Kultur-, Sorten- oder Belegungssteuerung. | Der festgestellte Verstoß ist behoben. „Objekttyp im Bestand“ beschreibt eine vorgefundene Fläche gemäß §2. |
| Reguläre Karte · Tandel, Grundstück, Luftbild, Konturen | Sieben Eckpunkte und Enter ermöglichten die Auswertung. Mit zwei Punkten ließ sich die Grenze nicht abschließen. Handumrisse und IoU erschienen als Vergleich nach der Auswertung. Der Übergang „Zum Beetplan“ übernimmt den überprüften Stand. Auf der Karte blieb die Kultursteuerung verborgen, auch bei Rückkehr aus dem Plan. | Bestandsfunktionen sind der Karte zugeordnet. IoU und Handumrisse sind dokumentierte Prüfmittel für den lokalen Beispielgarten und im Umfang dieses Prototyps vorgesehen. |
| Regulärer Beetplan · Belegung, Rückkehr und Wiederanlauf | „Zum Beetplan“ öffnete die isometrische Ansicht. Erst nach Auswahl von „Beet 1“ erschien die Kultursteuerung. „Möhre“ blieb nach Speichern, Neuöffnen und erneuter Luftbildauswertung erhalten. Ein absichtlich unlesbarer lokaler Haupteintrag wurde in der Prüfsitzung aus der Sicherung wiederhergestellt. „Gespeicherten Garten öffnen“ führt direkt in den Beetplan. | Kulturzuweisung und Wiederanlauf entsprechen dem vereinbarten lokalen Nutzerweg (§2, §5). |

**Weitere Einordnung.** Im geprüften Funktionsumfang ist keine weitere Fehlplatzierung aufgefallen. Der lokale Einstieg zum letzten Garten folgt dem in PLAN.md dokumentierten Tandel-Ablauf. Das Mehrprojektmenü gehört nach §3 in die ISO-Ansicht und bleibt eine spätere Etappe. Eine durchsuchbare Pflanzenbibliothek, Anbauhistorie und ausgearbeitete Saisonfunktionen gehören ebenfalls zu späteren Etappen.

**Abnahme.** Produktabnahme für die Korrektur bestanden. Die Abnahme umfasst Tandel im regulären Prototyp und Bagua im isolierten Experiment. Die wiederholbare technische Prüfung der Bedienoberfläche befindet sich im Browser-Prüfskript.

[Aktualisierte Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md) · [Projektplan](../../PLAN.md) · [Browser-Prüfskript des Experiments](browser-check.js) · [Regulärer Tandel-Prüfpfad](../../scripts/review-flow.js)
