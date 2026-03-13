import { registerReferral } from '@/hooks/useReferrals';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if there's a pending referral code in localStorage that hasn't expired.
 */
export function getPendingReferral(): { code: string; isExpired: boolean } | null {
  const code = localStorage.getItem('pending_referral_code');
  if (!code) return null;

  const ts = localStorage.getItem('pending_referral_code_ts');
  const isExpired = ts ? (Date.now() - Number(ts)) > SEVEN_DAYS_MS : false;
  return { code, isExpired };
}

/**
 * Clear the pending referral code from localStorage.
 */
export function clearPendingReferral(): void {
  localStorage.removeItem('pending_referral_code');
  localStorage.removeItem('pending_referral_code_ts');
}

/**
 * Attempt to register a referral with retries and delays.
 * Only clears localStorage on success.
 * Returns true if the referral was registered successfully.
 */
export async function attemptReferralRegistration(
  userId: string,
  referralCode: string,
  options: { maxRetries?: number; initialDelayMs?: number } = {}
): Promise<boolean> {
  const { maxRetries = 2, initialDelayMs = 1500 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Wait before each attempt (profile trigger may not have run yet)
    const delay = attempt === 0 ? initialDelayMs : initialDelayMs * Math.pow(2, attempt);
    console.log(`[ReferralRetry] Attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));

    const result = await registerReferral(userId, referralCode);

    if (result.success) {
      console.log('[ReferralRetry] ✅ Referral registered successfully');
      clearPendingReferral();
      return true;
    }

    // If error is not retryable (e.g. invalid code, already referred), stop
    if (!result.shouldRetry) {
      console.warn('[ReferralRetry] Non-retryable error, stopping:', result.error);
      // If the RPC returned false (invalid code / already referred), clear to avoid infinite retries
      if (!result.error) {
        clearPendingReferral();
      }
      return false;
    }

    console.warn(`[ReferralRetry] Retryable error on attempt ${attempt + 1}:`, result.error);
  }

  console.warn('[ReferralRetry] All retries exhausted, keeping code for next session');
  return false;
}

/**
 * Check for and attempt pending referral registration.
 * Safe to call on login or app load — does nothing if no pending code.
 */
export async function retryPendingReferral(userId: string): Promise<void> {
  const pending = getPendingReferral();
  if (!pending) return;

  if (pending.isExpired) {
    console.log('[ReferralRetry] ⏰ Pending referral code expired, clearing');
    clearPendingReferral();
    return;
  }

  console.log('[ReferralRetry] Found pending referral code, attempting registration...');
  await attemptReferralRegistration(userId, pending.code, { initialDelayMs: 500 });
}
