/**
 * RevenueCat SDK integration.
 *
 * ─── Trust model ──────────────────────────────────────────────────────────────
 * The values returned here are UI HINTS ONLY. Never gate a feature on
 * `hasStandardAccess()` alone — the client can be tampered with. The backend
 * (`GET /api/billing/status`) is the authority, and every premium endpoint
 * re-checks entitlement server-side regardless of what the app believes.
 *
 * The SDK's job is to (a) run the purchase sheet and (b) tell the backend
 * "something changed, please re-verify with RevenueCat".
 *
 * ─── Graceful degradation ─────────────────────────────────────────────────────
 * This module was previously commented out wholesale because a missing API key
 * caused errors at startup. Rather than disabling it again, every export now
 * no-ops safely when `isConfigured()` is false, so a build without keys still
 * runs — it simply cannot purchase.
 */

import { Platform, Linking } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
//
// PUBLIC SDK keys — safe to ship in the app binary.
// The SECRET key (sk_...) is server-side only and must NEVER appear here.
//   RevenueCat → Project Settings → API Keys → Public app-specific keys
// ─────────────────────────────────────────────────────────────────────────────
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS || '';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID || '';

/**
 * Entitlement identifier, mirrored from the RevenueCat dashboard.
 * Both Standard Monthly and Standard Yearly grant this SAME entitlement — it
 * answers "may this user use Standard features?", while the product id
 * distinguishes which plan they bought.
 */
export const RC_ENTITLEMENT = 'standard_access';

/**
 * Store product identifiers. Must match Google Play Console exactly, and the
 * `storeProductIds` on the corresponding plan documents in MongoDB.
 *
 * The Add-on Pack is a CONSUMABLE with no entitlement — it reaches the backend
 * as a NON_RENEWING_PURCHASE and is tracked as a Purchase, not a subscription.
 * That is why it is absent from the entitlement check below.
 */
export const RC_PRODUCTS = {
  standardMonthly: 'vedicscan_standard_monthly',
  standardYearly: 'vedicscan_standard_yearly',
  addonPack: 'vedicscan_addon_pack',
};

let configured = false;

/** True when a usable public API key is present for this platform. */
export function isConfigured() {
  const key = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  return Boolean(key);
}

// ─────────────────────────────────────────────────────────────────────────────
// SDK lifecycle
// ─────────────────────────────────────────────────────────────────────────────

export function configureRevenueCat() {
  if (configured) return;

  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!apiKey) {
    console.warn(
      '[RevenueCat] No public API key for this platform. Purchases are disabled. ' +
        'Set EXPO_PUBLIC_RC_API_KEY_ANDROID / _IOS in mobileApp/.env'
    );
    return;
  }

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    configured = true;
  } catch (e) {
    console.warn('[RevenueCat] configure failed:', e?.message);
  }
}

/**
 * Identify the user to RevenueCat.
 *
 * `userId` MUST be the MongoDB user _id. The backend maps webhook
 * `app_user_id` → `User._id`; pass anything else and webhooks resolve to no
 * user, so the purchase is silently dropped.
 */
export async function loginRevenueCat(userId) {
  if (!configured || !userId) return null;
  try {
    const { customerInfo } = await Purchases.logIn(String(userId));
    return customerInfo;
  } catch (e) {
    console.warn('[RevenueCat] logIn failed:', e?.message);
    return null;
  }
}

/**
 * Clear the identity on sign-out.
 *
 * Skipping this lets the next user on the same device inherit the previous
 * user's entitlements locally.
 */
export async function logoutRevenueCat() {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Safe to ignore — logging out an anonymous user throws by design.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entitlement inspection (UI hints only)
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerInfo() {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (e) {
    console.warn('[RevenueCat] getCustomerInfo failed:', e?.message);
    return null;
  }
}

/** True when the Standard entitlement is active. */
export function hasStandardAccess(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[RC_ENTITLEMENT];
}

export function getExpiryDate(customerInfo) {
  return customerInfo?.entitlements?.active?.[RC_ENTITLEMENT]?.expirationDate ?? null;
}

export function getActiveProductId(customerInfo) {
  return customerInfo?.entitlements?.active?.[RC_ENTITLEMENT]?.productIdentifier ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offerings & purchasing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Current offering's packages, keyed by store product id so callers can line
 * them up against the backend plan catalogue.
 */
export async function getPackages() {
  if (!configured) return {};
  try {
    const offerings = await Purchases.getOfferings();
    const packages = offerings?.current?.availablePackages ?? [];

    const byProductId = {};
    packages.forEach((pkg) => {
      const productId = pkg.product?.identifier;
      if (productId) byProductId[productId] = pkg;
    });
    return byProductId;
  } catch (e) {
    console.warn('[RevenueCat] getOfferings failed:', e?.message);
    return {};
  }
}

/**
 * Purchase a specific store product.
 *
 * On success the backend is asked to re-verify. The webhook is authoritative,
 * but it is not instantaneous (sandbox delivery in particular lags), so this
 * pull-sync stops the user from briefly still seeing a paywall after paying.
 *
 * @returns {{status: 'purchased'|'cancelled'|'error', error?: Error}}
 */
export async function purchaseProduct(productId) {
  if (!configured) {
    return { status: 'error', error: new Error('Purchases are not available right now.') };
  }

  try {
    const packages = await getPackages();
    const pkg = packages[productId];

    if (!pkg) {
      return {
        status: 'error',
        error: new Error(
          `"${productId}" is not in the current RevenueCat offering. ` +
            'Check the product is active in Play Console and attached to the offering.'
        ),
      };
    }

    await Purchases.purchasePackage(pkg);
    await syncToBackend();
    return { status: 'purchased' };
  } catch (e) {
    // The SDK signals user cancellation with a flag rather than a distinct
    // error type — treating it as a failure would show a spurious error alert.
    if (e?.userCancelled) return { status: 'cancelled' };
    console.warn('[RevenueCat] purchase failed:', e?.message);
    return { status: 'error', error: e };
  }
}

/**
 * Restore purchases after a reinstall or device change (required by both
 * store review guidelines).
 */
export async function restorePurchases() {
  if (!configured) {
    return { success: false, error: new Error('Purchases are not available right now.') };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    await syncToBackend(true);
    return { success: true, customerInfo };
  } catch (e) {
    console.warn('[RevenueCat] restorePurchases failed:', e?.message);
    return { success: false, error: e };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Backend synchronisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ask the backend to re-verify this user's entitlements against RevenueCat.
 *
 * Deliberately sends NO entitlement data. The backend calls RevenueCat's REST
 * API itself and ignores anything the client claims — this request only means
 * "something changed, please look again".
 */
export async function syncToBackend(isRestore = false) {
  try {
    const path = isRestore ? '/api/billing/restore' : '/api/billing/sync';
    const { data } = await api.post(path, {});
    return data?.data ?? null;
  } catch (e) {
    console.warn('[RevenueCat] Backend sync failed:', e?.message);
    return null;
  }
}

/**
 * Backwards-compatible alias.
 * @deprecated Use `syncToBackend()`.
 */
export const syncRevenueCatToBackend = syncToBackend;

/**
 * Open the store's own subscription-management screen.
 *
 * Recurring subscriptions can only be cancelled through the store that sold
 * them — Google Play and Apple both require this, and neither exposes an API to
 * cancel on the user's behalf. RevenueCat supplies a `managementURL` pointing at
 * the right place for whichever store owns the subscription.
 */
export async function openManageSubscriptions() {
  const fallback =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';

  try {
    const info = await getCustomerInfo();
    const url = info?.managementURL || fallback;
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(fallback).catch(() => {});
  }
}

/** Authoritative entitlement state, straight from our backend. */
export async function fetchBillingStatus() {
  try {
    const { data } = await api.get('/api/billing/status');
    return data?.success ? data.data : null;
  } catch (e) {
    console.warn('[Billing] status fetch failed:', e?.message);
    return null;
  }
}
