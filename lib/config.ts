/**
 * Central configuration for StudyPalace.
 * Everything the app needs is read once, here, from environment variables.
 */

function bool(v: string | undefined, fallback = false) {
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

function num(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const isProd = process.env.NODE_ENV === 'production';

const siteUrlRaw =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  (isProd ? 'https://studypalace.in' : 'http://localhost:3000');

export const config = {
  isProd,

  site: {
    url: siteUrlRaw.replace(/\/+$/, ''),
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'StudyPalace',
    tagline: 'Crack NIFT 2027 with PDFs made by toppers.',
    description:
      'StudyPalace sells downloadable NIFT preparation eBooks and PDFs — GAT question banks, CAT drawing practice sheets, Situation Test model-making guides, current affairs capsules and previous year papers. Instant download after payment.',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@studypalace.in',
    supportWhatsapp: process.env.SUPPORT_WHATSAPP || '',
    gaId: process.env.NEXT_PUBLIC_GA_ID || '',
  },

  admin: {
    email: (process.env.ADMIN_EMAIL || 'admin@studypalace.in').trim().toLowerCase(),
    // A safe default so the app never locks you out on first run — it warns loudly.
    password: process.env.ADMIN_PASSWORD || 'changeme123',
    passwordIsDefault: !process.env.ADMIN_PASSWORD,
    cookieName: 'sp_admin',
    sessionDays: num(process.env.ADMIN_SESSION_DAYS, 7),
  },

  appSecret:
    process.env.APP_SECRET ||
    (isProd
      ? 'insecure-dev-secret-change-me' // production will throw below
      : 'insecure-dev-secret-change-me'),

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    currency: (process.env.CURRENCY || 'INR').toUpperCase(),
    get enabled() {
      return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
    },
    get isTest() {
      return config.razorpay.keyId.startsWith('rzp_test_');
    },
  },

  storage: {
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    publicAssetBase: (process.env.PUBLIC_ASSET_BASE_URL || '').replace(/\/+$/, ''),
    maxUploadBytes: num(process.env.MAX_UPLOAD_MB, 60) * 1024 * 1024,
    databaseUrl: process.env.DATABASE_URL || 'file:./data/studypalace.db',
  },

  commerce: {
    // Digital goods: no returns. Kept in one place so the UI stays consistent.
    returnsAllowed: false,
    refundWindowDays: 0,
    taxLabel: 'GST included',
    freeAbovePaise: 0,
  },

  features: {
    // Let a buyer re-download from a magic link (order id + email)
    customerPortal: bool(process.env.FEATURE_CUSTOMER_PORTAL, true),
    coupons: bool(process.env.FEATURE_COUPONS, true),
  },
} as const;

export const siteUrl = config.site.url;

/** Absolute URL helper — used by canonical tags, sitemap and OG images. */
export function abs(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Throws early in production if the app is running with insecure defaults. */
export function assertProductionSafe(): string[] {
  const problems: string[] = [];
  if (!config.isProd) return problems;
  if (config.admin.passwordIsDefault) problems.push('ADMIN_PASSWORD is not set (still using the default).');
  if (!process.env.APP_SECRET) problems.push('APP_SECRET is not set.');
  if (!config.razorpay.enabled) problems.push('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set.');
  return problems;
}
