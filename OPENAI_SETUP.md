# OpenAI Vision API Integration - Setup Guide

## Voraussetzungen

1. **OpenAI API Account** mit aktiviertem GPT-4 Vision
2. **API Key** von OpenAI Dashboard
3. Node.js Version 16+ installiert

## Installation

```bash
cd /home/node/.openclaw/workspace/projects/elektro-bautagebuch
npm install
```

## API Key Konfiguration

### Option 1: Umgebungsvariable (Empfohlen)
```bash
# .env Datei erstellen
cp .env.example .env
# API Key in .env eintragen
nano .env
```

### Option 2: Direkt im Code (nur für Testing)
```javascript
// In server.js:
const openai = new OpenAI({
  apiKey: 'sk-proj-your-actual-api-key-here',
});
```

## Server starten

```bash
# Entwicklung mit Auto-Reload
npm run dev

# Produktion
npm start
```

## Test der OpenAI Integration

1. Server starten
2. Browser öffnen: http://localhost:3000
3. Baustellenfoto hochladen
4. OpenAI Vision analysiert automatisch das Bild

## Erwartete KI-Analyse

Die OpenAI Vision API erkennt:
- **Elektrische Komponenten**: Kabel, Schalter, Leitungen, Verteiler
- **Fortschritt**: Prozentuale Fertigstellung
- **Sicherheitsrisiken**: Offene Leitungen, fehlende Abdeckungen
- **Empfehlungen**: Nächste Arbeitsschritte

## Fehlerbehandlung

### Fallback zu Mock-Daten
Wenn die OpenAI API nicht verfügbar ist (Rate Limit, kein API Key), verwendet das System automatisch Mock-Daten.

### API Fehler
- API Key ungültig/abgelaufen: Mock-Daten
- Rate Limit erreicht: Warte 60 Sekunden
- Netzwerkfehler: Retry nach 5 Sekunden

## Kosten

**Achtung**: GPT-4 Vision API verursacht Kosten!
- Pro Bild: ~0.01-0.05 USD (abhängig von Bildgröße)
- Tägliches Limit empfohlen: 100 Bilder/Tag

## Erweiterungsmöglichkeiten

### 1. Bild-Vergleich
```javascript
// Vergleich mit vorherigen Bildern desselben Standorts
async function compareWithPrevious(imagePath, location) {
  // Implementierung
}
```

### 2. Mehrsprachige Analyse
```javascript
const prompt = `Analyze this construction site photo...`;
// Auf Deutsch, Englisch, etc. anpassbar
```

### 3. Qualitätsprüfung
```javascript
function validateAnalysis(analysis) {
  // Prüfe ob Analyse plausibel ist
  if (analysis.fortschrittProzent > 100) return false;
  return true;
}
```

## Sicherheitshinweise

1. **API Key schützen**: Nie im Frontend-Code!
2. **Bilder vorverarbeiten**: Größe reduzieren vor API-Aufruf
3. **Rate Limiting**: Max. 10 Bilder/Minute
4. **Fehlerprotokollierung**: Alle API-Fehler loggen

## Testing

```bash
# Testbild hochladen
curl -X POST -F "image=@testbild.jpg" http://localhost:3000/api/upload
```

## Nächste Schritte (Phase 2)

1. WhatsApp-Bot Integration über Twilio
2. PDF-Generierung mit Berichten
3. Benutzerverwaltung
4. Projektmanagement-Features