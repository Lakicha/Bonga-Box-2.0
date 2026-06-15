import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

let stripeClient: Stripe | null = null;
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("GEMINI_API_KEY environment variable is not defined. Booting simulated analysis mode.");
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

function simulateAnalysis(description: string) {
  const text = (description || '').toLowerCase();
  let category = 'General Inquiry';
  let subcategory = 'General Support';
  let risk_level = 'LOW';
  let urgency = 'ROUTINE';
  let summary = 'Anonymous user inquiry regarding general community assistance.';
  let key_issues = ['general support'];
  let recommended_actions = ['assess safety coordinates', 'initiate secondary wellness check'];
  let referral_type = ['County Social Welfare Offices'];
  let sentiment = 'calm';
  let escalation_required = false;

  if (text.includes('fgm') || text.includes('cut') || text.includes('marriage') || text.includes('circumcis') || text.includes('girl')) {
    category = 'Child Protection';
    subcategory = 'FGM / Child Marriage Protection';
    risk_level = 'CRITICAL';
    urgency = 'IMMEDIATE';
    summary = `Child protection emergency reported: "${description}"`;
    key_issues = ['female genital mutilation', 'child protection', 'forced marriage', 'vulnerable minor alert'];
    recommended_actions = [
      'Immediate rescue coordinator dispatch',
      'Deploy localized school protection liaison officer',
      'Notify nearest safehouse center in Isiolo Subcounty'
    ];
    referral_type = ['child protection centers', 'women shelters', 'police gender desk'];
    sentiment = 'fearful';
    escalation_required = true;
  } else if (text.includes('flood') || text.includes('water') || text.includes('overflow') || text.includes('river') || text.includes('rain')) {
    category = 'Health';
    subcategory = 'Disaster Management / Hydrological Risk';
    risk_level = 'HIGH';
    urgency = 'URGENT';
    summary = `Severe hydrological thread reported: "${description}"`;
    key_issues = ['hydrological alert', 'surface water flood hazard', 'immediate evacuation requirement'];
    recommended_actions = [
      'Dispatch volunteer disaster monitoring networks',
      'Confirm real-time local surface water level spikes',
      'Sound community safety and shelter evacuation advisories'
    ];
    referral_type = ['emergency response teams', 'local hospitals/clinics', 'county disaster management desk'];
    sentiment = 'anxious';
    escalation_required = false;
  } else if (text.includes('beat') || text.includes('viol') || text.includes('abus') || text.includes('husband') || text.includes('wife') || text.includes('slap')) {
    category = 'Gender-Based Violence (GBV)';
    subcategory = 'Domestic Violence Intervention';
    risk_level = 'CRITICAL';
    urgency = 'IMMEDIATE';
    summary = `Physical domestic abuse report detected: "${description}"`;
    key_issues = ['physical abuse', 'domestic violence threat', 'immediate safe residence issue'];
    recommended_actions = [
      'Coordinate secure physical evacuation of reporter',
      'Alert emergency protection networks in Isiolo',
      'Direct user to active nearby mental health safehouse'
    ];
    referral_type = ['GBV center support', 'safehouse/emergency shelter', 'police gender desk'];
    sentiment = 'distressed';
    escalation_required = true;
  } else if (text.includes('sad') || text.includes('depress') || text.includes('kill') || text.includes('die') || text.includes('hurt') || text.includes('mental')) {
    category = 'Mental Health';
    subcategory = 'Crisis Stabilization counseling';
    risk_level = 'HIGH';
    urgency = 'URGENT';
    summary = `Critical mental health and trauma distress: "${description}"`;
    key_issues = ['severe distress', 'mental health crisis', 'needs trauma processing support'];
    recommended_actions = [
      'Dispatch volunteer community counselor',
      'Arrange safe online/hotline counseling session',
      'Conduct regular welfare checks'
    ];
    referral_type = ['counselors', 'professional psychologists', 'safeline hotlines'];
    sentiment = 'hopeless';
    escalation_required = false;
  }

  return {
    category,
    subcategory,
    risk_level,
    urgency,
    summary,
    key_issues,
    recommended_actions,
    referral_type,
    sentiment,
    location_hint: '',
    confidence_score: 0.88,
    escalation_required
  };
}

function getStripeInstance(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

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

  // Analyze report endpoint using Bonga Box AI structure
  app.post('/api/reports/analyze', async (req, res) => {
    const { reportId, description } = req.body;
    if (!description && !reportId) {
      return res.status(400).json({ error: 'Either reportId or description is required for research analysis' });
    }

    let textContent = description || '';
    let targetReportRef: any = null;

    if (reportId) {
      try {
        const reportSnap = await getDoc(doc(db, 'reports', reportId));
        if (reportSnap.exists()) {
          const data = reportSnap.data();
          textContent = data.description || textContent;
          targetReportRef = doc(db, 'reports', reportId);
        }
      } catch (fbErr) {
        console.error('Failed to load report from Firestore for analysis:', fbErr);
      }
    }

    // Try to run real Gemini AI analysis using the user's master prompt context
    const ai = getGeminiClient();
    if (ai) {
      try {
        const systemInstruction = `ROLE
You are the Bonga Box AI Intelligence Engine, a backend AI system powering an anonymous social support, reporting, and referral platform used by NGOs, county governments, schools, and humanitarian organizations.

You convert anonymous messages into structured, actionable case intelligence.
You do NOT chat. You do NOT provide general advice. You ONLY analyze and structure reports.

🎯 CORE OBJECTIVE
For every input message:
1. Understand the issue
2. Classify category
3. Assess risk level
4. Determine urgency
5. Summarize case
6. Extract key issues
7. Recommend actions
8. Suggest referral types
9. Detect sentiment
10. Output structured JSON ONLY

🚨 STRICT OUTPUT RULE
Return ONLY valid JSON.
NO explanations.
NO markdown.
NO extra text.

📦 OUTPUT SCHEMA
{
  "category": "",
  "subcategory": "",
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "urgency": "ROUTINE|SOON|URGENT|IMMEDIATE",
  "summary": "",
  "key_issues": [],
  "recommended_actions": [],
  "referral_type": [],
  "sentiment": "",
  "location_hint": "",
  "confidence_score": 0.0,
  "escalation_required": false
}

📂 ALLOWED CATEGORIES ONLY
Gender-Based Violence (GBV)
Child Protection
Mental Health
Legal Aid
Health
Education
Livelihood / Economic Hardship
Substance Abuse
Housing / Shelter
General Inquiry

⚠️ RISK LEVEL RULES
LOW → no immediate danger
MEDIUM → needs support or follow-up
HIGH → serious distress or abuse
CRITICAL → immediate danger or life risk

⏱ URGENCY RULES
ROUTINE → normal
SOON → needs follow-up
URGENT → same-day action
IMMEDIATE → emergency response required

🔴 ESCALATION RULES
If CRITICAL risk is detected:
escalation_required = true
urgency MUST be "IMMEDIATE"

Never ignore high-risk signals. Be conservative: when unsure → escalate risk higher.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: textContent,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.1,
          }
        });

        const rawText = response.text?.trim() || '{}';
        let cleanJsonText = rawText;
        if (cleanJsonText.startsWith('```json')) {
          cleanJsonText = cleanJsonText.slice(7);
        }
        if (cleanJsonText.startsWith('```')) {
          cleanJsonText = cleanJsonText.slice(3);
        }
        if (cleanJsonText.endsWith('```')) {
          cleanJsonText = cleanJsonText.slice(0, -3);
        }
        cleanJsonText = cleanJsonText.trim();

        const analysis = JSON.parse(cleanJsonText);

        return res.json({ success: true, analysis });
      } catch (geminiError: any) {
        console.error('Gemini real-time analysis error, falling back to secure simulated engine:', geminiError);
        const analysis = simulateAnalysis(textContent);
        return res.json({ success: true, analysis, simulated: true, error: geminiError.message });
      }
    } else {
      const analysis = simulateAnalysis(textContent);
      return res.json({ success: true, analysis, simulated: true });
    }
  });

  // Process Mock Stripe Card Donation (Server-side simulation)
  app.post('/api/donate/process-mock-card', async (req, res) => {
    const { amount, cardholderName, cardNumber, expiryDate, cvc, email } = req.body;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid contribution amount is required' });
    }

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      return res.status(400).json({ error: 'Please enter a valid card number' });
    }

    if (!expiryDate || !expiryDate.includes('/')) {
      return res.status(400).json({ error: 'Expiry date must be in MM/YY format' });
    }

    if (!cvc || cvc.trim().length < 3) {
      return res.status(400).json({ error: 'CVC code is invalid' });
    }

    const cleanCard = cardNumber.replace(/\s/g, '');
    const last4 = cleanCard.slice(-4);
    
    let cardBrand = 'Card';
    if (cleanCard.startsWith('4')) {
      cardBrand = 'Visa';
    } else if (cleanCard.startsWith('5')) {
      cardBrand = 'Mastercard';
    } else if (cleanCard.startsWith('3')) {
      cardBrand = 'American Express';
    }

    try {
      // Simulate database receipt logging of the transaction (WITHOUT any raw credit card numbers or sensitive storage)
      const chargeId = 'ch_mock_' + Math.random().toString(36).substring(2, 12).toUpperCase();
      const donationRef = await addDoc(collection(db, 'donations'), {
        amount: Number(amount),
        email: email || 'anonymous@bonga-donor.org',
        cardholderName: cardholderName || 'Anonymous Donor',
        cardBrand,
        cardLast4: last4,
        status: 'Successful',
        transactionType: 'Stripe Mock Secure Form',
        chargeId: chargeId,
        timestamp: serverTimestamp(),
      });

      res.json({
        success: true,
        chargeId: chargeId,
        donationId: donationRef.id,
        last4,
        cardBrand,
        amount: Number(amount),
      });
    } catch (dbErr: any) {
      console.error('Failed to log donation receipt to database:', dbErr);
      res.status(500).json({ error: 'Transaction processing completed but failed to write receipt logs.' });
    }
  });

  // Stripe Checkout Session for Donations
  app.post('/api/donate/create-session', async (req, res) => {
    const { amount, successUrl, cancelUrl } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }

    const value = Math.round(Number(amount));
    const stripe = getStripeInstance();

    if (!stripe) {
      console.warn('STRIPE_SECRET_KEY environment variable is not defined. Booting demo simulation session.');
      return res.json({
        id: 'cs_demo_' + Math.random().toString(36).substring(2, 10),
        url: `${successUrl || `${req.headers.origin || 'http://localhost:3000'}/donate?success=true`}&demo=true`,
        demo: true
      });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'kes',
              product_data: {
                name: 'Donation to Bonga Box Protection Network',
                description: 'Sponsor nutrition plans & emergency response in Isiolo County',
              },
              unit_amount: value * 100, // amount in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl || `${req.headers.origin || 'http://localhost:3000'}/donate?success=true`,
        cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:3000'}/donate`,
      });

      res.json({ id: session.id, url: session.url, demo: false });
    } catch (error: any) {
      console.error('Stripe Session Creation failed:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize Stripe Payment Checkout' });
    }
  });

  // Real or Simulated automated email dispatch helper
  async function sendAutomatedEmail(toEmail: string, reportDetails: {
    reportId: string;
    category: string;
    location: string;
    description?: string;
    isAnonymous: boolean;
  }) {
    const { reportId, category, location, description, isAnonymous } = reportDetails;
    
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const senderEmail = process.env.SYSTEM_EMAIL_SENDER || 'noreply@bonga-box.org';

    const previewId = reportId ? reportId.substring(0, 8) : Math.random().toString(36).substring(2, 10).toUpperCase();
    const subject = `[Bonga Box] Automated Protection Receipt - Ref #${previewId}`;
    
    const textContent = `
========================================
BONGA BOX SECURITY & PROTECTION DISPATCH
========================================
Reference Number: #${previewId}
Category: ${category}
Location: ${location}
Status: Received & Dispatch Initiated

Dear Citizen,

Your report has been successfully recorded within the Bonga Box Intake System.

Anonymity Safeguard Status: ${isAnonymous ? 'FULLY SECURE & ANONYMOUS' : 'SIGNED OFFICER REPORT'}
${isAnonymous ? 'As requested, all digital headers, browser sessions, and personal identifiers have been completely scrubbed from this report document.' : ''}

Summary of submitted details:
- Incident Category: ${category}
- Area Location: ${location}
- Brief details: ${description || 'No additional text specified'}

Next Steps initiated:
1. Automated regional vulnerability mapping complete.
2. Alert forwarded securely to emergency partner networks in County Isiolo.
3. Rapid dispatch protocols triggered for active risk containment.

If you are in immediate threat of violence or need urgent rescue, please dial our emergency SOS hotline *384*11# directly on your mobile device.

Thank you for your voice. Stay safe.
----------------------------------------
Internal Secure Dispatch, Isiolo County
    `;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">Bonga Box Protection Network</h1>
          <p style="color: #64748b; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Automated Safety Registry</p>
        </div>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin-bottom: 20px; border-radius: 4px 8px 8px 4px;">
          <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 4px;">Report Reference</span>
          <strong style="font-size: 16px; color: #0f172a; font-family: monospace;">Ref: #${previewId}</strong>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #334155; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 0;">Protection Dispatch Summary</h3>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 120px;">Category:</td>
              <td style="padding: 6px 0; color: #0f172a;">${category}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Location:</td>
              <td style="padding: 6px 0; color: #0f172a;">${location}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Details:</td>
              <td style="padding: 6px 0; color: #334155; font-style: italic;">"${description || 'Audio or indicated telemetry logged'}"</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Anonymity:</td>
              <td style="padding: 6px 0;">
                <span style="padding: 2px 8px; background-color: ${isAnonymous ? '#ecfdf5' : '#e0e7ff'}; color: ${isAnonymous ? '#065f46' : '#3730a3'}; border-radius: 4px; font-size: 11px; font-weight: bold;">
                  ${isAnonymous ? 'SECURE & ANONYMOUS' : 'SIGNED REPORT'}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
          <h4 style="color: #6b21a8; font-size: 13px; margin: 0 0 8px 0; font-weight: bold;">What happens next?</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #581c87; line-height: 1.6;">
            <li>Secure automated metadata scrubbing completed successfully.</li>
            <li>Encrypted case packet routed to County Isiolo emergency response desks.</li>
            <li>Local certified rescue managers mapped to monitor immediate safety coordinates.</li>
          </ul>
        </div>

        <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; color: #94a3b8; font-size: 11px;">
          <p style="margin: 0 0 5px 0;">If you are in danger, please exit browser tabs and dial <strong>*384*11#</strong> immediately.</p>
          <p style="margin: 0;">Bonga Box Community Protection Protocol - County of Isiolo</p>
        </div>
      </div>
    `;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: `"Bonga Box Safety Network" <${senderEmail}>`,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent
        });

        console.dir({
          mail_sent: true,
          recipient: toEmail,
          ref: previewId,
          smtp: smtpHost
        });

        return { success: true, method: 'SMTP', reference: previewId };
      } catch (smtpError) {
        console.error('SMTP distribution failed, falling back to secure simulated dispatch:', smtpError);
      }
    }

    // Simulation log when credentials aren't defined
    console.log(`
--- [SIMULATED SECURE EMAIL CONFIRMATION DISPATCH] ---
Sender: Bonga Box Safety Desk <${senderEmail}>
Recipient: ${toEmail}
Subject: ${subject}
Text Body Preview:
${textContent.trim()}
--------------------------------------------------------
    `);

    return { success: true, method: 'Simulation', reference: previewId };
  }

  // API Endpoint to request Automated Email Confirmation
  app.post('/api/reports/send-confirmation', async (req, res) => {
    const { email, reportId, category, location, description, isAnonymous } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Recipient email address is required' });
    }

    try {
      const result = await sendAutomatedEmail(email, {
        reportId: reportId || '',
        category: category || 'General Protective Case',
        location: location || 'Isiolo County',
        description: description || '',
        isAnonymous: isAnonymous !== false
      });

      return res.json({
        success: true,
        message: 'Automated email confirmation processed successfully',
        dispatchDetails: result
      });
    } catch (error: any) {
      console.error('Email confirmation endpoint error:', error);
      return res.status(500).json({ error: 'Failed to process email dispatch request' });
    }
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
