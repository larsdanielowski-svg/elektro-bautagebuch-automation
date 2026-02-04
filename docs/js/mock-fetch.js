// Mock fetch für statische GitHub Pages Demo
const originalFetch = window.fetch;

// Mock-Daten (werden später von mock-data.js geladen)
let mockEintraege = [];
let mockProjekte = [];

// Lade Mock-Daten wenn verfügbar
if (window.mockData) {
  mockEintraege = window.mockData.eintraege || [];
  mockProjekte = window.mockData.projekte || [];
}

window.fetch = function(url, options = {}) {
  // Debug Log
  console.log(`[Mock Fetch] ${options.method || 'GET'} ${url}`, options);
  
  // Mock für /api/eintraege
  if (url === '/api/eintraege' && (!options.method || options.method === 'GET')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => mockEintraege,
      text: async () => JSON.stringify(mockEintraege)
    });
  }
  
  // Mock für /api/projekte GET
  if (url === '/api/projekte' && (!options.method || options.method === 'GET')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => mockProjekte,
      text: async () => JSON.stringify(mockProjekte)
    });
  }
  
  // Mock für /api/projekte POST
  if (url === '/api/projekte' && options.method === 'POST') {
    return new Promise(async (resolve) => {
      const body = JSON.parse(options.body);
      const newProject = {
        id: 'projekt-' + Date.now(),
        name: body.name,
        adresse: body.adresse || '',
        beschreibung: body.beschreibung || '',
        startDatum: new Date().toISOString(),
        status: 'aktiv',
        fortschritt: 0
      };
      
      mockProjekte.push(newProject);
      
      setTimeout(() => {
        resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, project: newProject }),
          text: async () => JSON.stringify({ success: true, project: newProject })
        });
      }, 300);
    });
  }
  
  // Mock für /api/statistik
  if (url === '/api/statistik') {
    const stats = {
      totalImages: mockEintraege.length,
      totalProjects: mockProjekte.length,
      avgProgress: mockEintraege.length > 0 
        ? Math.round(mockEintraege.reduce((sum, e) => sum + e.analyse.fortschrittProzent, 0) / mockEintraege.length)
        : 0,
      entriesLastWeek: mockEintraege.filter(e => {
        const date = new Date(e.hochgeladenAm);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length
    };
    
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => stats,
      text: async () => JSON.stringify(stats)
    });
  }
  
  // Mock für /api/upload POST
  if (url === '/api/upload' && options.method === 'POST') {
    return new Promise((resolve) => {
      // Simuliere Upload-Verzögerung
      setTimeout(() => {
        const fileName = options.body && options.body.get ? options.body.get('image')?.name || 'upload.jpg' : 'upload.jpg';
        const projectName = options.body && options.body.get ? options.body.get('projekt') || 'Standard Projekt' : 'Standard Projekt';
        const location = options.body && options.body.get ? options.body.get('standort') || 'Baustelle' : 'Baustelle';
        const notes = options.body && options.body.get ? options.body.get('bemerkungen') || '' : '';
        
        const mockEntry = {
          id: 'eintrag-mock-' + Date.now(),
          bildPfad: '/uploads/mock-upload.jpg',
          hochgeladenAm: new Date().toISOString(),
          analyse: {
            dateiname: fileName,
            analyseDatum: new Date().toISOString(),
            erkannteElemente: ['Kabelkanal verlegt', 'Leitung verlegt', 'Steckdose montiert'],
            fortschrittProzent: Math.floor(Math.random() * 30) + 50,
            beschreibung: 'Automatische KI-Analyse erfolgreich durchgeführt.',
            status: 'in Arbeit',
            sicherheitsrisiken: ['Keine offensichtlichen Sicherheitsrisiken erkannt'],
            empfehlungen: ['Installation gemäß VDE fortsetzen', 'Dokumentation aktualisieren'],
            naechsteSchritte: ['Weitere Leitungen verlegen', 'Anschlüsse vorbereiten'],
            aiModel: 'gpt-4-vision-preview-mock'
          },
          projekt: projectName,
          standort: location,
          bemerkungen: notes,
          verwendetesModel: 'gpt-4-vision-preview-mock'
        };
        
        mockEintraege.unshift(mockEntry);
        
        resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'Bild erfolgreich hochgeladen und KI-analyse durchgeführt',
            eintrag: mockEntry,
            aiModel: 'gpt-4-vision-preview-mock'
          }),
          text: async () => JSON.stringify({
            success: true,
            message: 'Bild erfolgreich hochgeladen und KI-analyse durchgeführt',
            eintrag: mockEntry,
            aiModel: 'gpt-4-vision-preview-mock'
          })
        });
      }, 1500);
    });
  }
  
  // Mock für DELETE /api/eintraege/:id
  if (url.startsWith('/api/eintraege/') && options.method === 'DELETE') {
    const id = url.split('/').pop();
    const index = mockEintraege.findIndex(e => e.id === id);
    
    if (index !== -1) {
      mockEintraege.splice(index, 1);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true })
      });
    } else {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Eintrag nicht gefunden' }),
        text: async () => JSON.stringify({ error: 'Eintrag nicht gefunden' })
      });
    }
  }
  
  // Für alle anderen Requests originale fetch verwenden
  return originalFetch(url, options);
};

console.log('[Mock Fetch] Mock API aktiviert für statische Demo');