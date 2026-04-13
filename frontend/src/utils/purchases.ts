import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// TODO: RevenueCat dashboard'dan API key alın:
//   https://app.revenuecat.com → Apps → [Uygulamanız] → API Keys → Apple API Key
// ─────────────────────────────────────────────────────────────────────────────
const RC_API_KEY_IOS = 'appl_fjkstFwybHVwjLbAYzFnBktDjRo';

export const ENTITLEMENT_ID = 'premium';

export function initPurchases() {
  if (Platform.OS !== 'ios') return;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
}

export async function identifyPurchaseUser(userId: string) {
  if (Platform.OS !== 'ios') return;
  try {
    await Purchases.logIn(userId);
  } catch {}
}

export async function purchasePremium(): Promise<boolean> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages[0];
  if (!pkg) {
    throw new Error(
      'Satın alma seçeneği bulunamadı. Lütfen tekrar deneyin.'
    );
  }
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
}

export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

export async function isPremiumActive(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
