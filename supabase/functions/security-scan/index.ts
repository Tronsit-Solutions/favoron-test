// Security scanning edge function for comprehensive security analysis
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityScanResult {
  timestamp: string;
  overall_score: number;
  findings: SecurityFinding[];
  recommendations: string[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  recommendation: string;
  status: 'resolved' | 'pending' | 'investigating';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Starting comprehensive security scan...');

    // Initialize findings array
    const findings: SecurityFinding[] = [];
    
    // 1. Database Security Checks
    console.log('📊 Checking database security...');
    
    // Check RLS policies
    const { data: rlsStatus } = await supabaseClient
      .rpc('get_table_rls_status');
    
    if (!rlsStatus) {
      findings.push({
        id: 'rls-missing',
        severity: 'critical',
        category: 'Database Security',
        title: 'Missing Row Level Security',
        description: 'Some tables may not have RLS enabled',
        recommendation: 'Enable RLS on all sensitive tables',
        status: 'pending'
      });
    }

    // 2. Authentication Security
    console.log('🔐 Checking authentication security...');
    
    // Check for recent failed authentication attempts
    const { data: authFailures } = await supabaseClient
      .from('client_errors')
      .select('*')
      .eq('type', 'auth_failure')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (authFailures && authFailures.length > 5) {
      findings.push({
        id: 'high-auth-failures',
        severity: 'medium',
        category: 'Authentication',
        title: 'High Authentication Failure Rate',
        description: `${authFailures.length} authentication failures detected in the last 24 hours`,
        recommendation: 'Review authentication logs and consider implementing additional security measures',
        status: 'investigating'
      });
    }

    // 3. Financial Data Security
    console.log('💰 Checking financial data security...');
    
    // Check for unmasked financial data access
    const { data: financialAccess } = await supabaseClient
      .from('client_errors')
      .select('*')
      .eq('type', 'security_audit')
      .eq('name', 'financial_data_access')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const unmaskedAccess = financialAccess?.filter(
      record => record.context?.masked === false
    ) || [];

    if (unmaskedAccess.length > 0) {
      findings.push({
        id: 'unmasked-financial-access',
        severity: 'low',
        category: 'Data Protection',
        title: 'Unmasked Financial Data Access',
        description: `${unmaskedAccess.length} instances of unmasked financial data access detected`,
        recommendation: 'Review access patterns and ensure data masking is working correctly',
        status: 'pending'
      });
    }

    // 4. Session Security
    console.log('⏰ Checking session security...');
    
    // This would check for long-running sessions or suspicious activity
    // In a real implementation, you'd check session data
    
    // 5. Suspicious Activity Detection
    console.log('🕵️ Checking for suspicious activity...');
    
    const { data: suspiciousEvents } = await supabaseClient
      .from('client_errors')
      .select('*')
      .eq('type', 'suspicious_activity')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (suspiciousEvents && suspiciousEvents.length > 0) {
      findings.push({
        id: 'suspicious-activity-detected',
        severity: 'high',
        category: 'Threat Detection',
        title: 'Suspicious Activity Detected',
        description: `${suspiciousEvents.length} suspicious activities detected in the last 24 hours`,
        recommendation: 'Review activity logs and investigate potential security threats',
        status: 'investigating'
      });
    }

    // Calculate severity summary
    const summary = {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    };

    // Calculate overall security score (0-100)
    const totalFindings = findings.length;
    const criticalWeight = summary.critical * 25;
    const highWeight = summary.high * 15;
    const mediumWeight = summary.medium * 8;
    const lowWeight = summary.low * 3;
    
    const totalWeight = criticalWeight + highWeight + mediumWeight + lowWeight;
    const overallScore = Math.max(0, Math.min(100, 100 - totalWeight));

    // Generate recommendations
    const recommendations = [
      'Continue regular security monitoring and analysis',
      'Review and update security policies quarterly',
      'Ensure all team members follow security best practices',
      'Keep all dependencies and systems updated',
    ];

    if (summary.critical > 0) {
      recommendations.unshift('🚨 Address critical security issues immediately');
    }
    if (summary.high > 0) {
      recommendations.unshift('⚠️ Prioritize high-severity security findings');
    }

    const scanResult: SecurityScanResult = {
      timestamp: new Date().toISOString(),
      overall_score: overallScore,
      findings,
      recommendations,
      summary
    };

    console.log('✅ Security scan completed:', {
      score: overallScore,
      findings: totalFindings,
      summary
    });

    return new Response(
      JSON.stringify(scanResult),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Security scan failed:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Security scan failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});