// Load environment variables FIRST before any other imports
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Also try current directory

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Map VITE_ prefixed variables to non-prefixed for backend compatibility
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}
if (!process.env.SUPABASE_SERVICE_KEY && process.env.VITE_SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Import route modules
const paymentRoutes = require('./routes/payments');
const addressRoutes = require('./routes/addresses');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const what3wordsRoutes = require('./routes/what3words');
const notificationRoutes = require('./routes/notifications');
const inboxRoutes = require('./routes/inbox');
const packagesRoutes = require('./routes/packages');
const securityRoutes = require('./routes/security');
const governmentRoutes = require('./routes/government');
const settingsRoutes = require('./routes/settings');
const metricsRoutes = require('./routes/metrics');
const otpRoutes = require('./routes/otp');
const keysRoutes = require('./routes/keys');
const webhooksRoutes = require('./routes/webhooks');
const onboardingRoutes = require('./routes/onboarding');
const referralsRoutes  = require('./routes/referrals');
const tenantsRoutes    = require('./routes/tenants');
const billingRoutes    = require('./routes/billing');
const ussdRoutes       = require('./routes/ussd');
const { tenantMiddleware } = require('./middleware/tenant');
const { initQueues } = require('./services/queue');
const { initCache } = require('./services/cache');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // tighten after removing inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co"],
      connectSrc: [
        "'self'",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://api.what3words.com",
        process.env.FRONTEND_URL || "https://kivro.africa",
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // required for map embeds
}));
app.use(compression());

// Rate limiting — tiered by sensitivity
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please wait before trying again.' },
});

const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded. Upgrade your plan for higher limits.' },
});

app.use(generalLimiter);
app.use(tenantMiddleware); // Resolves req.tenant on every request
app.use('/api/auth', authLimiter);
app.use('/api/keys', apiKeyLimiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:3001',
  'http://localhost:3002',  // Admin portal dev server
  'http://localhost:3003',  // Admin portal dev server (alternate port)
  'http://localhost:8080', 
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',  // Admin portal dev server
  'http://127.0.0.1:3003',  // Admin portal dev server (alternate port)
  'http://127.0.0.1:8080',
  'https://kivro-frontend.vercel.app',
  'https://kivro-fullstack.vercel.app',
  'https://kivro-admin.vercel.app',
  'https://kivro.africa',
  'https://www.kivro.africa',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production' &&
               (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      // Allow any localhost in development only
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin not permitted — ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
// Swagger UI — API documentation
try {
  const swaggerDoc = YAML.load(path.join(__dirname, 'openapi.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customSiteTitle: 'Kivro API Docs',
    customCss: '.swagger-ui .topbar { background: #0ea5e9; }',
  }));
} catch (e) {
}


app.use('/api/tenants',    tenantsRoutes);    // White-label tenant management
app.use('/api/billing',    billingRoutes);
app.use('/api/ussd',       ussdRoutes);       // USSD gateway (Africa's Talking)
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/tenants', tenantsRoutes);

// ── Versioned API routes (/api/v1/) ─────────────────────────────────────────
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/packages',  packagesRoutes);
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/inbox',     inboxRoutes);
app.use('/api/v1/keys',       keysRoutes);
app.use('/api/v1/webhooks',   webhooksRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/referrals',  referralsRoutes);

// Unversioned routes kept for backward compatibility
app.use('/api/keys',       keysRoutes);
app.use('/api/webhooks',   webhooksRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/referrals',  referralsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Kivro Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Test endpoint for profile updates
app.get('/api/test/profile', (req, res) => {
  res.status(200).json({
    message: 'Profile endpoint is accessible',
    timestamp: new Date().toISOString(),
    available_routes: [
      'GET /api/auth/profile',
      'PUT /api/auth/profile'
    ]
  });
});

// API routes
app.use('/api/payments', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/what3words', what3wordsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', metricsRoutes); // Admin metrics
app.use('/api/otp', otpRoutes); // OTP verification system (disabled by default)


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
// Initialise async infrastructure
Promise.all([initQueues(), initCache()]).then(() => {
}).catch(err => console.warn('[server] Infrastructure init warning:', err.message));

app.listen(PORT, () => {
});

module.exports = app;
