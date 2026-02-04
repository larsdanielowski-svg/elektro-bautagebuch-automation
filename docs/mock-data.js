// Mock-Daten für statische GitHub Pages Demo
window.mockData = {
  eintraege: [
    {
      id: "eintrag-projekt-1-0",
      bildPfad: "/uploads/mock-image-projekt-1-0.jpg",
      hochgeladenAm: "2026-01-28T07:59:26.441Z",
      analyse: {
        dateiname: "baustelle-projekt-1-0.jpg",
        analyseDatum: "2026-01-28T07:59:26.441Z",
        erkannteElemente: [
          "Leitung verlegt",
          "Verteilerkasten installiert",
          "Beleuchtung vorbereitet",
          "Kabelbündel gesichert"
        ],
        fortschrittProzent: 63,
        beschreibung: "Aufnahme zeigt Elektroinstallation im Projekt \"Wohnhaus Müllerstraße\". Geschätzter Fertigstellungsgrad: 63%.",
        status: "in Arbeit",
        sicherheitsrisiken: ["Keine offensichtlichen Sicherheitsrisiken erkannt"],
        empfehlungen: [
          "Installation gemäß VDE fortsetzen",
          "Qualitätskontrolle durchführen",
          "Dokumentation aktualisieren"
        ],
        naechsteSchritte: [
          "Anschlüsse vorbereiten",
          "Schalter und Steckdosen montieren"
        ],
        aiModel: "mock-fallback"
      },
      projekt: "Wohnhaus Müllerstraße",
      standort: "Keller Waschküche",
      bemerkungen: "Arbeitsschritt 1 im Bereich Wohnhaus Müllerstraße",
      verwendetesModel: "mock-fallback"
    },
    {
      id: "eintrag-projekt-1-1",
      bildPfad: "/uploads/mock-image-projekt-1-1.jpg",
      hochgeladenAm: "2026-01-29T07:59:26.441Z",
      analyse: {
        dateiname: "baustelle-projekt-1-1.jpg",
        analyseDatum: "2026-01-29T07:59:26.441Z",
        erkannteElemente: [
          "Leitung verlegt",
          "Verteilerkasten installiert",
          "Beleuchtung vorbereitet",
          "Kabelbündel gesichert"
        ],
        fortschrittProzent: 60,
        beschreibung: "Aufnahme zeigt Elektroinstallation im Projekt \"Wohnhaus Müllerstraße\". Geschätzter Fertigstellungsgrad: 60%.",
        status: "in Arbeit",
        sicherheitsrisiken: ["Keine offensichtlichen Sicherheitsrisiken erkannt"],
        empfehlungen: [
          "Installation gemäß VDE fortsetzen",
          "Qualitätskontrolle durchführen",
          "Dokumentation aktualisieren"
        ],
        naechsteSchritte: [
          "Anschlüsse vorbereiten",
          "Schalter und Steckdosen montieren"
        ],
        aiModel: "mock-fallback"
      },
      projekt: "Wohnhaus Müllerstraße",
      standort: "1. OG Arbeitszimmer",
      bemerkungen: "Arbeitsschritt 2 im Bereich Wohnhaus Müllerstraße",
      verwendetesModel: "mock-fallback"
    },
    {
      id: "eintrag-projekt-1-2",
      bildPfad: "/uploads/mock-image-projekt-1-2.jpg",
      hochgeladenAm: "2026-01-22T07:59:26.441Z",
      analyse: {
        dateiname: "baustelle-projekt-1-2.jpg",
        analyseDatum: "2026-01-22T07:59:26.441Z",
        erkannteElemente: [
          "Leitung verlegt",
          "Verteilerkasten installiert",
          "Beleuchtung vorbereitet",
          "Kabelbündel gesichert"
        ],
        fortschrittProzent: 55,
        beschreibung: "Aufnahme zeigt Elektroinstallation im Projekt \"Wohnhaus Müllerstraße\". Geschätzter Fertigstellungsgrad: 55%.",
        status: "in Arbeit",
        sicherheitsrisiken: ["Keine offensichtlichen Sicherheitsrisiken erkannt"],
        empfehlungen: [
          "Installation gemäß VDE fortsetzen",
          "Qualitätskontrolle durchführen",
          "Dokumentation aktualisieren"
        ],
        naechsteSchritte: [
          "Anschlüsse vorbereiten",
          "Schalter und Steckdosen montieren"
        ],
        aiModel: "mock-fallback"
      },
      projekt: "Wohnhaus Müllerstraße",
      standort: "1. OG Schlafzimmer",
      bemerkungen: "Arbeitsschritt 3 im Bereich Wohnhaus Müllerstraße",
      verwendetesModel: "mock-fallback"
    }
  ],
  projekte: [
    {
      id: "projekt-1",
      name: "Wohnhaus Müllerstraße",
      adresse: "Müllerstraße 12, 12345 Berlin",
      beschreibung: "Komplette Elektroinstallation im Neubau",
      startDatum: "2026-01-15",
      status: "aktiv",
      fortschritt: 65,
      kunde: "Familie Schmidt"
    },
    {
      id: "projekt-2",
      name: "Bürogebäude TechPark",
      adresse: "TechPark 5, 12345 Berlin",
      beschreibung: "Modernisierung der Elektroanlage",
      startDatum: "2026-01-20",
      status: "aktiv",
      fortschritt: 40,
      kunde: "TechPark GmbH"
    },
    {
      id: "projekt-3",
      name: "Einkaufszentrum Nord",
      adresse: "Hauptstraße 1, 12345 Berlin",
      beschreibung: "Beleuchtungsinstallation im Einkaufszentrum",
      startDatum: "2026-02-01",
      status: "aktiv",
      fortschritt: 25,
      kunde: "Einkaufszentrum Nord GmbH"
    }
  ]
};

// Mock API Funktionen für statische Demo
window.mockAPI = {
  async getEintraege() {
    return new Promise(resolve => {
      setTimeout(() => resolve(window.mockData.eintraege), 300);
    });
  },
  
  async getProjekte() {
    return new Promise(resolve => {
      setTimeout(() => resolve(window.mockData.projekte), 300);
    });
  },
  
  async getStatistik() {
    const stats = {
      totalImages: window.mockData.eintraege.length,
      totalProjects: window.mockData.projekte.length,
      avgProgress: Math.round(window.mockData.eintraege.reduce((sum, e) => sum + e.analyse.fortschrittProzent, 0) / window.mockData.eintraege.length),
      lastWeek: window.mockData.eintraege.filter(e => {
        const date = new Date(e.hochgeladenAm);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date > weekAgo;
      }).length
    };
    
    return new Promise(resolve => {
      setTimeout(() => resolve(stats), 300);
    });
  },
  
  async uploadImage(formData) {
    // Simuliere Upload und Analyse
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResponse = {
          success: true,
          message: "Bild erfolgreich hochgeladen und KI-analyse durchgeführt",
          eintrag: {
            id: "eintrag-mock-" + Date.now(),
            bildPfad: "/uploads/mock-upload.jpg",
            hochgeladenAm: new Date().toISOString(),
            analyse: {
              dateiname: formData.get('image').name,
              analyseDatum: new Date().toISOString(),
              erkannteElemente: ["Kabelkanal verlegt", "Leitung verlegt", "Steckdose montiert"],
              fortschrittProzent: Math.floor(Math.random() * 30) + 50,
              beschreibung: "Automatische KI-Analyse erfolgreich durchgeführt.",
              status: "in Arbeit",
              sicherheitsrisiken: ["Keine offensichtlichen Sicherheitsrisiken erkannt"],
              empfehlungen: ["Installation gemäß VDE fortsetzen", "Dokumentation aktualisieren"],
              naechsteSchritte: ["Weitere Leitungen verlegen", "Anschlüsse vorbereiten"],
              aiModel: "gpt-4-vision-preview-mock"
            },
            projekt: formData.get('projekt') || "Standard Projekt",
            standort: formData.get('standort') || "Baustelle",
            bemerkungen: formData.get('bemerkungen') || "",
            verwendetesModel: "gpt-4-vision-preview-mock"
          },
          aiModel: "gpt-4-vision-preview-mock"
        };
        resolve(mockResponse);
      }, 1500);
    });
  },
  
  async createProject(projectData) {
    return new Promise(resolve => {
      setTimeout(() => {
        const newProject = {
          id: "projekt-" + Date.now(),
          ...projectData,
          erstelltAm: new Date().toISOString(),
          status: "aktiv",
          fortschritt: 0
        };
        
        window.mockData.projekte.push(newProject);
        
        resolve({
          success: true,
          project: newProject
        });
      }, 300);
    });
  }
};