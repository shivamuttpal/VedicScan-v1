import { Platform } from 'react-native';
// import Purchases, { LOG_LEVEL } from 'react-native-purchases';
// import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import api from './api';

// RevenueCat temporarily disabled to prevent API errors
// Re-enable by uncommenting the imports above and removing the no-op functions below

// -----------------------------------------------------------------
// API Keys — loaded from mobileApp/.env
// EXPO_PUBLIC_RC_API_KEY_IOS     → Apps & providers → iOS App → API Key
// EXPO_PUBLIC_RC_API_KEY_ANDROID → Apps & providers → Android App → API Key
// -----------------------------------------------------------------
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS || '';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID || '';

// Entitlement ID — must match what you created in the RevenueCat dashboard
export const RC_ENTITLEMENT = 'vedicscan Pro';

// Product identifiers — must match App Store Connect / Google Play Console
export const RC_PRODUCTS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
};

// -----------------------------------------------------------------
// SDK lifecycle
// -----------------------------------------------------------------

export function configureRevenueCat() {
  // RevenueCat disabled — this is a no-op
  console.log('[RevenueCat] SDK disabled (commented out)');
  // const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  // if (!apiKey) { ... }
  // Purchases.configure({ apiKey });
}

export async function loginRevenueCat(userId) {
  // Disabled — returns null
  return null;
  // try {
  //   const { customerInfo } = await Purchases.logIn(String(userId));
  //   return customerInfo;
  // } catch (e) {
  //   console.warn('[RevenueCat] logIn failed:', e?.message);
  //   return null;
  // }
}

export async function logoutRevenueCat() {
  // Disabled — no-op
  // try {
  //   await Purchases.logOut();
  // } catch {
  //   // Safe to ignore
  // }
}

// -----------------------------------------------------------------
// Customer info & entitlement
// -----------------------------------------------------------------

export async function getCustomerInfo() {
  // Disabled — returns null
  return null;
  // try {
  //   return await Purchases.getCustomerInfo();
  // } catch (e) {
  //   console.warn('[RevenueCat] getCustomerInfo failed:', e?.message);
  //   return null;
  // }
}

/** Returns true when the user has an active vedicscan Pro entitlement */
export function hasPro(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[RC_ENTITLEMENT];
}

/** Returns expiry date string for the pro entitlement, or null */
export function getProExpiryDate(customerInfo) {
  return customerInfo?.entitlements?.active?.[RC_ENTITLEMENT]?.expirationDate ?? null;
}

/** Returns 'lifetime' | 'yearly' | 'monthly' | null for the active product */
export function getActiveProductId(customerInfo) {
  return customerInfo?.entitlements?.active?.[RC_ENTITLEMENT]?.productIdentifier ?? null;
}

// -----------------------------------------------------------------
// Paywall
// -----------------------------------------------------------------

/**
 * Opens the RevenueCat Paywall.
 * Returns one of: 'purchased' | 'restored' | 'cancelled' | 'error' | 'not_presented'
 */
export async function presentPaywall() {
  // Disabled — returns error
  return 'error';
  // try {
  //   const result = await RevenueCatUI.presentPaywall();
  //   return mapPaywallResult(result);
  // } catch (e) {
  //   console.warn('[RevenueCat] presentPaywall failed:', e?.message);
  //   return 'error';
  // }
}

export async function presentPaywallIfNeeded() {
  // Disabled — returns not_presented (prevents nag screens)
  return 'not_presented';
  // try {
  //   const result = await RevenueCatUI.presentPaywallIfNeeded({
  //     requiredEntitlementIdentifier: RC_ENTITLEMENT,
  //   });
  //   return mapPaywallResult(result);
  // } catch (e) {
  //   console.warn('[RevenueCat] presentPaywallIfNeeded failed:', e?.message);
  //   return 'error';
  // }
}

function mapPaywallResult(result) {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:   return 'purchased';
    case PAYWALL_RESULT.RESTORED:    return 'restored';
    case PAYWALL_RESULT.CANCELLED:   return 'cancelled';
    case PAYWALL_RESULT.NOT_PRESENTED: return 'not_presented';
    default:                         return 'error';
  }
}

// -----------------------------------------------------------------
// Customer Center  (manage subscriptions, request refunds, etc.)
// -----------------------------------------------------------------

export async function presentCustomerCenter() {
  // Disabled — no-op
  // try {
  //   await RevenueCatUI.presentCustomerCenter();
  // } catch (e) {
  //   console.warn('[RevenueCat] presentCustomerCenter failed:', e?.message);
  // }
}

// -----------------------------------------------------------------
// Restore purchases  (required by App Store guidelines)
// -----------------------------------------------------------------

export async function restorePurchases() {
  // Disabled — returns success: false
  return { success: false, error: new Error('[RevenueCat] SDK disabled') };
  // try {
  //   const customerInfo = await Purchases.restorePurchases();
  //   return { success: true, customerInfo };
  // } catch (e) {
  //   console.warn('[RevenueCat] restorePurchases failed:', e?.message);
  //   return { success: false, error: e };
  // }
}

export async function syncRevenueCatToBackend() {
  // Disabled — no-op return false
  return false;
  // try {
  //   const customerInfo = await Purchases.getCustomerInfo();
  //   const active = customerInfo?.entitlements?.active ?? {};
  //   const entitlementIds = Object.keys(active);
  //   const entitlement = active[RC_ENTITLEMENT];
  //   if (!entitlement) { return false; }
  //   const productId = entitlement.productIdentifier ?? '';
  //   const expirationAtMs = entitlement.expirationDate
  //     ? new Date(entitlement.expirationDate).getTime()
  //     : null;
  //   await api.post('/api/subscription/revenuecat-sync', {
  //     productId, entitlementIds, expirationAtMs, isActive: true,
  //   });
  //   console.log('[RevenueCat] Synced to backend — product:', productId);
  //   return true;
  // } catch (e) {
  //   console.warn('[RevenueCat] Backend sync failed:', e?.message);
  //   return false;
  // }
}
