# Gartenweite Planausgabe in der Beetplan-Kopfzeile

**Fassung 1.0 · 19. November 2026.** Grundlage sind der Auftrag zur Position neben „Gespeicherte Gärten“ und [§ 8 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md). Die vorhandene Ausgabe umfasst bereits sämtliche gültigen Belegungen, wirkt durch ihren Platz in den Beetdetails jedoch wie eine Aktion für das ausgewählte Beet. Die Abnahme verwendet Krautgaart-Kopien.

```text
Desktop · Beetplan
[Gespeicherte Gärten] [Anbauplan drucken] [Excel herunterladen] [Saisonprojekte] …
                     └ dieselbe gartenweite Ausgabe ────────┘

Mobil · Beetplan
[Gärten-Icon][Druck-Icon][Excel-Icon]              [Speichern][Schließen]
[Saisonprojekte] [Gartenname]                         [Karte][Beetplan]
```

- **Ort und Bedienung.** Die zwei Aktionen stehen einmal in der Kopfzeile des Beetplans, unmittelbar rechts von „Gespeicherte Gärten“. Auf schmalen Bildschirmen behalten die Symbole ihre zugänglichen Aktionsnamen und mindestens 44 × 44 CSS-Pixel große Ziele. Saisonprojekte, Gartenname und beide Ansichten bleiben erreichbar. Die Kartenansicht behält ihre vorhandene Navigation. Das Beetdetails-Dock enthält die Bearbeitung des gewählten Ziels.
- **Umfang.** Beide Formate geben denselben gerade angezeigten Gartenplan aus, unabhängig von Beetauswahl und Dock. Die Draufsicht zeigt die Grundstücksgrenze, die vorhandenen Wege sowie alle sichtbaren Grundflächen beziehungsweise bestätigten Streifen. Belegte Ziele tragen wie bisher ihre Kennung aus der Tabelle. Die Anbauübersicht und Einkaufssummen enthalten alle gespeicherten gültigen Belegungen des angezeigten Plans. Ein Garten mit Grundstück und ohne Belegung lässt sich als Draufsicht mit Leerhinweis ausgeben.
- **Planstand.** Bei Wechsel in den schreibgeschützten Rückblick verwenden die Kopfaktionen die dort angezeigte Saison. Offene Änderungen an Streifen oder Kultur gehören erst nach ihrer Übernahme in die Ausgabe. Drucken und Excel schreiben keine Gartenrevision.

| Prüffall | Beobachtbares Soll |
| --- | --- |
| Kopfzeile | Bei 1440, 901, 390 und 320 px bilden die Aktionen eine linke Gruppe. Keine Doppelung in Beetdetails oder Kartenansicht. Alle vorhandenen Navigationsaktionen bleiben sichtbar und der Browser läuft horizontal nicht über. |
| Gesamter Garten | Auf einer Kopie mindestens zwei getrennte Beete mit unterschiedlichen Kulturen belegen. Ohne Auswahl, mit Auswahl und bei geschlossenem Dock enthalten Druckvorschau und Excel beide Belegungen. In der Draufsicht sind auch unbelegte Flächen zu sehen. |
| Leerstand und Rückblick | Auf einer Kopie gültigen Garten ohne Belegung ausgeben. Danach einen eigenen Saisonstand anlegen. Der Rückblick gibt die früheren Belegungen und die frühere bestätigte Teilung aus. Entwürfe bleiben im Editor und die gespeicherten Stände nach der Ausgabe identisch. |
