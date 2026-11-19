# Season by Season · Produktvision und Übergabe an Codex

Stand 19. November 2026 · Neuentwurf für eine Webanwendung · **Revision: verbindliche Geometrie- und Bestandslogik**

## 1. Was der Gärtner am Ende tun kann

Ein Gärtner sucht auf der Weltkarte seinen Garten, zeichnet dessen Grenze und erhält einen Plan seines tatsächlichen Grundstücks. Er erkennt seine Wege, findet sein Gewächshaus wieder und kann auf ein Beet klicken. Teilt er es für die nächste Saison in sieben Streifen, kann er auf jedem Streifen etwas anderes anbauen. Schon beim Eintragen sieht er, was dort Platz hat, wann die Ernte ansteht und was er dafür einkaufen muss.

Derselbe Garten ist eine bewegte, isometrische Strichelzeichnung. Ein Zug am Saisonregler zeigt, wie das Laub austreibt, die Möhren im Boden wachsen und die Beete abgeerntet werden. Für die Arbeit draußen nimmt der Gärtner einen beschrifteten Plan und eine Mengenliste mit. Im Folgejahr sieht er, was auf demselben Stück Boden tatsächlich gewachsen ist.

**Geltungsbereich.** Dieses Dokument beschreibt einen eigenständigen Neustart. Maßgeblich sind die hier festgehaltenen Entscheidungen. Das frühere Projekt bleibt außerhalb des Arbeitsauftrags. Übernommene Wünsche wie der Saisonregler, die Mondphase und die beiden Farbmodi sind hier vollständig beschrieben. Die Produktvision gibt das gewünschte Erlebnis vor. Technische Verfahren, Datenanbieter und Leistungsgrenzen werden im neuen Projekt ermittelt.

## 2. Von der Weltkarte zum Garten – verbindliche Geometrie- und Bestandslogik

**Grundsatzentscheidung (19. November 2026): Das Wegenetz – nicht die KI-Bildsegmentierung – bestimmt die Aufteilung der Grundstücksfläche.** Diese Entscheidung ersetzt ältere Beschreibungen, nach denen die Software aus dem Luftbild viele eigenständige Beet-, Feld- oder Freiflächenkonturen erkennt und daraus ein Patchwork erzeugt. Die KI darf später bei der Benennung oder Verfeinerung helfen; sie darf **nicht** eigenständig die Grundaufteilung in zusätzliche Flächen zerlegen.

1. **Grundstück auswählen.** Die Einstiegsseite bietet Anmeldung und eine navigierbare Weltkarte mit Ortssuche. Der Nutzer zeichnet die Grundstücksgrenze als Polygon und schließt sie mit **Enter**. Diese Grenze definiert die gesamte Berechnungsfläche.
2. **Wegenetz zeichnen – unverändert beibehalten.** Der Nutzer zeichnet die Mittellinien sämtlicher Wege wie im bestehenden Prototyp. Die bereits funktionierende Zeichnung, Auswahl und Bearbeitung des Wegenetzes wird nicht neu erfunden oder ersetzt. Eine allgemeine Wegbreite in realen Einheiten bildet die Ausgangsbasis; einzelne Abschnitte bleiben später anpassbar.
3. **Wege zur Flächenbildung verlängern.** Reichen eingezeichnete Wege nicht bis zur Grundstücksgrenze, verlängert die Software ihre offenen Enden geometrisch in nachvollziehbarer Fortsetzung bis zum Grundstücksrand, damit geschlossene Bereiche entstehen. Die selbst gezeichneten Ursprungslinien bleiben gespeichert; automatisch ergänzte Strecken sind unterscheidbar, überprüfbar und bei Bedarf korrigierbar. Verlängerungen und Kreuzungen sollen keine unbeabsichtigten Überstände oder Selbstüberschneidungen erzeugen.
4. **Grundflächen ausschließlich aus den Wegen ableiten.** Zunächst werden Wegflächen aus den Mittellinien und Wegbreiten berechnet und an der Grundstücksgrenze abgeschnitten. Danach werden diese Wegflächen von der Grundstücksfläche abgezogen. Jede entstehende zusammenhängende Restregion ist **eine** Grundfläche mit eigener stabiler ID. Die Wege teilen die Flächen; sie werden nicht durch nachträglich erkannte Farb- oder Texturfragmente ersetzt. Es dürfen keine überlappenden oder willkürlich zersplitterten Grundflächen entstehen.
5. **Flächen klassifizieren, nicht erneut segmentieren.** Diese Grundflächen starten als **„Ungeklärt“**. Der Nutzer kann sie etwa als **Beet**, **Anbaufläche**, **Freifläche** oder **Sonstige Fläche** einstufen. „Freifläche“ ist wie „Weg“ eine nicht mit einer Kultur belegte Nutzfläche, aber ein selbstständiger Flächentyp und kein Teil des Wegenetzes. Die Klassifikation verändert die Anzahl und Grenzen der durch Wege gebildeten Grundflächen nicht. Interne, ausdrücklich vom Nutzer gewählte Beet- oder Kulturstreifen werden erst in der Planung unterteilt; das erzeugt keine neuen Wege.
6. **Bäume, Hecken und andere Vegetationsobjekte als unabhängigen Bestand einfügen.** Solche Objekte können vom Nutzer frei eingefügt, positioniert, verschoben und bearbeitet werden. Sie liegen auf einer eigenen Objektebene. Ihre Form verändert **weder Weggeometrie noch Grundflächen**, und sie dürfen nicht automatisch Flächen teilen, verkleinern oder löschen.
7. **Gebäude und Schuppen als flächenbelegende Objekte.** Häuser, Schuppen und vergleichbare feste Baukörper können auf eine Grundfläche oder über einen Weg gelegt werden. Ihre geometrische Grundfläche wird von der darunterliegenden **nutzbaren** Grund- beziehungsweise Wegfläche abgezogen; die Objektfläche bleibt als eigenständiger Baukörper mit ID sichtbar. Die zugrunde liegende Flächen-ID und die vom Nutzer erstellte Wegmittellinie bleiben erhalten. Änderungen am Objektumriss aktualisieren die Nettofläche unmittelbar. Keine doppelte Flächenzählung.
8. **Gewächshäuser und dauerhaft begehbare Tunnel bleiben Hüllen über einer bepflanzbaren Fläche.** Sie werden, anders als ein Schuppen, nicht automatisch von der Anbaufläche abgezogen. Die Hülle ist ein ein- und ausblendbares Objekt. Temporäre niedrige Folienabdeckungen werden bei der Bestandsaufnahme ignoriert.
9. **Erst danach die isometrische Planungsansicht.** Alle geometrischen Objekte haben eigene IDs. Die zuverlässige Grundgeometrie wird in die isometrische Ansicht übernommen; dort erfolgen Kulturzuweisung, Saisonplanung und weitere Anbau-Unterteilungen. Eine senkrechte Draufsicht bleibt für Exporte verfügbar. Geländeform, Neigung und Böschungen sind für die räumliche Ansicht weiterhin relevant, bestimmen aber nicht die Grundflächenaufteilung.

**Daten- und Schichtenmodell:**

| Ebene | Regel | Einfluss auf nutzbare Flächen |
| --- | --- | --- |
| Grundstück | Ein geschlossenes äußeres Polygon | Feste Rechengrenze |
| Wegenetz | Vom Nutzer gezeichnete Mittellinien, abgeleitete Verlängerungen und Breiten | Zerlegt das Grundstück in Restflächen |
| Grundflächen | Ausschließlich aus `Grundstück minus Wegflächen` abgeleitete zusammenhängende Regionen | Eindeutige IDs; zunächst ungeklärt, danach klassifizierbar |
| Vegetation | Bäume, Hecken, Sträucher und vergleichbarer Bestand als Objektebene | **Kein** Abzug, **keine** Trennung der Grundflächen oder Wege |
| Feste Baukörper | Haus, Schuppen und andere nicht bepflanzbare Objektgrundrisse | Abzug der belegten Teilfläche von der darunterliegenden nutzbaren Grund- oder Wegfläche |
| Begehbare Anbauhüllen | Gewächshaus und dauerhafter Folientunnel | Bepflanzbare Fläche bleibt erhalten; Hülle nur überlagert |
| Pflanzplanung | Jahresbezogene Aufteilung einer Grundfläche in Kulturstreifen | Betrifft nur die Planung, nicht die Grundaufteilung |

**Präzision und Änderbarkeit:** Änderungen an Wegbreiten, Weglinien, automatisch verlängerten Abschnitten oder Baukörper-Grundrissen lösen eine konsistente Neuberechnung der betroffenen Nettoflächen aus. Die Grundflächen müssen sich weiterhin ohne Lücken oder Überschneidungen aus Grundstück und Wegenetz erklären lassen. Objekt-IDs und bereits gespeicherte Pflanzdaten bleiben erhalten, soweit ihre Zuordnung eindeutig möglich ist; unklare Zuordnungen werden nicht stillschweigend überschrieben. Der bestehende funktionierende Wegeditor wird nicht umgebaut.

## 3. Felder unterteilen und Projekte anlegen

**Ein Feld hat eine aus der Grundflächengeometrie abgeleitete Außengrenze; diese bleibt bis zu einer bewussten Geometrieänderung stabil.** Der Planer erkennt seine Längs- und Querrichtung. Der Gärtner wählt am Gesamtfeld die Richtung und die Anzahl der Teile. Sieben Längsstreifen ergeben sieben gleich breite Streifen innerhalb derselben Feldgrenze. Bei einem schräg zulaufenden Feld können ihre Längen variieren. Jeder Streifen lässt sich einzeln anwählen und für einen Zeitraum bepflanzen. Die Unterteilung erzeugt ausschließlich Nutzungsgrenzen. Das Wegenetz wurde zuvor vom Nutzer gezeichnet; sämtliche Grundflächen wurden daraus geometrisch abgeleitet.

**Das Projektmenü sitzt oben links in der ISO-Ansicht.** Für dasselbe Grundstück kann der Gärtner mehrere Projekte speichern, wieder öffnen und über das Menü zwischen ihnen wechseln.

| Auswahl im Menü | Ablauf und Ergebnis |
| --- | --- |
| Leeres Projekt | Gelände und dauerhafter Bestand sind vorhanden. Der Gärtner teilt Felder auf und weist Kulturen und Zeiträume selbst zu. |
| KI-Vorschlag | Erst die bewusste Auswahl öffnet ein Fenster für gewünschte Kulturen, Zielmengen und weitere Anbauwünsche. Mit „Go“ beginnt die Verteilung. Sie berücksichtigt verfügbare Flächen, Anbauzeiträume, günstige und ungünstige Nachbarschaften sowie bekannte Fruchtfolgen. |
| Gespeichertes Projekt | Das Menü öffnet genau diesen Entwurf mit seinen eigenen Streifen, Kulturzuweisungen und Planwerten. |

**Jeder KI-Vorschlag ist ein eigenes, bearbeitbares Projekt.** Ein manueller Entwurf und ein KI-Entwurf lassen sich durch Umschalten vergleichen. Wer im KI-Entwurf Tomaten durch Bohnen ersetzt, ändert ausschließlich diesen Entwurf. Für eine spätere Fruchtfolge zählt der ausdrücklich verknüpfte, tatsächlich bewirtschaftete Plan.

## 4. Saison, Hauptjahr und Anbaugeschichte

Jedes Projekt hat ein Hauptjahr. Sein Regler umfasst das ganze Kalenderjahr sowie je sechs Monate davor und danach. Er lässt sich vorwärts und rückwärts bewegen. Ein Play-Button spielt den Verlauf langsam in Tagesschritten ab. Das gewählte Datum bestimmt die sichtbaren Kulturen, deren Wachstumszustand, die Ernte und die Mondphase des jeweiligen Jahres.

| Im aktuellen Projekt eingebundene Hauptjahre | Erreichbarer Zeitraum |
| --- | --- |
| 2028 | Juli 2027 bis Juni 2029 |
| 2027 und 2028 | Juli 2026 bis Juni 2029 |
| 2027, 2028 und 2029 | Juli 2026 bis Juni 2030 |

**Vorläufige Obergrenze sind drei aufeinanderfolgende Hauptjahre insgesamt.** Bei der Anlage des Folgejahres wählt der Gärtner das zugehörige Vorjahresprojekt. Am Regler und direkt am Beet kann er dessen frühere Aufteilung, Bepflanzung und Ernten ansehen. Die verknüpften historischen Daten sind im Folgeprojekt schreibgeschützt.

Für den neuen Plan wird die frühere Aufteilung als Kopiervorschlag angeboten. Der Gärtner kann fünf Längsstreifen übernehmen oder daraus im neuen Projekt sieben machen. **Die Kulturzuweisungen der Kopie sind leer.** Im Rückblick auf das frühere Projekt bleiben die fünf Streifen mit ihrer damaligen Belegung und Ernte sichtbar. Wie die Oberfläche Anbauten über den Jahreswechsel und überlappende Randmonate zweier Projekte zuordnet, ist eine offene Detailentscheidung.

## 5. Vom Klick auf ein Beet bis zur Ernte

**Kultur und Sorte.** Direkt am Beet oder Streifen öffnet sich eine durchsuchbare Pflanzenbibliothek. Der Gärtner kann „Möhre“ oder eine bestimmte Möhrensorte wählen. Über „Eigene Kultur oder Sorte hinzufügen“ ergänzt er fehlende Einträge. Bei einer neuen Sorte kann er erkennbare Richtwerte der Kultur übernehmen, ihre Herkunft einsehen und beispielsweise Angaben von der Saatguttüte einsetzen. Eine völlig neue Kultur kann zunächst nur einen Namen haben. Nach dem Speichern ist sie am Beet ausgewählt und für weitere Saisons in der persönlichen Bibliothek verfügbar.

**Anbaubeginn und Erntefenster.** Bei Direktsaat ins Freiland zählt das Aussaatdatum. Bei vorgezogenen Jungpflanzen zählt das Datum des Auspflanzens ins Beet. Der zum Verfahren passende Kultur- oder Sortenwert liefert ab diesem Datum ein erstes Erntefenster im Saisonplan. Der Zeitpunkt soll sich so schon bei der Eingabe ergeben.

**Mengen und Abstände.** Beetform, nutzbare Reihenlängen, Reihenrichtung, Reihenabstand und Abstand in der Reihe bestimmen, wie viele Pflanzen Platz haben. Die Bibliothek liefert Vorschläge. Ändert der Gärtner einen Abstand, aktualisieren sich Reihenanzahl, Pflanzenkapazität, Saatgut- beziehungsweise Jungpflanzenbedarf und erwartete Erntemenge sofort. Die Keimrate fließt dort in den Saatgutbedarf ein, wo ausgesät wird. Erträge werden je nach Kultur in Kilogramm oder Stück angegeben. Fehlt etwa nur der Ertragsrichtwert, kann der Planer die Pflanzenzahl bereits berechnen und beim Ertrag „noch offen“ zeigen.

**Soll und tatsächliche Ernte.** Der zu Saisonbeginn festgelegte Planertrag dient als Vergleichsbasis. Bei der Ernte erfasst der Gärtner Datum und Menge am betreffenden Beet oder Streifen. Mehrere Pflückgänge werden summiert. So kann bei Tomaten am Saisonende beispielsweise „20 kg geplant · 16 kg geerntet“ stehen. Eine Notiz wie „trockener Sommer“ liefert Kontext. Für dieselbe Kultur kann der Gärtner einen eigenen Ertrag, etwa in Kilogramm pro Quadratmeter, gezielt für eine andere Beetgröße im Folgeprojekt übernehmen. Automatische wetterbedingte Verschiebungen des Soll-Ertrags oder Erntefensters sind zurückgestellt. Saisonale Wettereffekte in der Zeichnung dienen der Atmosphäre.

**Datenbasis.** Benötigt werden Kultur- und Sortennamen, Anbauprofile mit Quellen und Einheiten, Abstände, Kulturdauern je Anbauweise, Saatgut- und Ertragswerte sowie fachlich begründete Regeln für Nachbarschaft und Fruchtfolge. Im Gespräch wurden das EU Plant Variety Portal für Sortenbezeichnungen und die Gemüsebau-Tabellen des KTBL für Richtwerte als Ansatzpunkte genannt. Datenumfang, regionale Eignung, Nutzungsrechte und Importmöglichkeiten sind später zu prüfen. Fehlende Daten und die Herkunft persönlicher Erfahrungswerte sollen sichtbar bleiben.

## 6. Wie der Garten gezeichnet ist

**Die gesamte Szene ist eine isometrische Handskizze aus hauchfeinen, kurzen Strichen.** Ihre Genauigkeit liegt in der Lage der Beete, den Proportionen und der Art, wie Striche eine Form andeuten. Die Anregung aus der ASCII-Grafik ist das feine Raster. Das kleinste sichtbare Element ist ein Strich. Ein Blatt ergibt sich erst aus vielen Strichen, die sich vom Ansatz zur Spitze auffächern. Am Ast folgen sie seiner Biegung, am Stamm richten sie sich längs aus. Dichte und Zwischenraum können Wölbung, Licht und Schatten ausdrücken. Diese zeichnerische Grammatik gilt vom Blatt bis zum Gewächshaus.

**Auch die Fernansicht bleibt offen.** Aus der Entfernung lässt sich eine Hecke an wenigen lockeren Strichgruppen erkennen. Hintergrund scheint zwischen ihnen durch. Beim Annähern ergänzen weitere Striche dieselbe Form, bis Zweige und Laub sichtbar werden. Beim Herauszoomen sinkt die Zahl der Striche nach Form und Maßstab. Die verbleibenden Striche behalten ihre Feinheit und ihren Kontrast. Feste Strichzahlen je Zoomstufe sind entbehrlich. Auch ein ganzes Grundstück soll wie eine leichte Skizze aussehen.

**Schraffuren machen Flächen lesbar.** Wege, bestellte Felder, Brachflächen und Baumkronen haben unterscheidbare Schraffuren. An der Beetkante folgen kurze Striche der Grenze etwas regelmäßiger als im Inneren. Die Beetform soll selbst bei dichtem Bewuchs gut verfolgbar sein. Die Linie bleibt ähnlich fein wie die Pflanzen. Bei Auswahl leuchtet der Hintergrund des Feldes bis an seine tatsächliche Grenze sanft in der global gewählten Akzentfarbe auf. Schraffur, Pflanzen und kleine Beschriftungen bleiben lesbar.

**Licht und Farbe.** Es gibt einen hellen und einen dunklen Modus. Auf dem jeweiligen Hintergrund haben die feinen Linien einen deutlichen Kontrast. Eine leuchtende Variante derselben Linien erzeugt den gewünschten Glow-Effekt. Etwa drei bis vier zusätzliche Akzentfarben halten die Palette klein. Ihre konkreten Farbtöne werden gemeinsam ausgewählt. Die Auswahlfarbe stellt der Nutzer einmal für die ganze App ein.

## 7. Kamera, Bewegung und Pflanzen

**Kamera.** Die isometrische Neigung von oben ist fest. Ein sichtbarer Kompass markiert Norden, Osten, Süden oder Westen als aktuelle Blickrichtung. Die drei übrigen Richtungen sind direkt anwählbar. Zwei Pfeile am Bildschirm schalten jeweils um eine Vierteldrehung weiter. Die Kamera schwingt mit sanftem Anfahren und Abbremsen um den betrachteten Gartenausschnitt, bei gleichem Fokus und Zoom. Als Richtwert gelten etwa eine halbe Sekunde für 90 Grad und höchstens etwa eine Sekunde für den Wechsel. Wo der Kompass sitzt und wie man den Bildausschnitt genau verschiebt, kann im Entwurf geklärt werden.

**Pflanzenvarianten und Plastizität.** Wenige wiederverwendbare Varianten je Kultur geben einer Reihe natürliche Unterschiede. Drei Tomaten mit leicht anderem Wuchs sind ein Beispiel. Bei einer Drehung des Gartens behält jede Pflanze ihren Ort. Sie darf in derselben isometrischen Zeichnung erscheinen. Ein räumlich glaubwürdiges Ergebnis kann schon in der Vorlage angelegt sein. Wie die eigenen, rechtlich nutzbaren Vorlagen erzeugt werden und welche 2D- oder 3D-Grundlagen sinnvoll sind, soll die Entwicklung untersuchen.

**Zwei Kulturen verdeutlichen das Wachstumsziel.**

- **Tomate.** Die Jungpflanze treibt am selben Standort aus. Der Stängel verlängert sich, Seitentriebe und Blätter entfalten sich, dann bilden sich Früchte und reifen. Beim langsamen Abspielen und beim Ziehen am Regler soll derselbe Wuchs fließend erkennbar bleiben. Jungpflanze und reife Pflanze könnten als zwei Ausgangszustände für erzeugte Zwischenstadien dienen. Dieses Verfahren ist eine Versuchsidee.
- **Möhre.** Über der Bodenschraffur fächern sich die Striche des Laubs auf. Unter der Schraffur wird die Wurzel länger und dicker. Einige Bodenstriche verlaufen vor ihr. Durch deren Zwischenräume kann man das Wachstum der Wurzel direkt im Beet verfolgen.

**Darstellungsdichte.** Die Anbaudaten enthalten die echte geplante Stückzahl. Die Zeichnung richtet sich nach dem verfügbaren Abstand auf dem Bildschirm. Bei 20 Zucchinipflanzen können alle 20 sichtbar sein. Eine dicht gesäte Möhrenreihe erscheint aus der Ferne als Folge lockerer Gruppen. Beim Heranzoomen werden einzelne Wurzeln und ihr Laub unterscheidbar. Sobald Wurzeln, Laub und Bodenschraffur ineinanderlaufen, ist die Darstellung zu dicht. Die am Beet abrufbare Anzahl und sämtliche Berechnungen bleiben auf jeder Zoomstufe gleich.

**Atmosphäre und Ruhe.** Wind bewegt benachbarte Striche zusammenhängend und leicht zeitversetzt. Mit den Jahreszeiten verändern sich Licht und Bäume. Der Sommer wirkt heller, der Herbst kann windiger und regnerisch sein, im Winter kann Schnee liegen, im Frühjahr treiben die Bäume aus. Die Effekte bleiben fein und lassen sich für ruhiges Planen gemeinsam abschalten. Der Saisonregler, die Mondphase und die fachliche Zuordnung von Pflanzen und Ernte zum Datum bleiben weiter nutzbar.

## 8. Was mit in den Garten kommt

Das **PDF** beginnt mit einer druckbaren, beschrifteten Draufsicht. Wer auf dem Plan „Beet 4, Streifen B“ findet, kann dieselbe Kennung in der Anbauübersicht nachschlagen. Dort stehen Kultur und Sorte, Aussaat oder Pflanzung, Anbau- und Erntezeitraum, Reihenanzahl, Reihen- und Pflanzenabstand, geplante Pflanzenzahl, Saatgut- beziehungsweise Jungpflanzenbedarf und erwarteter Ertrag in der passenden Einheit.

Der **Excel-Export** enthält dieselbe Draufsicht und eine sortierbare Tabelle. Eine Summe je Sorte über die Beete hinweg erleichtert den Einkauf. Beide Exporte sollen die gerade gewählten Daten des betreffenden Projekts wiedergeben. Eine Änderung des Reihenabstands muss deshalb in der nächsten Ausgabe dieselben Mengen ergeben wie am Beet.

## 9. Woran sich das Ergebnis prüfen lässt

Diese Beispiele verbinden mehrere Anforderungen. Die verwendeten Pflanzenzahlen und Feldbezeichnungen sind Beispieldaten.

| Im Beispielgarten ausprobieren | Erwartetes Ergebnis |
| --- | --- |
| Grundstück und Wegenetz (mit zwei vor dem Rand endenden Weglinien) zeichnen, die automatische Verlängerung prüfen und Grundflächen erzeugen. | Die abgeleiteten Wege reichen für die Flächenbildung bis zum Grundstücksrand. Jede zusammenhängende Restregion ist genau eine Grundfläche mit ID; keine Pixel-Patchwork-Flächen, keine überlappenden Grundflächen. |
| Einen Baum und eine Hecke auf eine Grundfläche setzen, danach einen Schuppen teilweise auf Feld und Weg platzieren. | Baum und Hecke verändern weder Grundflächen noch Wege. Der Schuppen vermindert ausschließlich die tatsächlich belegte nutzbare Fläche seiner Unterlage; Objekt-IDs bleiben erhalten. |
| Ein Gewächshaus über eine planbare Fläche legen und die Hülle ausblenden. | Die darunterliegende Anbaufläche bleibt bepflanzbar. Temporäre niedrige Folienabdeckungen ändern die Grundgeometrie nicht. |
| „Beet 4“ 2027 in fünf, 2028 in sieben Streifen einteilen. Im Projekt 2028 zum Mai 2027 zurückgehen. | Die Vorjahresansicht zeigt die fünf historischen Streifen mit damaliger Bepflanzung. Die neue Aufteilung erzeugt keine Wege. Frühere Kulturzuweisungen werden beim Kopieren der Aufteilung ausgelassen. |
| Für dieselbe Fläche einen KI-Vorschlag erzeugen, eine Kultur darin ändern und zum manuellen Projekt zurückwechseln. | Jeder Entwurf öffnet mit seiner eigenen Bepflanzung und seinen eigenen Planwerten. |
| Einen Möhrenstreifen dichter planen, herauszoomen und die Exporte öffnen. | Der geänderte Pflanzabstand wirkt auf die realen Mengen. Der Zoom wirkt auf die Anzahl sichtbarer Striche und Pflanzen. Feldkennung, Saatgutbedarf und Ertrag stimmen zwischen Plan, PDF und Excel überein. |
| Im Beet von der Übersicht bis zum Möhrengrün zoomen, Richtung wechseln, den Saisonverlauf abspielen und die Atmosphäre ausschalten. | Die offene Strichwirkung bleibt in allen Maßstäben erhalten. Bodenschraffur und Wurzel bleiben räumlich lesbar. Der Kompasswechsel hält den Ausschnitt. Auch in Ruhe lässt sich das zum Datum passende Beet bearbeiten. |
| Mehrere Tomatenernten buchen, das Folgejahr verknüpfen und einen Erfahrungswert übernehmen. | Datum und Menge jeder Ernte sind nachvollziehbar. Die Summe lässt sich mit dem ursprünglichen Soll vergleichen. Der übernommene Wert gilt für den ausgewählten neuen Plan. |

## 10. Offene Aufgaben für die Entwicklung

| Zu klären | Was als Entscheidungsgrundlage gebraucht wird |
| --- | --- |
| Kartenbilder, Höhen und geometrische Qualität | An einem repräsentativen Grundstück die Georeferenzierung und zulässigen Daten prüfen. Vor allem Wegbreiten, Verlängerungen, Kreuzungen, Flächenpartitionierung und die Abzüge fester Baukörper geometrisch testen. Bildbasierte Erkennung ist für die **Grundflächenbildung nicht Voraussetzung**; sie kann allenfalls nachgeordnet Hilfestellung bieten. Höhen- und Geländedaten getrennt prüfen. |
| Zeichnung und Geschwindigkeit | Eine kleine Szene mit Weg, Beet, Tomate und Möhre im Nah- und Fernmaßstab entwerfen. Eigene Pflanzengrafiken, fließendes Wachstum, Wind und Kompasswechsel am selben Beispiel erproben. Die Bedienbarkeit auch bei einem dicht bepflanzten Garten regelmäßig auf geeigneten Geräten messen. Zielwerte aus dem Versuch ableiten. |
| Bibliothek und Vorschlagsregeln | Eignung und Nutzbarkeit der Quellen, Sortenspezifität und regionale Gültigkeit prüfen. Klären, wie unvollständige Regeln, widersprüchliche Wünsche und nicht erreichbare Zielmengen im Vorschlag kenntlich werden. |
| Zeit- und Erntedaten | Für eine im Herbst gesäte und im Folgejahr geerntete Kultur die Zuordnung zu Projekt und Jahr ausarbeiten. Festlegen, ab wann der Saison-Sollwert für den historischen Vergleich erhalten bleibt und wie eine spätere bewusste Umplanung erkennbar wird. |
| Gestaltungsdetails | Akzentpalette, konkrete Schraffuren, visuelle Mindestabstände und fließende Übergänge anhand derselben Gartenszene beurteilen. Kompassposition und eine optionale Luftbildunterlage können später entschieden werden. |

## 11. Startauftrag für Codex

Dieser Auftrag gilt für das neue Projekt **Season by Season** im Projektordner `season-by-season`. Beginne mit der Arbeitsweise im Projekt, wende sie anschließend auf die Gesamtplanung an und schließe mit dem ersten vorgeschlagenen Umsetzungsschritt ab. Die Anwendung wird in einem anschließenden Umsetzungsauftrag entwickelt. Ist dieser Startauftrag bereits ausgeführt, knüpfe im bestehenden Projekt am geprüften Stand an. Ein ausdrücklich gesetztes Laufziel beauftragt die zu seinem Erreichen nötigen lokalen Umsetzungsschritte über Etappengrenzen hinweg.

### Schritt 1 · Die Arbeitsweise einrichten

Lies diese Übergabe einmal vollständig. Lege im Stammordner eine kurze `AGENTS.md` für die dauerhaften Arbeitsregeln und eine `PLAN.md` für den laufenden Projektstand an. Sind die Dateien bereits vorhanden, ergänze sie unter Erhalt bestehender Arbeit. Die vorliegende Übergabe bleibt die fachliche Quelle. Übernimm folgende Regeln in die `AGENTS.md`:

- **Einstieg in einen Chat.** Öffne zuerst den aktuellen Stand in `PLAN.md`, dann die dort referenzierten Abschnitte der Vision. Prüfe bei begonnener Arbeit die vorhandenen Ergebnisse. So lässt sich eine Aufgabe auch nach einem Chatwechsel an derselben Stelle fortsetzen.
- **Zuständigkeit.** Ein Koordinationschat behält den Gesamtplan im Blick, wählt die nächste ausführbare Aufgabe und prüft das Zusammenspiel. Wenn die Umgebung Subagents unterstützt, kann er eine unabhängige Teilaufgabe mit Ziel, Grenzen und erwarteter Rückgabe delegieren. Er führt das Ergebnis selbst wieder in den Gesamtplan zurück.
- **Verbindliche Grundflächenlogik zuerst prüfen.** Die Wege sind vom Nutzer vorgegebene Trennstruktur; Grundflächen werden geometrisch aus Wegen und Grundstück erzeugt. Vegetationsobjekte überlagern nur; Gebäude belegen Nettofläche. Keine automatische KI-Patchwork-Segmentierung als Grundflächenmodell. Für wichtige Änderungen muss ein unabhängiger Produkt-/UX-Review diese fachlichen Regeln anhand eines sichtbaren Browser-Nutzerwegs prüfen.
- **Richtung vor und nach jeder Etappe prüfen.** Halte oben in `PLAN.md` das aktuelle Nutzerziel und den sichtbaren Nachweis für seine Erfüllung fest. Der Hauptagent gleicht das jüngste Ergebnis mit diesem Ziel ab. Er wählt die nächste Aufgabe danach, welche fehlende Fähigkeit sie liefert, welche Voraussetzung sie schafft oder welche folgenschwere Annahme sie am schnellsten überprüft. Etappennummern und bereits recherchierte Bibliotheken sind Arbeitshilfen. Ändert ein Versuch die Reihenfolge, dokumentiert er den Grund in einem Satz und setzt den nächsten sinnvollen Schritt selbst um. Arbeite nachprüfbare Aussagen von einer Annahme bis zu einem Ergebnis am Beispielgarten durch.
- **Vorhandene Software nutzen.** Prüfe vor der Eigenentwicklung einer größeren Funktion zuerst, welche Teile der vorhandene Projektcode und welche gepflegten Open-Source-Projekte auf GitHub bereits abdecken. Suche auch nach fertigen Fachanwendungen und eigenständig nutzbaren Modulen. Kleine, projektspezifische Anpassungen kannst du direkt umsetzen. Dokumentiere die Wahl und die verbleibende Eigenleistung kurz beim jeweiligen Eintrag in der `PLAN.md`.
- **Wer recherchiert und entscheidet.** Der Koordinationschat formuliert eine prüfbare Frage und ein Beispiel aus dem Garten. Er beauftragt für unabhängige Suchen selbstständig Recherche-Subagents, sofern verfügbar. Andernfalls recherchiert er selbst. Die Recherche liefert für aussichtsreiche Kandidaten den Repository-Link, eine passende Version oder einen Commit, die konkrete Funktion samt Code- oder Beispielverweis, die Lizenz, Hinweise auf Pflege und Tests sowie Abhängigkeiten, Integrationsaufwand und verbleibende Lücken. Prüfe bei Karten, Datensätzen und KI-Modellen die Bedingungen der tatsächlich benötigten Bestandteile gesondert.
- **Vom Fund zur Integration.** Der Koordinationschat prüft die Empfehlung an den Originalquellen und wählt einen Kandidaten begründet aus. In der beauftragten Umsetzung übernimmt er den Praxistest selbst oder delegiert ihn. Erfüllt der Baustein das Abnahmekriterium, binde ihn vorzugsweise über sein gepflegtes Paket oder seine öffentliche Schnittstelle ein. Eine direkte Codeübernahme braucht nachvollziehbare Herkunft, einen Versionsbezug und die zugehörigen Lizenzhinweise. Prüfe den Nutzerweg anschließend in Season by Season. Halte im Plan fest, ob ein Kandidat recherchiert, erprobt oder integriert ist. Scheidet er aus, benenne die konkrete Lücke und entscheide, ob ein anderer Baustein oder eine gezielte Eigenentwicklung besser passt.
- **Ablauf je Aufgabe.** Formuliere das beobachtbare Ergebnis und seinen Bezug zur Vision. Bearbeite die Aufgabe. Prüfe sie auf dem Weg, den ein Gärtner tatsächlich benutzt. Trage Prüfergebnis, offene Punkte und nächsten Schritt in `PLAN.md` ein. Arbeite im beauftragten Umfang nach erfolgreicher Prüfung selbstständig weiter.
- **Entscheidungen und Blockaden.** Reversible technische Entscheidungen trifft Codex selbst. Eine Änderung der Produktvision entscheidet der Auftraggeber. Wenn eine Entscheidung nötig wird, halte die konkrete Frage, ihre Auswirkung und eine Empfehlung im Plan fest. Führe unabhängige Aufgaben im vereinbarten Umfang fort.

Übernimm auch die folgenden Zuständigkeiten in kompakter Form. Für den Startauftrag genügt es, sie in den Arbeitsregeln zu verankern und die später nötigen Schritte in die Planung aufzunehmen.

| Aufgabe | Zuständigkeit und Prüfung |
| --- | --- |
| Unabhängiges Review | Bei tragenden Bausteinen und vor einer öffentlichen Veröffentlichung formuliert der Hauptagent das Abnahmekriterium vorab. Ein anderer Agent als derjenige, der den Baustein empfohlen oder eingebaut hat, prüft Quellen und Ergebnis. Zusätzlich prüft ein unabhängiger Produkt-/UX-Review, ob die Umsetzung der verbindlichen Vision einschließlich der schichtgetrennten Grundflächenlogik entspricht. Er hält Testfall, Beobachtung und Abweichungen fest; ein fachlicher Widerspruch blockiert die Abnahme bis zur Korrektur. Der Hauptagent entscheidet anhand des Befunds über Integration oder Nacharbeit. Bei kleinen Änderungen genügt die eigene Prüfung. Ist keine unabhängige Prüfung verfügbar, kennzeichnet er das im Plan. |
| Datensicherung | Der Hauptagent plant die automatisierte Sicherung von Quellcode und später von Gartendaten, eigenen Sorten und hochgeladenen Dateien. Sobald die Anwendung Daten speichert, richtet er die Sicherung im vereinbarten Umfang ein. Ein Reviewer kontrolliert mit einer tatsächlichen Wiederherstellung, ob ein Beispielgarten samt Beetaufteilung und Erntehistorie wieder geöffnet werden kann. |
| GitHub | Der Hauptagent bündelt Änderungen in nachvollziehbaren Commits und nutzt das vereinbarte Repository. Größere Änderungen legt er als Pull Request zum Review vor. Ziel-Repository, Sichtbarkeit und die Befugnis zum Zusammenführen legt der Auftraggeber einmalig fest, bevor der erste Upload ansteht. |
| Öffentliche Veröffentlichung | Der Hauptagent bereitet eine Version mit Versionsnummer, Änderungsübersicht und Prüfergebnissen vor. Der Reviewer prüft die zentralen Nutzerabläufe. Über den öffentlichen Start der Web-App entscheidet der Auftraggeber. |
| Lizenzen | Der recherchierende Agent erfasst Herkunft, Version, Lizenz und erforderliche Hinweise für übernommene Bestandteile. Beim Luftbildtest prüft der Reviewer die Belege für Programmcode, Modellgewichte und Bildmaterial jeweils getrennt. Der Hauptagent sorgt bei der Integration für die zugehörigen Hinweise. Über die Lizenz des eigenen Projekts und Produktentscheidungen bei unklaren Rechten entscheidet der Auftraggeber. |

Beginne die `PLAN.md` mit dem aktuellen Auftrag, dem letzten geprüften Ergebnis und genau einem nächsten Schritt. Darunter ist Platz für Etappen, deren Status sowie offene Entscheidungen. **Die Einrichtung ist abgeschlossen, wenn ein frischer Chat allein anhand der Dateien sagen kann, was gilt, was als Nächstes ansteht und woran es geprüft wird.** Der erste eingetragene Arbeitsschritt lautet „Gesamte Produktvision in überprüfbare Etappen übersetzen“.

### Schritt 2 · Die eingerichtete Arbeitsweise für die Planung benutzen

1. Ordne jede Anforderung aus den Abschnitten 2–8 einer Etappe in `PLAN.md` zu. Verweise auf die jeweiligen Abschnitte. Unterscheide bestätigte Entscheidungen, gestalterische Zielbilder und offene Fragen.
2. Beschreibe pro Etappe, was der Gärtner damit tun kann, welche Vorarbeiten nötig sind und woran sich die Funktion prüfen lässt. Nutze die Beispiele aus Abschnitt 9. Verorte die Untersuchungen aus Abschnitt 10 an den Stellen, wo ihr Ergebnis eine Entscheidung beeinflusst.
3. Prüfe die Abdeckung über den ganzen Nutzerweg. Bleibt zum Beispiel die Pflanzendarstellung vorerst offen, müssen Beetplanung, Pflanzenzahlen und Exporte trotzdem einen eigenen Platz im Plan haben.
4. Wähle einen ersten zusammenhängenden Arbeitsablauf für die Umsetzung und begründe die Wahl. Begründe die Priorität anhand des aktuellen Nutzerziels und der größten offenen Abhängigkeit. Möhrenstreifen und Exporte sind ein fachlicher Prüffall innerhalb der Gesamtvision. Kennzeichne dafür benötigte Beispieldaten.
5. Führe für den vorgeschlagenen ersten Arbeitsablauf bereits in diesem Startauftrag eine gezielte GitHub-Recherche durch. Vergleiche die aussichtsreichsten Treffer und dokumentiere die konkrete Empfehlung mit Belegen in `PLAN.md`. Halte fest, was sich übernehmen lässt, welche Anpassung Season by Season braucht und mit welchem kleinen Test die Eignung in der Umsetzung überprüft wird. Für weitere Etappen genügt zunächst die jeweils offene Recherchefrage.
6. Aktualisiere den Einstieg in `PLAN.md` für den nächsten Chat. Melde die angelegten Dateien, das erste überprüfbare Umsetzungsergebnis, das du empfiehlst, und gegebenenfalls eine Produktentscheidung, die dafür wirklich nötig ist.


### Vom abgeschlossenen Startauftrag in die eigenständige Umsetzung

Ein aktives Laufziel bestimmt, welches vorführbare Ergebnis jetzt erreicht werden soll. Der bestehende Plan, seine sieben Etappen (sofern bereits angelegt) und die bisherigen Rechercheergebnisse bilden den Ausgangspunkt. Zwischenberichte dokumentieren den Fortschritt. Nach abgeschlossenen Teilaufgaben setzt der Hauptagent seine Arbeit fort, solange ein sinnvoller Schritt im vereinbarten Umfang möglich ist. Veröffentlichungen, externe Schreibzugriffe und Entscheidungen über die Produktvision folgen den Zuständigkeiten oben.

**Historischer erster Prüffall (bereits als Startziel angelegt; nicht mehr als aktuelle Richtlinie für die Grundflächenbildung zu lesen).** Im lokalen Prototyp einen realen Garten auf der Karte mit einem Polygon auswählen. Ein geeignetes, für den Versuch nutzbares Luftbild auswerten. Mindestens ein Beet und einen angrenzenden Weg mit bekannten Grenzen vergleichen und im selben Garten das Beet in einer ersten isometrischen Strichelansicht anwählen, mit einer Kultur belegen und nach erneutem Öffnen wiederfinden.

**Nachweis.** Luftbildquelle und Referenzgrenzen dokumentieren. Festhalten, welche Konturen und Objektarten die Software erkennt, welche per Hand vorgegeben wurden und wo Abweichungen liegen. Den Weg von der Karte bis zum gespeicherten Beet tatsächlich durchspielen und für das Review vorzeigbar machen. Synthetische Geometrie kann unabhängige Arbeiten ermöglichen. Die Prüfung der Erkennung an einem echten Garten bleibt dann offen. Der Reviewer beurteilt am Ende auch, ob die Belege das Nutzerziel abdecken. Hängt die weitere Arbeit an einer Produktentscheidung, benennt der Hauptagent die konkrete Wahl und ihre Auswirkung. Eine solche fachliche Rückfrage kann auch die Qualität der Erkennung oder den gestalterischen Eindruck betreffen.

Dieses erste Laufziel lässt Raum für die Wahl der Technik und der Etappenreihenfolge. Die weiteren Produktanforderungen einschließlich der Exporte bleiben im Entwicklungsplan.

### Zwei erste Ansatzpunkte für die GitHub-Recherche

| Baustein | Vorhandene Funktion | Praxistest für Season by Season |
| --- | --- | --- |
| OpenLayers | Mit der Zeicheninteraktion lassen sich Polygone auf einer Webkarte erfassen. `finishDrawing()` kann an die Enter-Taste angebunden werden. [Repository](https://github.com/openlayers/openlayers) · [Zeichenbeispiel](https://openlayers.org/en/latest/examples/edit-geographic.html) · [API](https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw-Draw.html) | Gartengrenze mit der Maus setzen, per Enter abschließen, speichern und wieder öffnen. Die Grundstücksgrenze muss am selben Ort liegen. |
| SamGeo | Das Python-Paket segmentiert georeferenzierte GeoTIFF-Bilder und kann erkannte Umrisse als GeoJSON ausgeben; **nur als mögliche nachgeordnete Unterstützung, nicht als Erzeuger der verbindlichen Grundflächen**. [Repository und Funktionsumfang](https://github.com/opengeos/segment-geospatial) | An einem nutzbaren Luftbild mit zwei bekannten Beeten und einem schmalen Zwischenweg die Umrisse mit manuell markierten Grenzen vergleichen. Getrennt prüfen, ob sich die Flächen den richtigen Objektarten zuordnen lassen. |

Beide Kandidaten sind anhand der Projektdokumentation recherchiert. Der Integrationsentscheid hängt vom Praxistest und von den Anforderungen des jeweiligen Arbeitsschritts ab.
