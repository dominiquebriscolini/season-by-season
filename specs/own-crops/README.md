# Eigene Kulturen am Beet

Grundlage ist [Übergabe §5](../../Season-by-Season-Uebergabe-aktualisiert.md). Der bestehende [Sortenweg](../variety-library/README.md) bleibt für jede gewählte Kultur verfügbar.

```text
Beet / Streifen
  Kultur             [ Kultur wählen              ▾ ]
  Eigene Kultur hinzufügen
    Kulturname       [ Mangold                      ]
    [ Kultur speichern ]
  [ Belegung speichern ]

Kultur speichern   → Mangold steht in der persönlichen Bibliothek und ist ausgewählt
Belegung speichern → Der ausgewählte Streifen erhält Mangold im Gartenstand
Anderen Garten öffnen → Mangold steht dort ebenfalls in der Kulturwahl
```

- Der Name ist die einzige Pflichtangabe. Leere oder nur aus Leerraum bestehende Namen werden abgewiesen. Schreibvarianten einer vorhandenen Kultur werden nach Großschreibung, Akzenten und Leerraum abgeglichen. Die vorhandene Schreibweise bleibt erhalten und wird ausgewählt.
- Die neue Kultur verwendet die bestehende Entwurfslogik der Kulturwahl. Das Anlegen allein ändert weder eine gespeicherte Belegung noch ihre Anbaudaten. Die bisherige Wechsel- und Konfliktlogik gilt auch für eigene Kulturen. Für eine neue Kultur sind Abstände, Keimquote und andere Anbauwerte offen. Der vorhandene Anbaudialog ermöglicht manuelle Werte und eigene Sorten dazu.
- Die persönliche Bibliothek gilt browserlokal über Gärten hinweg. Ihre Sicherung umfasst eigene Kulturen und Sorten und liest vorhandene Sortensicherungen weiter ein. Gartenstände speichern den Kulturnamen in der bestehenden Struktur. Beim Öffnen oder Importieren eines Gartens bleiben gespeicherte Belegungen auch ohne persönliche Bibliothek verfügbar.

**Browserabnahme.** Am Bagua-Streifen eine Kultur nur mit Namen anlegen und unmittelbare Auswahl vor dem Speichern der Belegung prüfen. Eine leere Eingabe und eine Schreibvariante einer bestehenden Kultur prüfen. Belegung speichern, neu laden, denselben und einen zweiten Garten öffnen. Anbaudialog, Entwurfswiederherstellung und Export mit eigener Kultur prüfen. Die Bibliothek aus JSON in einem frischen Browserprofil wiederherstellen und eine ältere Sortensicherung einlesen.
