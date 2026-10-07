import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { buildUserName } from './src/lib/profileName';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firebaseClientConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf-8')) as { apiKey?: string };

const JWT_SECRET = process.env.JWT_SECRET || 'fixbeforebuy-mechanic-secret-key-2026';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || firebaseClientConfig.apiKey;
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'repair-files';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.dat';
    cb(null, `file-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

const sanitizeSupabasePath = (originalName: string, userId: string) => {
  const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `${userId}/${Date.now()}-${safeName}`;
};

const uploadToSupabase = async (file: Express.Multer.File, userId: string) => {
  if (!supabase) {
    throw new Error('Supabase storage is not configured.');
  }

  const fileBuffer = fs.readFileSync(file.path);
  const storagePath = sanitizeSupabasePath(file.originalname, userId);
  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(storagePath, fileBuffer, {
    contentType: file.mimetype || 'application/octet-stream',
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);

  return {
    storageProvider: 'supabase' as const,
    storagePath,
    publicUrl: publicUrlData?.publicUrl || undefined,
    filePath: file.path
  };
};

// Seed data and database manager
interface DBUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'technician' | 'admin';
  createdAt: string;
  emailVerified?: boolean;
}

interface DBFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  storageProvider?: 'local' | 'supabase';
  storagePath?: string;
  publicUrl?: string;
  category: 'damage_photo' | 'error_code' | 'invoice_receipt' | 'model_plate' | 'other';
  relatedSessionId?: string;
  uploadedAt: string;
}

interface DBDiagnosticSession {
  id: string;
  userId: string;
  applianceType: string;
  brand: string;
  modelNumber?: string;
  ageYears: number;
  expectedLifespanYears: number;
  originalPrice: number;
  estimatedRepairCost: number;
  replacementCost: number;
  problemTitle: string;
  symptoms: string[];
  severity: 'low' | 'moderate' | 'critical';
  recommendation: 'REPAIR' | 'REPLACE' | 'CONSULT_PRO';
  recommendationReason: string;
  estimatedSavings: number;
  carbonSavingsKg: number;
  fiftyPercentRuleTriggered: boolean;
  diyChecklist: string[];
  attachedFileIds: string[];
  status: 'active' | 'resolved' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface DBRepairEstimate {
  id: string;
  userId: string;
  diagnosticSessionId?: string;
  applianceDescription: string;
  serviceCenterName: string;
  serviceCenterPhone?: string;
  partsCost: number;
  laborCost: number;
  taxAndFees: number;
  totalCost: number;
  warrantyMonths: number;
  validUntil: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  attachedFileIds: string[];
  createdAt: string;
}

interface DBReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  applianceType?: string;
  verifiedRepair: boolean;
}

interface DBServiceCenter {
  id: string;
  name: string;
  centerType: 'repair_service' | 'appliance_store';
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  certifiedBrands: string[];
  hourlyRateEstimate: number;
  hasMobileDispatch: boolean;
  isOpen: boolean;
  operatingHours: {
    weekday: string;
    saturday: string;
    sunday: string;
  };
  reviews: DBReview[];
  storeOfferings?: string[];
}

interface DBNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'estimate_ready' | 'status_update' | 'recall_alert' | 'followup' | 'system';
  read: boolean;
  linkTab?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: DBUser[];
  files: DBFile[];
  diagnostics: DBDiagnosticSession[];
  estimates: DBRepairEstimate[];
  serviceCenters: DBServiceCenter[];
  notifications: DBNotification[];
}

const DEFAULT_SERVICE_CENTERS: DBServiceCenter[] = await buildDefaultServiceCenters();

async function buildDefaultServiceCenters(): Promise<DBServiceCenter[]> {
  const sourcePath = path.join(DATA_DIR, 'mangaluru_service_centers.json');

  try {
    const raw = fs.readFileSync(sourcePath, 'utf-8');
    const dataset = JSON.parse(raw.replace(/NaN/g, 'null')) as Array<{
      id?: number;
      name?: string;
      category?: string;
      brand?: string;
      location?: string;
      phone?: number | string | null;
      rating?: number | null;
      review_count?: number | null;
      city?: string;
      state?: string;
      country?: string;
    }>;

    if (!Array.isArray(dataset) || dataset.length === 0) {
      throw new Error('Mangaluru dataset is empty.');
    }

    const fallbackCoords = { latitude: 12.9141, longitude: 74.8559 };
    const normalizePhone = (value: number | string | null | undefined): string => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `+91 ${String(value).replace(/\D/g, '').slice(-10)}`;
      }
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      return '+91 00000 00000';
    };

    const categoryToSpecialties = (category?: string): string[] => {
      const text = (category || '').toLowerCase();
      if (text.includes('tv')) return ['television'];
      if (text.includes('washing') || text.includes('home appliance') || text.includes('appliance')) return ['washing_machine', 'refrigerator'];
      if (text.includes('refrigerator')) return ['refrigerator'];
      if (text.includes('air') || text.includes('ac')) return ['hvac_ac'];
      if (text.includes('mobile') || text.includes('phone') || text.includes('tablet') || text.includes('headset') || text.includes('consumer electronics')) return ['laptop'];
      if (text.includes('computer') || text.includes('desktop') || text.includes('printer') || text.includes('laptop')) return ['laptop'];
      if (text.includes('electrical')) return ['hvac_ac'];
      return ['laptop'];
    };

    const geocodeLocation = async (query: string) => {
      const lookup = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(`${query}, Mangaluru, Karnataka, India`)}`;
      try {
        const response = await fetch(lookup, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'FixBeforeBuy/1.0'
          }
        });

        if (!response.ok) {
          return fallbackCoords;
        }

        const results = await response.json() as Array<{ lat?: string; lon?: string }>;
        const match = results[0];

        if (!match?.lat || !match?.lon) {
          return fallbackCoords;
        }

        return {
          latitude: Number(match.lat),
          longitude: Number(match.lon)
        };
      } catch {
        return fallbackCoords;
      }
    };

    const resolvedCenters = await Promise.all(dataset.map(async (item, index) => {
      const locationText = item.location || `${item.city || 'Mangaluru'}, Karnataka`;
      const coords = await geocodeLocation(locationText);
      const brandName = item.brand || 'Multi-brand';
      const specialties = categoryToSpecialties(item.category);
      const rating = typeof item.rating === 'number' && Number.isFinite(item.rating) ? item.rating : 4.5;
      const reviewCount = typeof item.review_count === 'number' && Number.isFinite(item.review_count) ? item.review_count : 25;

      return {
        id: `mangaluru-${item.id ?? index + 1}`,
        name: item.name || `Mangaluru Service Center ${index + 1}`,
        centerType: item.category && /(appliance|home|ac|electrical|refrigerator|washing|dryer)/i.test(item.category) ? 'appliance_store' : 'repair_service',
        address: locationText.split(',').slice(0, 2).join(', ').trim() || 'Mangaluru, Karnataka',
        city: item.city || 'Mangaluru',
        state: item.state || 'Karnataka',
        zip: /\d{6}/.test(locationText) ? locationText.match(/\d{6}/)?.[0] || '575001' : '575001',
        latitude: coords.latitude + ((index % 7) - 3) * 0.002,
        longitude: coords.longitude + ((index % 5) - 2) * 0.002,
        phone: normalizePhone(item.phone),
        email: `${(item.name || 'service-center').toLowerCase().replace(/[^a-z0-9]+/g, '.')}.mangaluru@gmail.com`,
        rating,
        reviewCount: Math.round(reviewCount),
        specialties: specialties as any,
        certifiedBrands: brandName === 'Multi-brand' ? ['Multi-brand'] : [brandName],
        hourlyRateEstimate: item.category && /tv|mobile|computer|printer|laptop/i.test(item.category) ? 650 : 750,
        hasMobileDispatch: true,
        isOpen: true,
        operatingHours: {
          weekday: 'Mon - Sat: 9:00 AM – 8:00 PM',
          saturday: 'Sat: 9:00 AM – 7:00 PM',
          sunday: 'Sun: By appointment only'
        },
        reviews: [
          {
            id: `review-${item.id ?? index + 1}-1`,
            author: 'Local Customer',
            rating: Math.max(3, Math.min(5, Math.round(rating))),
            date: 'Verified local listing',
            comment: `${item.category || 'Electronics'} service center in Mangaluru with a strong local reputation and fast turnaround.`,
            verifiedRepair: true
          }
        ],
        storeOfferings: /(appliance|store|home)/i.test(item.category || '') ? ['Parts & installation support', 'Home appliance delivery support', 'Repair diagnostics'] : undefined
      };
    }));

    return resolvedCenters;
  } catch (error) {
    console.warn('Unable to load Mangaluru service-center dataset, falling back to Chicago seed:', error);
    return [
      {
        id: 'sc-fallback-1',
        name: 'Mangaluru Local Service Center',
        centerType: 'repair_service',
        address: 'Mangaluru',
        city: 'Mangaluru',
        state: 'Karnataka',
        zip: '575001',
        latitude: 12.9141,
        longitude: 74.8559,
        phone: '+91 00000 00000',
        email: 'service@mangaluru.local',
        rating: 4.8,
        reviewCount: 12,
        specialties: ['laptop'],
        certifiedBrands: ['Multi-brand'],
        hourlyRateEstimate: 650,
        hasMobileDispatch: true,
        isOpen: true,
        operatingHours: {
          weekday: 'Mon - Sat: 9:00 AM – 8:00 PM',
          saturday: 'Sat: 9:00 AM – 7:00 PM',
          sunday: 'Sun: By appointment only'
        },
        reviews: [
          {
            id: 'fallback-review-1',
            author: 'Local Customer',
            rating: 5,
            date: 'Fallback listing',
            comment: 'Fallback service center entry for Mangaluru while the local dataset loads.',
            verifiedRepair: true
          }
        ]
      }
    ];
  }
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data) as DatabaseSchema;

      const hasStaleServiceCenters = !Array.isArray(parsed.serviceCenters)
        || parsed.serviceCenters.length === 0
        || parsed.serviceCenters.some(center =>
          center.city === 'Metro City'
          || center.city === 'Chicago'
          || center.state === 'IL'
          || center.address?.toLowerCase().includes('industrial blvd')
        );

      if (hasStaleServiceCenters) {
        parsed.serviceCenters = DEFAULT_SERVICE_CENTERS;
        saveDB(parsed);
      }

      return parsed;
    }
  } catch (err) {
    console.error('Failed reading DB file, reinitializing', err);
  }

  const initialDB: DatabaseSchema = {
    users: [],
    files: [],
    diagnostics: [],
    estimates: [],
    serviceCenters: DEFAULT_SERVICE_CENTERS,
    notifications: []
  };
  saveDB(initialDB);
  return initialDB;
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving DB file', err);
  }
}

let db = loadDB();

// Ensure demo user exists
const DEMO_EMAIL = 'mechanic.demo@fixbeforebuy.org';
let demoUser = db.users.find(u => u.email === DEMO_EMAIL);
if (!demoUser) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('FixDemo2026!', salt);
  demoUser = {
    id: 'user-demo-01',
    email: DEMO_EMAIL,
    passwordHash,
    name: 'Alex Vance (Master Technician)',
    role: 'technician',
    createdAt: new Date().toISOString()
  };
  db.users.push(demoUser);

  // Seed sample realistic diagnostic history for demo
  const sampleSession1: DBDiagnosticSession = {
    id: 'diag-demo-01',
    userId: demoUser.id,
    applianceType: 'refrigerator',
    brand: 'Whirlpool',
    modelNumber: 'WRF535SWHZ',
    ageYears: 4,
    expectedLifespanYears: 12,
    originalPrice: 1600,
    estimatedRepairCost: 280,
    replacementCost: 1750,
    problemTitle: 'Bottom freezer cold but fresh food compartment warm',
    symptoms: ['Evaporator fan rattling', 'Top cabinet above 48°F', 'Defrost heater cyclic error'],
    severity: 'moderate',
    recommendation: 'REPAIR',
    recommendationReason: 'Repairing saves approximately $1,470. The unit is only 4 years old (33% of its 12-year lifespan). Replacing the evaporator fan motor ($65 part) and defrost sensor is standard maintenance.',
    estimatedSavings: 1470,
    carbonSavingsKg: 238,
    fiftyPercentRuleTriggered: false,
    diyChecklist: [
      'Vacuum condenser coils underneath unit',
      'Test evaporator fan continuity with multimeter',
      'Check defrost bi-metal thermostat for continuity'
    ],
    attachedFileIds: [],
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  };

  const sampleSession2: DBDiagnosticSession = {
    id: 'diag-demo-02',
    userId: demoUser.id,
    applianceType: 'washing_machine',
    brand: 'Samsung',
    modelNumber: 'WF45R6100AW',
    ageYears: 9,
    expectedLifespanYears: 10,
    originalPrice: 900,
    estimatedRepairCost: 620,
    replacementCost: 850,
    problemTitle: 'Excessive grinding noise during spin and drum wobble',
    symptoms: ['Rear tub bearing blown', 'Metal shavings under stator', 'Drum spider arm cracked'],
    severity: 'critical',
    recommendation: 'REPLACE',
    recommendationReason: 'Breaches the Industry 50% Rule: The repair cost ($620 for rear tub + bearing assembly + 4hr labor) is 73% of a brand-new washer ($850), and the machine has consumed 90% of its 10-year lifespan. Investing in this unit is financially unfavorable.',
    estimatedSavings: 230,
    carbonSavingsKg: 0,
    fiftyPercentRuleTriggered: true,
    diyChecklist: [
      'Inspect tub basket play by hand',
      'Check if vibration shocks are dry or broken',
      'Check manufacturer recall bulletin for tub assembly'
    ],
    attachedFileIds: [],
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  };

  const sampleSession3: DBDiagnosticSession = {
    id: 'diag-demo-03',
    userId: demoUser.id,
    applianceType: 'laptop',
    brand: 'Dell',
    modelNumber: 'XPS 15 9500',
    ageYears: 2.5,
    expectedLifespanYears: 5,
    originalPrice: 1850,
    estimatedRepairCost: 195,
    replacementCost: 1900,
    problemTitle: 'Swollen trackpad and thermal throttling',
    symptoms: ['Battery bulging', 'Fan screeching', 'Thermal shutdowns'],
    severity: 'moderate',
    recommendation: 'REPAIR',
    recommendationReason: 'Repairing saves $1,705. High-end laptop is only half-way through lifespan. Replacing the OEM 86Wh battery ($110) and cleaning thermal paste ($20) restores full operational capability.',
    estimatedSavings: 1705,
    carbonSavingsKg: 298,
    fiftyPercentRuleTriggered: false,
    diyChecklist: [
      'Power off immediately and do not charge swollen battery',
      'Remove bottom Torx T5 chassis screws',
      'Disconnect battery connector before touching logic board'
    ],
    attachedFileIds: [],
    status: 'resolved',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  };

  db.diagnostics.push(sampleSession1, sampleSession2, sampleSession3);

  // Seed sample repair estimates
  const sampleEstimate1: DBRepairEstimate = {
    id: 'est-demo-01',
    userId: demoUser.id,
    diagnosticSessionId: 'diag-demo-01',
    applianceDescription: 'Whirlpool WRF535SWHZ Refrigerator',
    serviceCenterName: 'Metro Pro Appliance Repair & Diagnostics',
    serviceCenterPhone: '(312) 555-0142',
    partsCost: 85,
    laborCost: 160,
    taxAndFees: 20,
    totalCost: 265,
    warrantyMonths: 12,
    validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    notes: 'Quote includes OEM Evaporator Motor (WPW10515058) + 1-year labor guarantee. Technician dispatch available Thursday.',
    attachedFileIds: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  };

  const sampleEstimate2: DBRepairEstimate = {
    id: 'est-demo-02',
    userId: demoUser.id,
    diagnosticSessionId: 'diag-demo-02',
    applianceDescription: 'Samsung WF45R6100AW Washing Machine',
    serviceCenterName: 'Lakeside Domestic Machinery Workshop',
    serviceCenterPhone: '(312) 555-0377',
    partsCost: 380,
    laborCost: 240,
    taxAndFees: 45,
    totalCost: 665,
    warrantyMonths: 6,
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'rejected',
    notes: 'Major tub assembly rebuild required. Given the high total cost ($665), user opted for machine recycling.',
    attachedFileIds: [],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  };

  db.estimates.push(sampleEstimate1, sampleEstimate2);

  // Seed sample notifications
  db.notifications.push(
    {
      id: 'notif-demo-01',
      userId: demoUser.id,
      title: 'New Repair Quote Received',
      message: 'Metro Pro submitted an itemized quote of $265 for your Whirlpool Refrigerator.',
      type: 'estimate_ready',
      read: false,
      linkTab: 'estimates',
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-demo-02',
      userId: demoUser.id,
      title: '50% Rule Warning',
      message: 'Samsung Washer repair exceeds 70% of replacement cost. Replacement recommended.',
      type: 'status_update',
      read: false,
      linkTab: 'dashboard',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  );

  saveDB(db);
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

function extractUserFromToken(token: string): { id: string; email: string; name: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    if (decoded && decoded.id) {
      return decoded;
    }
  } catch {
  }
  return null;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = extractUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }

  req.user = user;
  next();
}

function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = extractUserFromToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sanitizeEmail = (email: string): string => email.trim().toLowerCase();

const ensureUserWelcomeNotification = (userId: string, userName: string): void => {
  const hasWelcomeNotification = db.notifications.some(
    notification => notification.userId === userId && notification.title === 'Welcome to FixBeforeBuy'
  );

  if (!hasWelcomeNotification) {
    db.notifications.push({
      id: `notif-${userId}-${Date.now()}`,
      userId,
      title: 'Welcome to FixBeforeBuy',
      message: `Hello ${userName || 'there'} — your account is ready and notifications are active.`,
      type: 'system',
      read: false,
      linkTab: 'dashboard',
      createdAt: new Date().toISOString()
    });
    saveDB(db);
  }
};

const getOrCreateUserForEmail = (email: string, explicitName?: string): DBUser => {
  const normalizedEmail = sanitizeEmail(email);
  let user = db.users.find(u => u.email === normalizedEmail);
  const fallbackName = normalizedEmail.split('@')[0] || 'user';

  if (!user) {
    user = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      email: normalizedEmail,
      passwordHash: '',
      name: buildUserName(explicitName, fallbackName),
      role: 'user',
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    saveDB(db);
    ensureUserWelcomeNotification(user.id, user.name);
  }

  if (explicitName) {
    const nextName = buildUserName(explicitName, user.name || fallbackName);
    if (user.name !== nextName) {
      user.name = nextName;
      saveDB(db);
    }
  }

  if (!db.notifications.some(n => n.userId === user.id && n.title === 'Welcome to FixBeforeBuy')) {
    ensureUserWelcomeNotification(user.id, user.name);
  }

  return user;
};

// --- API ROUTES ---

// Verify Firebase ID tokens with Identity Toolkit before issuing app API sessions.
app.post('/api/auth/firebase-session', async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken || !FIREBASE_API_KEY) {
    res.status(400).json({ error: 'Firebase sign-in token or project configuration is missing.' });
    return;
  }

  try {
    const firebaseResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    const result = await firebaseResponse.json() as {
      users?: Array<{ localId: string; email?: string; emailVerified?: boolean; displayName?: string }>;
    };
    const firebaseUser = result.users?.[0];

    if (!firebaseResponse.ok || !firebaseUser?.localId || !firebaseUser.email) {
      res.status(401).json({ error: 'Firebase session is invalid or expired. Please sign in again.' });
      return;
    }
    if (!firebaseUser.emailVerified) {
      res.status(403).json({ error: 'Verify your email address before signing in.' });
      return;
    }

    const user = getOrCreateUserForEmail(firebaseUser.email, firebaseUser.displayName);
    user.emailVerified = true;
    saveDB(db);
    ensureUserWelcomeNotification(user.id, user.name);

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    res.status(503).json({ error: 'Could not verify the Firebase session. Check the server connection and Firebase project configuration.' });
  }
});

// Auth: Quick Demo Login (for instant testing)
app.post('/api/auth/demo', (_req: Request, res: Response): void => {
  const user = db.users.find(u => u.email === DEMO_EMAIL) || db.users[0];
  if (!user) {
    res.status(500).json({ error: 'Demo user unavailable' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// 4. Auth: Current Profile
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const user = db.users.find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  });
});

// 5. Diagnostics: List (Scoped to authenticated user)
app.get('/api/diagnostics', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const userDiagnostics = db.diagnostics
    .filter(d => d.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userDiagnostics);
});

// 6. Diagnostics: Create
app.post('/api/diagnostics', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const {
    applianceType,
    brand,
    modelNumber,
    ageYears,
    expectedLifespanYears,
    originalPrice,
    estimatedRepairCost,
    replacementCost,
    problemTitle,
    symptoms,
    severity,
    recommendation,
    recommendationReason,
    estimatedSavings,
    carbonSavingsKg,
    fiftyPercentRuleTriggered,
    diyChecklist,
    attachedFileIds
  } = req.body;

  if (!applianceType || !problemTitle) {
    res.status(400).json({ error: 'Appliance type and problem description are required' });
    return;
  }

  const newSession: DBDiagnosticSession = {
    id: `diag-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    applianceType: String(applianceType),
    brand: brand ? String(brand).trim() : 'Generic',
    modelNumber: modelNumber ? String(modelNumber).trim() : undefined,
    ageYears: Number(ageYears) || 0,
    expectedLifespanYears: Number(expectedLifespanYears) || 10,
    originalPrice: Number(originalPrice) || 0,
    estimatedRepairCost: Number(estimatedRepairCost) || 0,
    replacementCost: Number(replacementCost) || 0,
    problemTitle: String(problemTitle),
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    severity: severity || 'moderate',
    recommendation: recommendation || 'CONSULT_PRO',
    recommendationReason: recommendationReason || '',
    estimatedSavings: Number(estimatedSavings) || 0,
    carbonSavingsKg: Number(carbonSavingsKg) || 0,
    fiftyPercentRuleTriggered: Boolean(fiftyPercentRuleTriggered),
    diyChecklist: Array.isArray(diyChecklist) ? diyChecklist : [],
    attachedFileIds: Array.isArray(attachedFileIds) ? attachedFileIds : [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.diagnostics.push(newSession);

  // Auto trigger a status notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: `Diagnostic Logged: ${newSession.brand} ${newSession.applianceType}`,
    message: `Result: ${newSession.recommendation}. Potential savings: $${newSession.estimatedSavings}.`,
    type: 'status_update',
    read: false,
    linkTab: 'dashboard',
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json(newSession);
});

// 7. Diagnostics: Update (e.g. resolve, archive, change notes)
app.put('/api/diagnostics/:id', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const session = db.diagnostics.find(d => d.id === req.params.id && d.userId === userId);
  if (!session) {
    res.status(404).json({ error: 'Diagnostic session not found or unauthorized' });
    return;
  }

  const updates = req.body;
  if (updates.status) session.status = updates.status;
  if (updates.estimatedRepairCost !== undefined) session.estimatedRepairCost = Number(updates.estimatedRepairCost);
  if (updates.replacementCost !== undefined) session.replacementCost = Number(updates.replacementCost);
  if (updates.attachedFileIds) session.attachedFileIds = updates.attachedFileIds;
  session.updatedAt = new Date().toISOString();

  saveDB(db);
  res.json(session);
});

// 8. Diagnostics: Delete
app.delete('/api/diagnostics/:id', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const index = db.diagnostics.findIndex(d => d.id === req.params.id && d.userId === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Diagnostic session not found or unauthorized' });
    return;
  }

  db.diagnostics.splice(index, 1);
  saveDB(db);
  res.json({ success: true, deletedId: req.params.id });
});

// 9. Estimates: List
app.get('/api/estimates', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const userEstimates = db.estimates
    .filter(e => e.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userEstimates);
});

// 10. Estimates: Create
app.post('/api/estimates', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const {
    diagnosticSessionId,
    applianceDescription,
    serviceCenterName,
    serviceCenterPhone,
    partsCost,
    laborCost,
    taxAndFees,
    warrantyMonths,
    validUntil,
    notes,
    attachedFileIds
  } = req.body;

  const parts = Number(partsCost) || 0;
  const labor = Number(laborCost) || 0;
  const tax = Number(taxAndFees) || 0;
  const total = parts + labor + tax;

  const newEstimate: DBRepairEstimate = {
    id: `est-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    diagnosticSessionId: diagnosticSessionId ? String(diagnosticSessionId) : undefined,
    applianceDescription: String(applianceDescription || 'Appliance Repair'),
    serviceCenterName: String(serviceCenterName || 'Certified Technician'),
    serviceCenterPhone: serviceCenterPhone ? String(serviceCenterPhone) : undefined,
    partsCost: parts,
    laborCost: labor,
    taxAndFees: tax,
    totalCost: total,
    warrantyMonths: Number(warrantyMonths) || 6,
    validUntil: validUntil ? String(validUntil) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    notes: notes ? String(notes) : undefined,
    attachedFileIds: Array.isArray(attachedFileIds) ? attachedFileIds : [],
    createdAt: new Date().toISOString()
  };

  db.estimates.push(newEstimate);

  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: `Repair Estimate Logged: $${newEstimate.totalCost}`,
    message: `Quote from ${newEstimate.serviceCenterName} is pending your review.`,
    type: 'estimate_ready',
    read: false,
    linkTab: 'estimates',
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json(newEstimate);
});

// 11. Estimates: Update Status
app.put('/api/estimates/:id', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const estimate = db.estimates.find(e => e.id === req.params.id && e.userId === userId);
  if (!estimate) {
    res.status(404).json({ error: 'Estimate not found or unauthorized' });
    return;
  }

  const { status, notes } = req.body;
  if (status) estimate.status = status;
  if (notes !== undefined) estimate.notes = notes;

  saveDB(db);
  res.json(estimate);
});

// 12. Estimates: Delete
app.delete('/api/estimates/:id', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const index = db.estimates.findIndex(e => e.id === req.params.id && e.userId === userId);
  if (index === -1) {
    res.status(404).json({ error: 'Estimate not found or unauthorized' });
    return;
  }

  db.estimates.splice(index, 1);
  saveDB(db);
  res.json({ success: true, deletedId: req.params.id });
});

// 13. Files: Upload
app.post(
  '/api/files/upload',
  authMiddleware,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user!.id;
    const { category, relatedSessionId } = req.body;

    let fileMetadata = {
      storageProvider: 'local' as const,
      storagePath: req.file.filename,
      publicUrl: undefined as string | undefined,
      filePath: req.file.path
    };

    if (supabase) {
      try {
        const remoteUpload = await uploadToSupabase(req.file, userId);
        fileMetadata = remoteUpload;
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (error) {
        console.warn('Supabase upload failed, falling back to local storage:', error);
      }
    }

    const newFile: DBFile = {
      id: `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filePath: fileMetadata.filePath,
      storageProvider: fileMetadata.storageProvider,
      storagePath: fileMetadata.storagePath,
      publicUrl: fileMetadata.publicUrl,
      category: category || 'damage_photo',
      relatedSessionId: relatedSessionId || undefined,
      uploadedAt: new Date().toISOString()
    };

    db.files.push(newFile);
    saveDB(db);

    res.status(201).json({
      id: newFile.id,
      originalName: newFile.originalName,
      mimeType: newFile.mimeType,
      size: newFile.size,
      category: newFile.category,
      uploadedAt: newFile.uploadedAt,
      storageProvider: newFile.storageProvider,
      storagePath: newFile.storagePath,
      publicUrl: newFile.publicUrl
    });
  }
);

// 14. Files: List (Scoped to user)
app.get('/api/files', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const userFiles = db.files
    .filter(f => f.userId === userId)
    .map(f => ({
      id: f.id,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      category: f.category,
      relatedSessionId: f.relatedSessionId,
      uploadedAt: f.uploadedAt
    }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  res.json(userFiles);
});

// 15. Files: Download / Stream (Security checked)
app.get('/api/files/:id/download', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const fileMeta = db.files.find(f => f.id === req.params.id && f.userId === userId);
  if (!fileMeta) {
    res.status(404).json({ error: 'File not found or unauthorized access' });
    return;
  }

  if (fileMeta.storageProvider === 'supabase' && fileMeta.storagePath && supabase) {
    try {
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(fileMeta.storagePath, 60 * 60);
      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Failed to create signed URL');
      }
      res.redirect(data.signedUrl);
      return;
    } catch (error) {
      console.error('Supabase signed URL generation failed:', error);
      res.status(500).json({ error: 'Failed to access Supabase file.' });
      return;
    }
  }

  if (!fs.existsSync(fileMeta.filePath)) {
    res.status(404).json({ error: 'File data missing on server' });
    return;
  }

  res.setHeader('Content-Type', fileMeta.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileMeta.originalName)}"`);
  fs.createReadStream(fileMeta.filePath).pipe(res);
});

// 16. Files: Delete
app.delete('/api/files/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const fileIndex = db.files.findIndex(f => f.id === req.params.id && f.userId === userId);
  if (fileIndex === -1) {
    res.status(404).json({ error: 'File not found or unauthorized' });
    return;
  }

  const [removedFile] = db.files.splice(fileIndex, 1);

  if (removedFile.storageProvider === 'supabase' && removedFile.storagePath && supabase) {
    try {
      const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([removedFile.storagePath]);
      if (error) {
        console.warn('Failed removing file from Supabase:', error.message);
      }
    } catch (error) {
      console.warn('Supabase delete failed:', error);
    }
  }

  if (fs.existsSync(removedFile.filePath)) {
    try {
      fs.unlinkSync(removedFile.filePath);
    } catch (e) {
      console.warn('Failed unlinking file:', e);
    }
  }

  // Also remove references in diagnostics/estimates
  db.diagnostics.forEach(d => {
    d.attachedFileIds = d.attachedFileIds.filter(fid => fid !== removedFile.id);
  });
  db.estimates.forEach(e => {
    e.attachedFileIds = e.attachedFileIds.filter(fid => fid !== removedFile.id);
  });

  saveDB(db);
  res.json({ success: true, deletedId: removedFile.id });
});

// 17. Service Centers: List
app.get('/api/service-centers', (_req: Request, res: Response): void => {
  res.json(db.serviceCenters);
});

// 18. Service Centers: Quote Request
app.post('/api/service-centers/quote-request', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const { 
    serviceCenterId, 
    diagnosticSessionId, 
    applianceDescription, 
    problemSummary,
    customerName,
    customerPhone,
    customerEmail,
    preferredContact
  } = req.body;

  const center = db.serviceCenters.find(sc => sc.id === serviceCenterId) || db.serviceCenters[0];
  if (!center) {
    res.status(404).json({ error: 'Service center directory unavailable' });
    return;
  }

  // Determine user context: if user is logged in, attach to them; otherwise attach to demo/guest user
  let userId = req.user?.id;
  let autoGuestToken: string | undefined = undefined;

  if (!userId) {
    // Check if demo user is available to attach
    const defaultUser = db.users.find(u => u.email === DEMO_EMAIL) || db.users[0];
    if (defaultUser) {
      userId = defaultUser.id;
      // Generate token so client can immediately view and track their quote in the dashboard
      autoGuestToken = jwt.sign(
        { id: defaultUser.id, email: defaultUser.email, name: defaultUser.name, role: defaultUser.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
    } else {
      userId = `guest-${Date.now()}`;
    }
  }

  // Generate an automated pending quote estimate based on workshop benchmark rates
  const laborEstimate = center.hourlyRateEstimate * 2;
  const partsEstimate = Math.round(120 + Math.random() * 140);
  const tax = Math.round((laborEstimate + partsEstimate) * 0.08);

  const contactNotes = [
    customerName ? `Contact: ${customerName}` : '',
    customerPhone ? `Phone: ${customerPhone}` : '',
    customerEmail ? `Email: ${customerEmail}` : '',
    preferredContact ? `Preferred: ${preferredContact}` : ''
  ].filter(Boolean).join(' | ');

  const estimate: DBRepairEstimate = {
    id: `est-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    diagnosticSessionId: diagnosticSessionId || undefined,
    applianceDescription: applianceDescription || 'Appliance Diagnostics',
    serviceCenterName: center.name,
    serviceCenterPhone: center.phone,
    partsCost: partsEstimate,
    laborCost: laborEstimate,
    taxAndFees: tax,
    totalCost: partsEstimate + laborEstimate + tax,
    warrantyMonths: 12,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending',
    notes: `Electronic dispatch to ${center.name}. Estimated labor @ $${center.hourlyRateEstimate}/hr. Fault: ${problemSummary || 'Diagnostics requested'}. ${contactNotes ? '[' + contactNotes + ']' : ''}`,
    attachedFileIds: [],
    createdAt: new Date().toISOString()
  };

  db.estimates.push(estimate);

  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    title: `Estimate Dispatched: ${center.name}`,
    message: `Quote of $${estimate.totalCost} for ${estimate.applianceDescription} generated with 12-mo guarantee.`,
    type: 'estimate_ready',
    read: false,
    linkTab: 'estimates',
    createdAt: new Date().toISOString()
  });

  saveDB(db);
  res.status(201).json({ 
    success: true, 
    estimate, 
    referenceNumber: estimate.id,
    autoGuestToken,
    message: `Instant quote request successfully received by ${center.name}. Reference ID: ${estimate.id}` 
  });
});

// 19. Notifications: List
app.get('/api/notifications', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const userNotifs = db.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

// 20. Notifications: Mark Read
app.post('/api/notifications/read', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const { id } = req.body;

  if (id) {
    const notif = db.notifications.find(n => n.id === id && n.userId === userId);
    if (notif) notif.read = true;
  } else {
    // Mark all read
    db.notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
  }

  saveDB(db);
  res.json({ success: true });
});

// 21. Notifications: Simulate Push Update
app.post('/api/notifications/simulate', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const userId = req.user!.id;
  const samplePushes = [
    {
      title: 'Certified Mechanic Available',
      message: 'Metro Pro has a technician in your neighborhood today with OEM diagnostic tools.',
      type: 'status_update' as const,
      linkTab: 'service-centers'
    },
    {
      title: 'Parts Price Drop Alert',
      message: 'Original replacement motor price dropped by 18% from certified distributor.',
      type: 'recall_alert' as const,
      linkTab: 'estimates'
    },
    {
      title: 'Diagnostic Follow-Up',
      message: 'Did the DIY filter check solve your washing machine drainage issue?',
      type: 'followup' as const,
      linkTab: 'dashboard'
    }
  ];

  const pick = samplePushes[Math.floor(Math.random() * samplePushes.length)];
  const notif: DBNotification = {
    id: `notif-${Date.now()}`,
    userId,
    title: pick.title,
    message: pick.message,
    type: pick.type,
    read: false,
    linkTab: pick.linkTab,
    createdAt: new Date().toISOString()
  };

  db.notifications.push(notif);
  saveDB(db);
  res.json(notif);
});

// --- VITE MIDDLEWARE / STATIC ASSETS ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FixBeforeBuy Mechanic Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
