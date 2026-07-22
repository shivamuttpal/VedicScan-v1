import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config';
import connectDatabase from './config/database';
import { errorHandler, notFoundHandler } from './middlewares';
import { userRouter, profileRouter, chartRouter, chatRouter, subscriptionRouter, billingRouter, compatibilityRouter, babyNamingRouter, rashifalRouter, systemRouter, kundaliRouter } from './modules';
import { initCronJobs } from './utils/cron.util';

// Initialize Express app
const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Gzip-compress responses (JSON, PDFs) to cut bandwidth and speed up mobile/web loads.
app.use(compression());

// CORS configuration
// SECURITY: use an explicit allowlist from FRONTEND_URL (comma-separated) instead of a
// wildcard. Requests with no Origin header (mobile apps, curl, server-to-server) are allowed.
// If FRONTEND_URL is unset we reflect the request origin (dev convenience) — set it in production.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser clients
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
// SECURITY: a 1 MB limit is ample for JSON API payloads (chat, profiles, charts) and
// reduces the large-payload DoS surface. Raise per-route only if a specific endpoint needs it.
// Stripe signs the RAW request bytes, so the unparsed buffer must be preserved
// for any route that verifies a Stripe signature. Without this the HMAC is
// computed over re-serialised JSON and never matches, so every webhook 400s.
const STRIPE_WEBHOOK_PATHS = [
  '/api/billing/webhooks/stripe', // current rail
  '/api/subscription/webhook',    // legacy rail, retained during migration
];

app.use(express.json({
  limit: '1mb',
  verify: (req: any, _res, buf) => {
    if (req.originalUrl && STRIPE_WEBHOOK_PATHS.some((p) => req.originalUrl.startsWith(p))) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging middleware
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API Routes
app.use('/api/users', userRouter);
app.use('/api/profiles', profileRouter);
app.use('/api/chart', chartRouter);
app.use('/api/chat', chatRouter);
// Legacy Stripe/web checkout + email preferences. Retained for the web payment
// rail; mobile subscriptions are handled entirely by /api/billing (RevenueCat).
app.use('/api/subscription', subscriptionRouter);
// RevenueCat-backed billing: plan catalogue, entitlements, quotas, webhooks.
app.use('/api/billing', billingRouter);
app.use('/api/compatibility', compatibilityRouter);
app.use('/api/baby-naming', babyNamingRouter);
app.use('/api/rashifal', rashifalRouter);
app.use('/api/system', systemRouter);
app.use('/api/kundali', kundaliRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Node.js Express TypeScript API',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Cron Jobs
    initCronJobs();

    // Start listening
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Server is running!                                   ║
║                                                           ║
║   Environment: ${config.env.padEnd(40)}║
║   Port: ${String(config.port).padEnd(47)}║
║   API: http://0.0.0.0:${config.port}/api                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
