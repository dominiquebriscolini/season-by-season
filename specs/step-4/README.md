# Schritt 4 · Gartenaufnahme und ISO

Maßgeblich sind die [Übergabe §§2–3, 5 und 9](../../Season-by-Season-Uebergabe-aktualisiert.md) und die [verbindliche Flächenpartition](../../PLAN.md#verbindliche-flächenpartition). Für die Darstellung dient der bereits geprüfte [Bagua-Nutzerweg](../../experiments/way-guided/bagua-bestand.png) als Referenz.

```text
Regulärer Einstieg
  ├─ Garten neu → Karte leer → Grenze → Achsen und Breiten
  │                             ↓
  │               reale Wegpolygone + virtuelle Schnitte
  │                             ↓
  │               Grundflächen + Bestand → Speichern → ISO
  │                     ↑                               ↓
  │                     └──────── Karte ←──── Streifen und Kulturen
  ├─ Gespeicherten Garten öffnen → ISO ↔ Karte
  └─ Vorhandenen v1-Garten öffnen → gekennzeichnete Altansicht und Sicherung
```

Auf der Karte bleiben die geprüften Zeichen-, Auswahl- und Korrekturwerkzeuge erhalten. Grundflächen werden über Achsen, Breiten und virtuelle Trennrichtungen korrigiert. Eine Typwahl ändert nur den Typ. Gezeichnete Mittellinien puffern metrisch, gestrichelte Trennlinien bleiben flächenlos. Gebäude mindern nur die Netto-Geometrie. Bäume, Hecken und ausblendbare Hüllen bleiben eigene Objekte. Die Aufnahme bietet keine Kulturzuweisung.

Der Einstieg verwendet die vorhandenen lokal georeferenzierten Kartenausschnitte. Bagua startet leer, die bekannte Vorlage ist ausdrücklich wählbar. Eine neu gezeichnete Grenze ist ein eigener Garten. In der bestehenden ISO-Ansicht werden die tatsächlichen Netto-Polygone mit Löchern übernommen. Beete und Anbauflächen sind bepflanzbar. Für Unterteilungen wählt der Nutzer Richtung und Anzahl, dann einen Streifen. Die Streifen werden in gleich breiten Bändern an der Feldrichtung geschnitten und können durch Aussparungen mehrteilig sein. Änderungen mit uneindeutiger Zuordnung bleiben prüfbar, einschließlich bisheriger Anbauzuweisungen.

v1 bleibt separat lesbar und exportierbar und wird nie automatisch anhand von Bild- oder Kontur-IDs zugeordnet. Überlappende Altbeete bleiben als Altstand erkennbar. Neue Gärten schreiben in einen getrennten lokalen Bestand mit Wiederherstellungspunkt und atomarer Revisionsprüfung. Ein älterer Tab erhält bei Konflikt eine verständliche Meldung und behält seinen Entwurf. Sicherungen enthalten die vollständigen Daten. Vor Eingriffen in v1 müssen Original und vorhandene Sicherung lesbar exportiert sein.

## Abnahme

| Fall | Soll |
| --- | --- |
| Neuer Garten | Leere Karte. Grenze und Achsen benutzbar. Ohne Weg genau eine Grundfläche. Reale Wege und Grundflächen ergeben gemeinsam die Grundstücksfläche ohne Überlappung. |
| Bagua und Vierarmfall | Bagua-Vorlage nur auf Wunsch. Vier offene Arme ergeben vier Außenflächen, ein geschlossenes Zentrum eine fünfte. Virtuelle Korrektur verändert keine realen Wegflächen. |
| Bearbeitung und Bestand | Typwahl ändert keine Geometrie. Eindeutiger Breitenwechsel behält IDs und Kultur. Mehrdeutigkeit bleibt sichtbar. Überlappende Gebäude zählen einmal, Geometrie und IDs bleiben erklärbar. Hülle ausblendbar, ihre Nutzfläche bleibt. |
| Karte → ISO → Wiederöffnung | Grundflächen sind in ISO auswählbar. Sieben Streifen liegen in der Feldgrenze und außerhalb von Baukörpern. Zwei Streifen können unterschiedliche Kulturen erhalten. Nach Schließen und Öffnen stimmen Daten, IDs und Geometrie überein. |
| Speicherung | Zweiter Tab überschreibt keine neuere Revision. Archivierte v1-Daten mit Überlappung und Kultur werden bytegenau erhalten. Eine vollständige Sicherung wird tatsächlich wiederhergestellt und im Browser geöffnet. |
| Pflanzbarkeit | Kulturzuweisung gibt es nur in ISO für Beet, Anbaufläche und deren Streifen. Ungeklärte und sonstige Grundflächen, Freiflächen, Wege und Bestandsobjekte zeigen keine Kulturwahl. |
| Mehrdeutigkeit | Bei Teilung oder Vereinigung von Grundflächen bleiben frühere Kulturen in der ISO-Prüfliste sichtbar. Es erfolgt keine automatische Übernahme auf mehrdeutige Nachfolger. Änderung der Streifenrichtung oder Anzahl bei bestehenden Kulturen bewahrt die bisherigen Zuweisungen zur Prüfung. |
| Altansicht | Der ausdrücklich gekennzeichnete Altpfad zeigt v1 einschließlich vorhandener Überlappungen und Kultur. Die Werte beider v1-Schlüssel bleiben bei Speichern und Wiederherstellen eines neuen Gartens bytegleich. |
