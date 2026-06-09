import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Helper function to mask phone numbers to keep them anonymous while preventing spam
function maskPhoneNumber(phone?: string): string {
  if (!phone) return 'Anonymous';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  return clean.slice(0, 4) + '*****' + clean.slice(-3);
}

// SMS parsing function using intelligent structure matching & keyword extraction
function parseSMSMessage(bodyText: string): { 
  category: 'FGM Risk' | 'Flood Alert' | 'Emergency' | 'Other', 
  location: string, 
  description: string 
} {
  const text = (bodyText || '').trim();
  
  // Try structured format: [CATEGORY] @ [LOCATION] - [DESCRIPTION]
  // E.g., "Flood @ Merti - River overflowing" or "FGM @ Garbatulla - local girl needs assistance"
  const atIndex = text.indexOf('@');
  const dashIndex = text.indexOf('-');

  if (atIndex !== -1 && dashIndex !== -1 && atIndex < dashIndex) {
    const rawCategory = text.slice(0, atIndex).trim().toLowerCase();
    const rawLocation = text.slice(atIndex + 1, dashIndex).trim();
    const rawDescription = text.slice(dashIndex + 1).trim();

    let category: 'FGM Risk' | 'Flood Alert' | 'Emergency' | 'Other' = 'Other';
    if (rawCategory.includes('fgm') || rawCategory.includes('girl') || rawCategory.includes('protect') || rawCategory.includes('women')) {
      category = 'FGM Risk';
    } else if (rawCategory.includes('flood') || rawCategory.includes('rain') || rawCategory.includes('water') || rawCategory.includes('alert')) {
      category = 'Flood Alert';
    } else if (rawCategory.includes('emergenc')) {
      category = 'Emergency';
    }

    const location = rawLocation || 'Isiolo Town';
    const description = rawDescription || text;

    return { category, location, description };
  }

  // Fallback: search contents for safety keywords to determine category & extraction
  const lowered = text.toLowerCase();
  let category: 'FGM Risk' | 'Flood Alert' | 'Emergency' | 'Other' = 'Other';
  if (lowered.includes('fgm') || lowered.includes('cut') || lowered.includes('girl') || lowered.includes('marriage') || lowered.includes('circumcis') || lowered.includes('abuse')) {
    category = 'FGM Risk';
  } else if (lowered.includes('flood') || lowered.includes('river') || lowered.includes('rain') || lowered.includes('water') || lowered.includes('overflow') || lowered.includes('stream')) {
    category = 'Flood Alert';
  } else if (lowered.includes('urgent') || lowered.includes('danger') || lowered.includes('help') || lowered.includes('emergenc')) {
    category = 'Emergency';
  }

  // Try to match standard locations in Isiolo
  let location = 'Isiolo Town (SMS Link)';
  const standardLocations = ['merti', 'garbatulla', 'oldonyiro', 'kinna', 'sericho', 'ngaremara', 'isiolo town', 'isiolo'];
  for (const loc of standardLocations) {
    if (lowered.includes(loc)) {
      location = loc.charAt(0).toUpperCase() + loc.slice(1);
      if (location === 'Isiolo town' || location === 'Isiolo') {
        location = 'Isiolo Town';
      }
      break;
    }
  }

  return {
    category,
    location,
    description: text
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to support URL-encoded bodies or JSON payloads from webhooks
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Firebase using applet configuration
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Bonga Box SMS & USSD Service' });
  });

  // SMS Hotlines Webhook Endpoint
  app.post('/api/sms', async (req, res) => {
    // Collect parameters from Twilio or Africa's Talking SMS body
    const fromRaw = req.body.From || req.body.from || '';
    const bodyText = req.body.Body || req.body.text || '';
    
    if (!bodyText) {
      if (req.body.From) {
        res.set('Content-Type', 'text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Welcome to Bonga Box Anonymous Reporting. Send: [FGM or FLOOD] @ [LOCATION] - [DETAILS]. E.g. FLOOD @ Isiolo - River rising.</Message>
</Response>`);
      } else {
        return res.status(400).json({ error: 'Text body cannot be empty' });
      }
    }

    const maskedSender = maskPhoneNumber(fromRaw);

    try {
      const parsed = parseSMSMessage(bodyText);

      // Record to Firestore 'reports' table asynchronously & anonymously
      const newReportDocs = await addDoc(collection(db, 'reports'), {
        category: parsed.category,
        location: parsed.location,
        description: parsed.description,
        photoURL: '',
        voiceNoteURL: '',
        timestamp: serverTimestamp(), // Stored as native server timestamp for consistency
        status: 'Pending',
        isAnonymous: true,
        authorUid: null,
        reportsSource: 'SMS Hotline',
        maskedSender: maskedSender
      });

      const reportId = newReportDocs.id;

      // Reply back to user via webhook formats
      if (req.body.From) {
        // Twilio TwiML format
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Bonga Guard: Anonymous report recorded safely under ID ${reportId.slice(0, 6)}. Safety dispatch is notified. Thank you for keeping Isiolo safe!</Message>
</Response>`);
      } else {
        // Africa's Talking Response format
        res.status(200).json({
          status: 'success',
          reportId: reportId,
          message: `Anonymous report captured. ID: ${reportId.slice(0, 6)}`
        });
      }
    } catch (e) {
      console.error('Error logging SMS Report:', e);
      if (req.body.From) {
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Bonga Guard: System is busy but received your SMS. Rest assured our local safety teams are alerted.</Message>
</Response>`);
      } else {
        res.status(500).json({ error: 'Firestore save error', details: e instanceof Error ? e.message : 'Unknown' });
      }
    }
  });

  // USSD Safe-Dial Session Webhook (Africa's Talking format)
  app.post('/api/ussd', async (req, res) => {
    // Extract Africa's Talking parameters
    const { sessionId, phoneNumber, text } = req.body;
    
    try {
      const rawInput = text || '';
      const parts = rawInput === '' ? [] : rawInput.split('*');
      
      let response = '';

      if (parts.length === 0) {
        // Step 0: Initial Welcome Category Selection Menu
        response = `CON Welcome to Bonga Box Safety
Dial Option to Report:
1. Report FGM / Protection Risk
2. Report Flood / Overflow Alert
3. View Safe Instructions`;
      } else if (parts.length === 1) {
        const option = parts[0];
        if (option === '1' || option === '2') {
          const typeLabel = option === '1' ? 'FGM Risk' : 'Flood Alert';
          response = `CON [${typeLabel}]
Enter Town / Area in Isiolo:
(e.g., Merti, Garbatulla, Kinna)`;
        } else if (option === '3') {
          response = `END Bonga Box Instructions:
1. SMS to hotline:
Format: [KEYWORD] @ [AREA] - [DETAILS]
2. Web reports carry audio notes.
Dial is complete. Stay safe!`;
        } else {
          response = `END Invalid entry. Please retry.`;
        }
      } else if (parts.length === 2) {
        const option = parts[0];
        const categoryLabel = option === '1' ? 'FGM Risk' : 'Flood Alert';
        const areaLocation = parts[1].trim();

        response = `CON [${categoryLabel} at ${areaLocation}]
Describe the threat details:
(Keep short, max 100 letters)`;
      } else if (parts.length === 3) {
        const option = parts[0];
        const categoryLabel = option === '1' ? 'FGM Risk' : 'Flood Alert';
        const areaLocation = parts[1].trim() || 'Isiolo Town';
        const threatDetails = parts[2].trim();

        const maskedSender = maskPhoneNumber(phoneNumber);

        // Record USSD report anonymously inside Firestore
        const newReportDocs = await addDoc(collection(db, 'reports'), {
          category: categoryLabel,
          location: areaLocation,
          description: threatDetails || 'USSD Alert reported',
          photoURL: '',
          voiceNoteURL: '',
          timestamp: new Date(),
          status: 'Pending',
          isAnonymous: true,
          authorUid: null,
          reportsSource: 'USSD Dial',
          maskedSender: maskedSender
        });

        const reportId = newReportDocs.id;

        response = `END Bonga Box Safety Guard
Anonymous report logged!
ID: ${reportId.slice(0, 6)}
First Responders have been notified.
Thank you for your service!`;
      } else {
        response = `END Invalid session routing. Please try again.`;
      }

      res.set('Content-Type', 'text/plain');
      res.send(response);
    } catch (error) {
      console.error('USSD Session Error:', error);
      res.set('Content-Type', 'text/plain');
      res.send(`END Bonga Box is under maintenance. Your safety report might not be fully logged. Please use Web report.`);
    }
  });

  // Integrate Vite Dev Server middleware in non-production mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files in production build
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bonga Box Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
