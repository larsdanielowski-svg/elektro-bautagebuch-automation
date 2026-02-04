const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data', 'bautagebuch.json');

// Realistische Mock-Daten für Elektro-BauLog
const mockProjekte = [
  {
    id: 'projekt-1',
    name: 'Wohnhaus Müllerstraße',
    adresse: 'Müllerstraße 12, 12345 Berlin',
    beschreibung: 'Komplette Elektroinstallation im Neubau',
    startDatum: '2026-01-15',
    status: 'aktiv',
    fortschritt: 65,
    kunde: 'Familie Schmidt'
  },
  {
    id: 'projekt-2',
    name: 'Bürogebäude TechPark',
    adresse: 'TechPark 5, 12345 Berlin',
    beschreibung: 'Modernisierung der Elektroanlage',
    startDatum: '2026-01-20',
    status: 'aktiv',
    fortschritt: 40,
    kunde: 'TechPark GmbH'
  },
  {
    id: 'projekt-3',
    name: 'Einkaufszentrum Nord',
    adresse: 'Hauptstraße 1, 12345 Berlin',
    beschreibung: 'Beleuchtungsinstallation im Einkaufszentrum',
    startDatum: '2026-02-01',
    status: 'aktiv',
    fortschritt: 25,
    kunde: 'Einkaufszentrum Nord GmbH'
  }
];

const elektroElemente = [
  'Kabelkanal verlegt', 'Schalter montiert', 'Steckdose angeschlossen', 
  'Leitung verlegt', 'Verteilerkasten installiert', 'Beleuchtung vorbereitet',
  'Kabelbündel gesichert', 'Sicherung eingebaut', 'Installationsrohr verlegt',
  'Kabeldurchführung montiert', 'Anschlussdose installiert', 'Klemmen angeschlossen',
  'LED-Beleuchtung installiert', 'Notbeleuchtung getestet', 'FI-Schutzschalter geprüft',
  'Datenkabel verlegt', 'LAN-Dosen angeschlossen', 'Smart-Home Komponenten installiert',
  'Photovoltaik-Anlage verkabelt', 'Wallbox für E-Auto installiert'
];

const standorte = [
  'EG Wohnzimmer', 'EG Küche', 'EG Bad', 'EG Flur',
  '1. OG Schlafzimmer', '1. OG Arbeitszimmer', '1. OG Bad',
  'Keller Technikraum', 'Keller Waschküche', 'Dachboden',
  'Außenbereich Terrasse', 'Außenbereich Garten', 'Garage'
];

function generiereMockEintraege() {
  const eintraege = [];
  const heute = new Date();
  
  // Für jedes Projekt mehrere Einträge erstellen
  mockProjekte.forEach(projekt => {
    const anzahlEintraege = Math.floor(Math.random() * 5) + 3; // 3-7 Einträge pro Projekt
    
    for (let i = 0; i < anzahlEintraege; i++) {
      const tageZurueck = Math.floor(Math.random() * 14); // Letzte 14 Tage
      const datum = new Date(heute);
      datum.setDate(datum.getDate() - tageZurueck);
      
      // Fortschritt basierend auf Projektfortschritt mit Variation
      const baseFortschritt = projekt.fortschritt;
      const variation = Math.floor(Math.random() * 20) - 10; // -10% bis +10%
      const fortschritt = Math.max(0, Math.min(100, baseFortschritt + variation));
      
      // Elemente basierend auf Fortschritt auswählen
      let erkannteElemente = [];
      if (fortschritt < 30) {
        erkannteElemente = elektroElemente.slice(0, 3);
      } else if (fortschritt < 70) {
        erkannteElemente = elektroElemente.slice(3, 7);
      } else {
        erkannteElemente = elektroElemente.slice(7, 12);
      }
      
      // Status basierend auf Fortschritt
      let status = 'begonnen';
      if (fortschritt > 50) status = 'in Arbeit';
      if (fortschritt > 80) status = 'fertig';
      
      eintraege.push({
        id: `eintrag-${projekt.id}-${i}`,
        bildPfad: `/uploads/mock-image-${projekt.id}-${i}.jpg`,
        hochgeladenAm: datum.toISOString(),
        analyse: {
          dateiname: `baustelle-${projekt.id}-${i}.jpg`,
          analyseDatum: datum.toISOString(),
          erkannteElemente: erkannteElemente,
          fortschrittProzent: fortschritt,
          beschreibung: `Aufnahme zeigt Elektroinstallation im Projekt "${projekt.name}". Geschätzter Fertigstellungsgrad: ${fortschritt}%.`,
          status: status,
          sicherheitsrisiken: fortschritt < 50 ? ['Offene Kabelenden', 'Ungesicherte Leitungen'] : ['Keine offensichtlichen Sicherheitsrisiken erkannt'],
          empfehlungen: [
            'Installation gemäß VDE fortsetzen',
            fortschritt < 30 ? 'Material nachbestellen' : 'Qualitätskontrolle durchführen',
            'Dokumentation aktualisieren'
          ],
          naechsteSchritte: [
            fortschritt < 40 ? 'Weitere Leitungen verlegen' : 'Anschlüsse vorbereiten',
            fortschritt < 70 ? 'Schalter und Steckdosen montieren' : 'Endabnahme vorbereiten'
          ],
          aiModel: "mock-fallback"
        },
        projekt: projekt.name,
        standort: standorte[Math.floor(Math.random() * standorte.length)],
        bemerkungen: `Arbeitsschritt ${i+1} im Bereich ${projekt.name}`,
        verwendetesModel: "mock-fallback"
      });
    }
  });
  
  return eintraege;
}

// Daten generieren und speichern
const mockData = {
  eintraege: generiereMockEintraege(),
  projekte: mockProjekte
};

fs.writeFileSync(dataFile, JSON.stringify(mockData, null, 2));
console.log(`✅ Mock-Daten generiert: ${mockData.eintraege.length} Einträge für ${mockData.projekte.length} Projekte`);
console.log(`📁 Gespeichert in: ${dataFile}`);

// Statistik ausgeben
const stats = {
  gesamtEintraege: mockData.eintraege.length,
  projekte: mockData.projekte.map(p => `${p.name} (${p.fortschritt}% Fortschritt)`),
  durchschnittlicherFortschritt: Math.round(mockData.eintraege.reduce((sum, e) => sum + e.analyse.fortschrittProzent, 0) / mockData.eintraege.length)
};

console.log('\n📊 Statistik:');
console.log(`Gesamtanzahl Einträge: ${stats.gesamtEintraege}`);
console.log(`Durchschnittlicher Fortschritt: ${stats.durchschnittlicherFortschritt}%`);
console.log('Projekte:');
stats.projekte.forEach(p => console.log(`  - ${p}`));