# Kulturwahl im Beetplan und fester Mondplatz

**Fassung 1.0 · 19. November 2026.** Grundlage sind die Nutzeraufnahme von „Beet · Test 01“, [§§ 4–5 der Übergabe](../../Season-by-Season-Uebergabe-aktualisiert.md), [Anbauziele](../anbauziele/README.md) und der vorhandene [Weg für eigene Kulturen](../own-crops/README.md). Die Browserabnahme verwendet eine getrennte Krautgaart-Kopie.

```text
Anbau · Streifen 1                   Saisonleiste ab 421 px
Kultur                               Aktuelles Projekt    [●] Mondphase · Vollmond
[ Kultur wählen                ▾ ]   Aktuelles Projekt    [●] Mondphase · Abnehmende Sichel
  ↓ native Liste auf Tastatur/Klick                       ↑ derselbe Platz
▸ Eigene Kultur hinzufügen
  [ Kulturname ] [ Kultur speichern ]
[ Belegung speichern ]
```

- **Kultur auswählen.** Der native Wähler steht an erster Stelle und nutzt die verfügbare Breite im Anbaubereich. Klick und Tastatur öffnen die alphabetische Liste. Sie enthält mindestens 40 vorinstallierte gebräuchliche Gemüsekulturen und ergänzt die persönlichen und im Garten gespeicherten Kulturen. Gleichlautende Einträge erscheinen einmal. Der Fokus auf den Wähler baut dessen Optionen nicht neu auf. An einem bestätigten Streifen oder ungeteilten Beet wird eine Wahl wie bisher erst durch „Belegung speichern“ im Garten übernommen.
- **Eigene Kultur.** Unterhalb der Liste bleibt „Eigene Kultur hinzufügen“ zunächst eingeklappt. Dort kann man einen fehlenden Namen direkt eingeben, wie bisher speichern und auswählen. Vorhandene eigene Namen, Kulturen, Sorten und zugehörige persönliche Richtwerte bleiben verwendbar, auch wenn ein Name neu in die Standardliste aufgenommen wurde. Gespeicherte Beetbelegungen behalten ihre Schreibweise. Konkrete Sorten, Richtwerte und Quellen stehen weiterhin in den Anbaudaten. Die zusätzlichen Kulturen werden mit ihrem Namen angeboten.
- **Mond.** In der Saisonleiste steht die Scheibe in einer reservierten Spalte links vom Phasentext. Auf schmalen Ansichten hat der Mondblock seine eigene Zeile. Beim Wechsel zwischen kurzen und langen Phasennamen bleiben X- und Y-Position sowie Größe der Scheibe gleich. Der Text nutzt den verbleibenden Platz rechts der Scheibe und kann dort umbrechen. Eine Meldung ohne berechenbare Phase belegt denselben Textbereich. Mondformen, Palette und Kalenderberechnung bleiben wie in der geprüften Anbauansicht.

| Prüffall | Beobachtbares Soll |
| --- | --- |
| Dropdown im echten Nutzerweg | An einem Streifen „Kultur wählen“ mit Zeiger und Tastatur öffnen. Alphabetische Auswahl mit mindestens 40 vorinstallierten Kulturen, darunter Tomate, Paprika, Kartoffel und Gurke. Bei Fokus bleiben die vorhandenen Optionen stabil. Neues Gemüse wählen, speichern und erneut öffnen. |
| Persönliche Kulturen und vorhandener Stand | Eigene Eingabe ist unterhalb der Liste und bei Öffnung eines neuen Ziels eingeklappt. Eingabe wählt den neuen Namen, ohne die Belegung sofort zu schreiben. Vor Einführung der größeren Liste gespeicherte persönliche Kultur und Profil bleiben auch bei Überschneidung verfügbar und sind im Dropdown einmal sichtbar. |
| Position der Mondphase | Alle acht Phasen bei 1440, 600, 430, 390 und 320 px durchlaufen. Der Ursprung der 26 × 26 CSS-Pixel großen Scheibe weicht innerhalb jeder Breite bei Phasenwechseln um höchstens 0,5 Pixel ab. Phasentexte bleiben vollständig lesbar. Das Dokument läuft horizontal nicht über. |
