// Financial data security utilities for masking sensitive information
// and auditing financial data access

import { supabase } from '@/integrations/supabase/client';

/**
 * Masks sensitive financial data (bank account numbers, etc.)
 * Shows only the last 4 digits for security
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return '****';
  }
  
  if (accountNumber.length <= 4) {
    return '****';
  }
  
  return '****' + accountNumber.slice(-4);
}

/**
 * Masks sensitive banking information in objects
 */
export function maskBankingInfo<T extends Record<string, any>>(data: T): T {
  if (!data) return data;
  
  const masked = { ...data } as any;
  
  // Mask account numbers safely
  if (masked.bank_account_number && typeof masked.bank_account_number === 'string') {
    masked.bank_account_number = maskAccountNumber(masked.bank_account_number);
  }
  if (masked.account_number && typeof masked.account_number === 'string') {
    masked.account_number = maskAccountNumber(masked.account_number);
  }
  
  return masked;
}

/**
 * Audits financial data access for security monitoring
 */
export async function auditFinancialDataAccess(
  accessedUserId: string,
  accessType: 'view' | 'edit' | 'download',
  dataType: 'banking_info' | 'payment_order' | 'financial_summary',
  masked: boolean = true
): Promise<void> {
  try {
    await supabase.rpc('audit_financial_data_access', {
      _user_id: accessedUserId,
      _access_type: accessType,
      _data_type: dataType,
      _masked: masked
    });
  } catch (error) {
    console.warn('Failed to audit financial data access:', error);
  }
}

/**
 * Enhanced security check for admin financial data access
 */
export function requiresFinancialDataAuth(userRole: string | null): boolean {
  return userRole !== 'admin';
}

/**
 * Validates if user should have access to unmasked financial data
 */
export function canViewUnmaskedData(userRole: string | null, ownData: boolean = false): boolean {
  // Only admins and users viewing their own data can see unmasked info
  return userRole === 'admin' || ownData;
}

/**
 * Security headers for financial data API responses
 */
export const FINANCIAL_SECURITY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
} as const;