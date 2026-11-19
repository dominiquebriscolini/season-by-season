# Season by Season

Browserbasierter Gartenplaner mit Karteneditor, isometrischem Beetplan, Saisonregler und Anbauausgabe. [Krautgaart ausprobieren](https://dominiquebriscolini.github.io/season-by-season/?beispiel=krautgaart)

## Vorschau 0.1.0

„Krautgaart“ ist ein schematischer Beispielgarten mit fiktiven Koordinaten und Beispielbelegungen. Der Link öffnet den Beetplan direkt. Änderungen werden im eigenen Browser gespeichert. Eine JSON-Sicherung kann über „Gespeicherte Gärten“ heruntergeladen oder geöffnet werden.

- In der Karte lassen sich Grundstück, Wege, Flächentypen und Bestand erfassen.
- Im Beetplan lassen sich Beete teilen, Kulturen und Anbauwerte zuweisen und Saisondaten betrachten.
- Druck und Excel enthalten den gesamten angezeigten Gartenplan mit den jeweiligen Belegungen.

## Lokal starten

Mit Node.js 24 und npm ausführen.

```sh
npm ci
npm run dev
```

Der Entwicklungsserver startet unter `http://127.0.0.1:5173/`. Für das Beispiel `?beispiel=krautgaart` anfügen. `npm run build` erstellt die statische Ausgabe in `dist/`. GitHub Actions verwendet beim Build den Unterpfad der Pages-Site.

## Quellen und Prüfung

Die Quellen der mitgelieferten amtlichen Orthofotos sind dokumentiert. Die Weltkarte und die Ortssuche verwenden externe Datendienste. [Karten- und Zeitdaten](public/WELTKARTE-LIZENZEN.md) · [Tandel](public/garden/QUELLE.md) · [Hesperange](evidence/transfer/QUELLE.md) · [Bagua](evidence/segmentation/QUELLE.md)

Der Build erzeugt `DRITTLIZENZEN.md` mit den Lizenzhinweisen der eingebundenen npm-Pakete. Für den eigenen Projektcode ist keine zusätzliche Nutzungslizenz festgelegt.

```sh
node scripts/check-planting-plan.mjs
node scripts/check-strip-layout.mjs
```

Die Paketprüfung der Vorschau meldet zwei moderate Befunde im ExcelJS/uuid-Abhängigkeitspfad und keinen hohen oder kritischen Befund.
