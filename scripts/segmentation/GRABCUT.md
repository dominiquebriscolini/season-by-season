# GrabCut · Vergleichslauf im Jardin Bagua

Der Versuch verwendet OpenCV 4.13.0 (`opencv-python-headless==4.13.0.92`) und NumPy 2.4.2 mit Python 3.11.9. GrabCut passt Vorder- und Hintergrund anhand der Pixel des Ausschnitts an. Das Verfahren verwendet keine vortrainierten Modellgewichte und erhält die Objektart vom Bediener. Der lokale Vergleichsrunner lädt keine Referenzpolygone.

## Schnittstelle und Herkunft

- OpenCV stellt `grabCut` und die Maskenklassen bereit. Das Projekt enthält einen Regressionstest für GrabCut. OpenCV 4.13.0 steht unter Apache-2.0. [Release](https://github.com/opencv/opencv/releases/tag/4.13.0) · [API](https://docs.opencv.org/4.13.0/d3/d47/group__imgproc__segmentation.html) · [Regressionstest](https://github.com/opencv/opencv/blob/4.13.0/modules/imgproc/test/test_grabcut.cpp) · [OpenCV-Lizenz](https://github.com/opencv/opencv/blob/4.13.0/LICENSE)
- Das verwendete CPU-Wheel führt die Build-Skripte unter MIT und liefert Hinweise für die enthaltenen Fremdbibliotheken, darunter FFmpeg unter LGPLv2.1. Die installierte Distribution enthält `LICENSE.txt` und `LICENSE-3RD-PARTY.txt`. Das Wheel bleibt eine lokale Testabhängigkeit. [Wheel-Version](https://github.com/opencv/opencv-python/releases/tag/92) · [Lizenzangaben zum Wheel](https://pypi.org/project/opencv-python-headless/4.13.0.92/#licensing) · [NumPy-Lizenz](https://github.com/numpy/numpy/blob/v2.4.2/LICENSE.txt)

## Festgelegter Ablauf

1. Je Objekt wird die Art gewählt. Zwei gegenüberliegende Klicks öffnen das Suchfenster, ein dritter markiert einen Vordergrundpunkt im Fenster.
2. Außerhalb des Fensters beziehungsweise Gartens setzt der Runner sicheren Hintergrund, innerhalb zunächst wahrscheinlichen Vordergrund. Der Vordergrundpunkt erhält einen sicheren Kreis mit zwei Pixel Radius. GrabCut läuft mit fünf Iterationen, festem Zufallsstart und einem CPU-Thread.
3. Es bleibt die vierfach zusammenhängende Komponente am Vordergrundpunkt. Unter 20 Maskenpixeln wird der Versuch als Fehlversuch erfasst. Die äußere Kontur wird auf einen Pixel angenähert, aus Pixelmittelpunkten in WGS84 überführt und geschlossen. Die Begrenzung am Garten ist rasterbasiert. Löcher und abgetrennte Komponenten werden im Ergebnis nicht modelliert.

## Wiederholen

Im Projektordner die gepinnten Testabhängigkeiten in einer separaten Python-Umgebung installieren. Der Runner schreibt ausschließlich in eine neue Ergebnisdatei. Dieselben Eingaben reproduzierten die Objektgeometrien bytegleich nach Ausklammerung der Laufzeiten.

```powershell
$segmentEnv = Join-Path $env:TEMP 'season-grabcut-check'
py -3.11 -m venv $segmentEnv
$segmentPython = Join-Path $segmentEnv 'Scripts/python.exe'
& $segmentPython -m pip install -r scripts/segmentation/requirements.txt
$result = Join-Path $env:TEMP ('season-grabcut-' + [guid]::NewGuid() + '.json')
& $segmentPython -B scripts/segmentation/grabcut.py evidence/segmentation/fixture.json evidence/segmentation/segment-input.json $result
```

Mit den vorab am Rohbild gewählten Positionen zeichnete die gemeinsame Chromium-Oberfläche 20 Eingaben in 157 ms auf. Dazu gehörten zwölf Bildklicks, vier Typklicks und viermal Enter. Das war eine automatisierte Wiedergabe ohne die vorherige visuelle Suche. Die Ausgabe von vier Konturkandidaten dauerte im eingefrorenen CPU-Lauf rund 2,82 s ab Beginn der Objektverarbeitung; ein weiterer Lauf dauerte rund 2,36 s. [Eingabeprotokoll](../../evidence/segmentation/segment-input.json) · [Eingefrorene Kandidaten](../../evidence/segmentation/segment-predictions.json)
