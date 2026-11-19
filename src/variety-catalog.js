export const varietyCatalog = [
  {
    id: 'sativa-bo54',
    crop: 'Bohne',
    name: 'Cupidon',
    source: {
      label: 'Sativa · Cupidon (bo54)',
      url: 'https://www.sativa.bio/de_ch/cupidon-filetbohne-buschbohne-bo54',
      note: 'Sortenangaben zur Buschbohne. 50 cm zwischen den Reihen und 9 cm in der Reihe sind die Mittelwerte der angegebenen Spannen (40–60 cm und 8–10 cm).',
    },
    values: { rowSpacingCm: 50, plantSpacingCm: 9 },
  },
  {
    id: 'saat-und-gut-maikoenig',
    crop: 'Kopfsalat',
    name: 'Maikönig',
    source: {
      label: 'Saat & Gut · Maikönig',
      url: 'https://www.saat-und-gut.de/bio-maikoenig-kopfsalat.html',
      note: '25 × 25 cm Pflanzabstand. Als Anbauweise ist hier die Frühjahrspflanzung aus Voranzucht ausgewählt. Der Anbieter nennt auch die Direktsaat im Sommer.',
    },
    values: { method: 'transplant', rowSpacingCm: 25, plantSpacingCm: 25 },
  },
  {
    id: 'sativa-ka16',
    crop: 'Möhre',
    name: 'Miso SG',
    source: {
      label: 'Sativa · Miso SG (ka16)',
      url: 'https://www.sativa.bio/de/miso-sg-karotte-ka16',
      note: 'Sortenangaben zur Aussaat und Entwicklungszeit von 100 Tagen. 30 cm zwischen den Reihen und 1,5 cm in der Reihe sind die Mittelwerte der angegebenen Spannen (25–35 cm und 1–2 cm).',
    },
    values: { method: 'sow', rowSpacingCm: 30, plantSpacingCm: 1.5, daysMin: 100, daysMax: 100 },
  },
  {
    id: 'bingenheimer-g286',
    crop: 'Möhre',
    name: 'Nantaise 2/Milan',
    source: {
      label: 'Bingenheimer Saatgut · Hauptkatalog 2025/26, S. 32 (G286)',
      url: 'https://info.bingenheimersaatgut.de/dateien/downloads/2025-2026_Hauptkatalog_DE_web.pdf',
      note: '90–110 Tage Kulturdauer für diese Sorte. Direktsaat und Abstände sind allgemeine Katalogangaben für Möhren im Freiland. Für das Formular werden die Mittelwerte der Spannen (30–50 cm und 2–3 cm) verwendet.',
    },
    values: { method: 'sow', rowSpacingCm: 40, plantSpacingCm: 2.5, daysMin: 90, daysMax: 110 },
  },
  {
    id: 'sativa-ra31',
    crop: 'Radieschen',
    name: 'Sora',
    source: {
      label: 'Sativa · Sora (ra31)',
      url: 'https://www.sativa.bio/de/sora-radies-ra31',
      note: 'Sortenangaben für Freiland. 20 cm zwischen den Reihen und 3,5 cm als Mittelwert der angegebenen Spanne von 3–4 cm in der Reihe.',
    },
    values: { method: 'sow', rowSpacingCm: 20, plantSpacingCm: 3.5 },
  },
  {
    id: 'sativa-to31',
    crop: 'Tomate',
    name: 'Zuckertraube RS',
    source: {
      label: 'Sativa · Zuckertraube RS (to31)',
      url: 'https://www.sativa.bio/de/zuckertraube-rs-cherrytomate-to31',
      note: 'Sortenangaben zur Cherrytomate. 75 cm zwischen den Reihen und 40 cm in der Reihe.',
    },
    values: { rowSpacingCm: 75, plantSpacingCm: 40 },
  },
  {
    id: 'sativa-zu26',
    crop: 'Zucchini',
    name: 'Alberello di Sarzana',
    source: {
      label: 'Sativa · Alberello di Sarzana (zu26)',
      url: 'https://www.sativa.bio/de/alberello-di-sarzana-zucchetti-hellgruen-prospecierara-zu26',
      note: 'Sortenangaben zur Zucchini. 100 cm zwischen den Reihen und 75 cm in der Reihe.',
    },
    values: { rowSpacingCm: 100, plantSpacingCm: 75 },
  },
]
