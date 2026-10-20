import Razorpay from 'razorpay';
import { config } from './config';
import { verifyRazorpaySignature } from './crypto';

/**
 * razorpay.ts — server-side payment integration.
 *
 * Flow:
 *   1. POST /api/checkout            -> creates a Razorpay *order* (amount in paise)
 *   2. Browser opens Razorpay Checkout with that order id
 *   3. Razorpay calls back to /api/razorpay/verify with
 *      { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *   4. We re-verify the signature server-side (never trust the browser) and
 *      only then mark the order paid + unlock downloads.
 *   5. /api/razorpay/webhook is the belt-and-braces backup for users who close
 *      the tab before step 3 finishes.
 */

let client: Razorpay | null = null;

export function razorpay(): Razorpay | null {
  if (!razorpayStatus().enabled) return null;
  if (!client) {
    client = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return client;
}

/**
 * True only when real, correctly-shaped keys are present. Placeholder values
 * from .env.example count as "not configured" so the store shows a clear
 * message instead of a confusing gateway error at checkout.
 */
export function razorpayEnabled(): boolean {
  return razorpayStatus().enabled;
}

/** Razorpay key ids look like `rzp_test_abc123` or `rzp_live_abc123`. */
export function keyIdLooksValid(keyId: string): boolean {
  return /^rzp_(test|live)_[A-Za-z0-9]{6,}$/.test(keyId);
}

export function razorpayStatus(): {
  enabled: boolean;
  mode: 'live' | 'test' | 'unset' | 'placeholder';
  webhook: boolean;
  message?: string;
} {
  const { keyId, keySecret } = config.razorpay;

  if (!keyId || !keySecret) {
    return {
      enabled: false,
      mode: 'unset',
      webhook: false,
      message:
        'Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables, then restart the app.',
    };
  }

  if (!keyIdLooksValid(keyId) || /x{4,}/i.test(keyId) || /x{6,}/i.test(keySecret)) {
    return {
      enabled: false,
      mode: 'placeholder',
      webhook: false,
      message:
        'Razorpay still has the PLACEHOLDER keys from .env.example. Copy your real Key ID and Key Secret from Razorpay Dashboard → Settings → API Keys, then restart the app.',
    };
  }

  return {
    enabled: true,
    mode: keyId.startsWith('rzp_test_') ? 'test' : 'live',
    webhook: Boolean(config.razorpay.webhookSecret),
  };
}

/**
 * Razorpay's SDK reports failures inconsistently: sometimes `error.message`,
 * sometimes `error.error.description`, sometimes only a `statusCode`.
 * This pulls out something a human can actually act on.
 */
export function describeRazorpayError(err: unknown): string {
  const e = err as {
    message?: string;
    statusCode?: number;
    status?: number;
    error?: { description?: string; code?: string };
  };
  const status = e?.statusCode || e?.status;
  const description = e?.error?.description || e?.message;

  if (status === 401) {
    return `Razorpay rejected the API keys (401 Authentication failed). ${
      description || ''
    } Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET — and make sure you are not mixing a test key with a live secret.`;
  }
  if (status === 400) return `Razorpay rejected the order (400). ${description || ''}`;
  if (status === 429) return 'Razorpay rate limit reached (429). Try again in a minute.';
  if (status && status >= 500) return `Razorpay server error (${status}). Try again shortly.`;
  return description || (err as Error)?.message || 'Unknown Razorpay error.';
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string | number>;
}): Promise<RazorpayOrder | null> {
  const rp = razorpay();
  if (!rp) return null;
  const order = await rp.orders.create({
    amount: Math.max(1, Math.round(input.amountPaise)),
    currency: config.razorpay.currency,
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
    payment_capture: true,
  });
  return {
    id: String(order.id),
    amount: Number(order.amount),
    currency: String(order.currency || 'INR'),
  };
}

export async function fetchRazorpayPayment(paymentId: string): Promise<{ status: string; amount: number } | null> {
  const rp = razorpay();
  if (!rp) return null;
  try {
    const payment = await rp.payments.fetch(paymentId);
    return { status: String(payment.status), amount: Number(payment.amount) };
  } catch (err) {
    console.error('[razorpay] fetch payment failed', (err as Error).message);
    return null;
  }
}

/**
 * Verify the checkout callback.
 * signature = HMAC_SHA256(key_secret, `${order_id}|${payment_id}`)
 */
export function verifyCheckoutSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  if (!config.razorpay.keySecret) return false;
  const payload = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  return verifyRazorpaySignature(payload, params.razorpay_signature, config.razorpay.keySecret);
}

/** Verify a webhook body (raw string) against x-razorpay-signature. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!config.razorpay.webhookSecret || !signature) return false;
  return verifyRazorpaySignature(rawBody, signature, config.razorpay.webhookSecret);
}

/** Public data the browser needs to open the checkout modal. */
export function checkoutConfig() {
  return {
    keyId: config.razorpay.keyId,
    currency: config.razorpay.currency,
    enabled: razorpayEnabled(),
    isTest: config.razorpay.isTest,
    siteName: config.site.name,
    supportEmail: config.site.supportEmail,
  };
}
