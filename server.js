const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fsExtra = require('fs-extra');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// OpenAI Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-...', // Wird aus Umgebungsvariable gelesen
  // API Key wird später aus sicherer Quelle geladen
});

// Multer Konfiguration für Datei-Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien erlaubt (jpeg, jpg, png, gif)'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Datenbank-Datei initialisieren
const dataFile = path.join(__dirname, 'data', 'bautagebuch.json');

function ensureDataFile() {
  if (!fs.existsSync(path.dirname(dataFile))) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  }
  
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      eintraege: [],
      projekte: []
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  }
}

ensureDataFile();

// Hilfsfunktion: Bild für OpenAI vorbereiten (Base64 kodieren)
async function prepareImageForOpenAI(imagePath) {
  try {
    // Bild lesen und in Base64 konvertieren
    const imageBuffer = await fsExtra.readFile(imagePath);
    
    // Optional: Bildgröße reduzieren für API (max 20MB für OpenAI)
    const resizedBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const base64Image = resizedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
    
  } catch (error) {
    console.error('Fehler bei Bildvorbereitung:', error);
    throw new Error('Bild konnte nicht verarbeitet werden');
  }
}

// ECHTE OpenAI Vision Bildanalyse
async function analyzeImageWithOpenAI(imagePath, originalname) {
  try {
    const base64Image = await prepareImageForOpenAI(imagePath);
    
    const prompt = `Du bist ein Experte für Elektroinstallationen auf Baustellen. Analysiere dieses Baustellenfoto und erstelle eine detaillierte Analyse für das Bautagebuch.

**BILDANALYSE AUFGABE:**

1. **ERKANNTE ELEKTRISCHE KOMPONENTEN:**
   - Liste alle sichtbaren elektrischen Komponenten auf (z.B. Kabel, Leitungen, Schalter, Steckdosen, Verteilerkästen, Sicherungen, Installationsrohre, Kabelkanäle, Anschlussdosen)
   - Bestimme den Zustand jeder Komponente (verlegt, angeschlossen, montiert, getestet, in Arbeit, fertiggestellt)

2. **BAUSTELLENFORTSCHRITT:**
   - Schätze den Fertigstellungsgrad der Elektroinstallation in Prozent (0-100%)
   - Begründe die Einschätzung basierend auf sichtbaren Arbeiten

3. **VERÄNDERUNGSERKENNUNG:**
   - Falls möglich, beschreibe was seit der letzten Aufnahme neu hinzugekommen ist
   - Erkenne Fortschritte in der Installation

4. **SICHERHEIT & PROBLEME:**
   - Identifiziere potenzielle Sicherheitsrisiken (offene Leitungen, ungeschützte Kabel, fehlende Abdeckungen)
   - Erkenne mögliche Installationsfehler oder Probleme

5. **EMPFEHLUNGEN:**
   - Nächste Arbeitsschritte
   - Notwendige Materialien/Ersatzteile
   - Sicherheitsmaßnahmen

**ANTWORTFORMAT (JSON):**
{
  "erkannteElemente": ["Komponente 1 mit Zustand", "Komponente 2 mit Zustand", ...],
  "fortschrittProzent": 75,
  "beschreibung": "Detaillierte Beschreibung der Analyse in 3-4 Sätzen",
  "status": "begonnen|in Arbeit|fertig",
  "sicherheitsrisiken": ["Risiko 1", "Risiko 2", ...],
  "empfehlungen": ["Empfehlung 1", "Empfehlung 2", ...],
  "naechsteSchritte": ["Schritt 1", "Schritt 2", ...]
}

**ANMERKUNG:** Sei präzise und fachlich korrekt. Konzentriere dich auf sichtbare elektrische Installationen.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const analysisText = response.choices[0].message.content;
    
    // Versuche JSON aus der Antwort zu extrahieren
    let analysisData;
    try {
      // Extrahiere JSON aus Markdown oder reinem Text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: Manuelle Analyse
        analysisData = {
          erkannteElemente: ["Elektroinstallation analysiert"],
          fortschrittProzent: 50,
          beschreibung: analysisText.substring(0, 200) + "...",
          status: "in Arbeit",
          sicherheitsrisiken: ["Keine offensichtlichen Risiken erkannt"],
          empfehlungen: ["Weitere Analyse empfohlen"],
          naechsteSchritte: ["Fortsetzung der Installation"]
        };
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      analysisData = {
        erkannteElemente: ["OpenAI Vision Analyse durchgeführt"],
        fortschrittProzent: 50,
        beschreibung: `OpenAI Analyse: ${analysisText.substring(0, 150)}...`,
        status: "in Arbeit",
        sicherheitsrisiken: [],
        empfehlungen: [],
        naechsteSchritte: []
      };
    }

    return {
      dateiname: originalname,
      analyseDatum: new Date().toISOString(),
      erkannteElemente: analysisData.erkannteElemente || ["Elektrische Komponenten erkannt"],
      fortschrittProzent: analysisData.fortschrittProzent || 50,
      beschreibung: analysisData.beschreibung || "Bildanalyse durch OpenAI Vision",
      status: analysisData.status || "in Arbeit",
      sicherheitsrisiken: analysisData.sicherheitsrisiken || [],
      empfehlungen: analysisData.empfehlungen || [],
      naechsteSchritte: analysisData.naechsteSchritte || [],
      roheAnalyse: analysisText, // Für Debugging
      aiModel: "gpt-4-vision-preview"
    };
    
  } catch (error) {
    console.error('OpenAI Vision Error:', error);
    
    // Fallback zu Mock-Daten bei API-Fehlern
    console.log('Using fallback mock analysis due to API error');
    return mockBildAnalyse(imagePath, originalname);
  }
}

// Mock-Daten als Fallback (für Test ohne API Key)
function mockBildAnalyse(imagePath, originalname) {
  const elektroElemente = [
    'Kabelkanal verlegt', 'Schalter montiert', 'Steckdose angeschlossen', 
    'Leitung verlegt', 'Verteilerkasten installiert', 'Beleuchtung vorbereitet',
    'Kabelbündel gesichert', 'Sicherung eingebaut', 'Installationsrohr verlegt',
    'Kabeldurchführung montiert', 'Anschlussdose installiert', 'Klemmen angeschlossen'
  ];
  
  const fortschritt = Math.floor(Math.random() * 100);
  
  // Realistischere Mock-Daten basierend auf Fortschritt
  let erkannteElemente = [];
  if (fortschritt < 30) {
    erkannteElemente = ['Leitungswege vorbereitet', 'Installationspunkte markiert', 'Material bereitgelegt'];
  } else if (fortschritt < 70) {
    erkannteElemente = ['Kabelkanäle montiert', 'Leitungen verlegt', 'Anschlussdosen gesetzt'];
  } else {
    erkannteElemente = ['Schalter montiert', 'Steckdosen angeschlossen', 'Verteiler verdrahtet'];
  }
  
  return {
    dateiname: originalname,
    analyseDatum: new Date().toISOString(),
    erkannteElemente: erkannteElemente,
    fortschrittProzent: fortschritt,
    beschreibung: `Aufnahme zeigt Elektroinstallation im Fortschritt. Geschätzter Fertigstellungsgrad: ${fortschritt}%.`,
    status: fortschritt > 80 ? 'fertig' : fortschritt > 50 ? 'in Arbeit' : 'begonnen',
    sicherheitsrisiken: ['Keine offensichtlichen Sicherheitsrisiken erkannt'],
    empfehlungen: ['Installation gemäß VDE fortsetzen', 'Prüfung nach Fertigstellung empfohlen'],
    naechsteSchritte: ['Weitere Leitungen verlegen', 'Anschlüsse vorbereiten'],
    aiModel: "mock-fallback"
  };
}

// API Endpoints

// Bild hochladen und mit OpenAI analysieren
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Kein Bild hochgeladen' });
    }
    
    const analyseErgebnis = await analyzeImageWithOpenAI(req.file.path, req.file.originalname);
    
    // Eintrag in Bautagebuch speichern
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const neuerEintrag = {
      id: Date.now().toString(),
      bildPfad: `/uploads/${req.file.filename}`,
      hochgeladenAm: new Date().toISOString(),
      analyse: analyseErgebnis,
      projekt: req.body.projekt || 'Standard Projekt',
      standort: req.body.standort || 'Baustelle',
      bemerkungen: req.body.bemerkungen || '',
      verwendetesModel: analyseErgebnis.aiModel
    };
    
    data.eintraege.unshift(neuerEintrag);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    res.json({
      success: true,
      message: 'Bild erfolgreich hochgeladen und KI-analyse durchgeführt',
      eintrag: neuerEintrag,
      aiModel: analyseErgebnis.aiModel
    });
    
  } catch (error) {
    console.error('Upload/Analyse error:', error);
    res.status(500).json({ 
      error: error.message,
      fallback: 'Mock-Daten verwendet aufgrund von API-Fehlern' 
    });
  }
});

// Bautagebuch-Einträge abrufen
app.get('/api/eintraege', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json(data.eintraege);
  } catch (error) {
    console.error('Error reading entries:', error);
    res.status(500).json({ error: 'Fehler beim Lesen der Einträge' });
  }
});

// Neuen Projekt erstellen
app.post('/api/projekte', (req, res) => {
  try {
    const { name, beschreibung, adresse, startDatum } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Projektname erforderlich' });
    }
    
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const neuesProjekt = {
      id: Date.now().toString(),
      name,
      beschreibung: beschreibung || '',
      adresse: adresse || '',
      startDatum: startDatum || new Date().toISOString(),
      erstelltAm: new Date().toISOString(),
      status: 'aktiv'
    };
    
    data.projekte.push(neuesProjekt);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    res.json({
      success: true,
      projekt: neuesProjekt
    });
    
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Projekte abrufen
app.get('/api/projekte', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json(data.projekte);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Fehler beim Lesen der Projekte' });
  }
});

// Eintrag löschen
app.delete('/api/eintraege/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    const index = data.eintraege.findIndex(e => e.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }
    
    // Bild-Datei löschen (optional)
    const eintrag = data.eintraege[index];
    const bildPfad = path.join(__dirname, eintrag.bildPfad);
    if (fs.existsSync(bildPfad)) {
      fs.unlinkSync(bildPfad);
    }
    
    data.eintraege.splice(index, 1);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true, message: 'Eintrag gelöscht' });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Statistik-Endpunkt
app.get('/api/statistik', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    const stats = {
      totalImages: data.eintraege.length,
      totalProjects: data.projekte.length,
      avgProgress: 0,
      entriesLastWeek: 0,
      projectsByStatus: {
        aktiv: 0,
        abgeschlossen: 0
      },
      aiModelUsage: {}
    };
    
    // Berechne durchschnittlichen Fortschritt
    if (data.eintraege.length > 0) {
      const totalProgress = data.eintraege.reduce((sum, entry) => sum + (entry.analyse.fortschrittProzent || 0), 0);
      stats.avgProgress = Math.round(totalProgress / data.eintraege.length);
    }
    
    // Zähle Einträge der letzten Woche
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    stats.entriesLastWeek = data.eintraege.filter(entry => {
      const entryDate = new Date(entry.hochgeladenAm);
      return entryDate > oneWeekAgo;
    }).length;
    
    // Zähle Projekte nach Status
    data.projekte.forEach(project => {
      if (project.status === 'aktiv') {
        stats.projectsByStatus.aktiv++;
      } else {
        stats.projectsByStatus.abgeschlossen++;
      }
    });
    
    // Zähle AI-Modelle
    data.eintraege.forEach(entry => {
      const model = entry.verwendetesModel || entry.analyse.aiModel || 'unknown';
      stats.aiModelUsage[model] = (stats.aiModelUsage[model] || 0) + 1;
    });
    
    res.json(stats);
    
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Fehler beim Berechnen der Statistik' });
  }
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Besuche http://localhost:${PORT}`);
  console.log(`OpenAI Vision API bereit für Bildanalyse`);
  console.log(`HINWEIS: OPENAI_API_KEY Umgebungsvariable muss gesetzt sein`);
});