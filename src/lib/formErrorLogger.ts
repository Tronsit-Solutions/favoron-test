import { SecurityMonitor } from './securityMonitoring';
import { sanitizeInput } from './validators';

// Enhanced client-side error logger with security monitoring
export const logFormError = async (error: any, formType: string, formData?: any) => {
  try {
    // Sanitize inputs for security
    const sanitizedMessage = sanitizeInput(error?.message || error?.toString() || 'Unknown error', 1000);
    const sanitizedFormType = sanitizeInput(formType, 50);
    
    // Generate unique attempt ID for traceability
    const attemptId = `${sanitizedFormType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorData = {
      message: sanitizedMessage,
      name: error.name || 'FormSubmissionError',
      formType: sanitizedFormType,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      context: {
        attemptId,
        formType: sanitizedFormType,
        hasFormData: !!formData,
        formFieldCount: formData ? Object.keys(formData).length : 0,
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        network: {
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          downlink: (navigator as any).connection?.downlink || null
        }
      }
    };

    // Log to security monitor
    SecurityMonitor.logEvent({
      type: 'form_submission',
      details: {
        formType: sanitizedFormType,
        error: sanitizedMessage,
        severity: 'error',
        attemptId
      }
    });

    // Log to console for immediate debugging
    console.error(`🚨 [${attemptId}] ${sanitizedFormType} form error:`, errorData);

    // Import supabase and send to edge function with fallbacks for Safari iOS
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error: logError } = await supabase.functions.invoke('log-client-error', {
        body: errorData
      });
      
      if (logError) {
        console.warn(`⚠️ [${attemptId}] Supabase function error:`, logError);
        // Fallback for Safari iOS using navigator.sendBeacon if available
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/log-client-error',
            JSON.stringify(errorData)
          );
        }
      } else {
        console.log(`✅ [${attemptId}] Form error logged successfully`);
      }
    } catch (supabaseError) {
      console.warn(`⚠️ [${attemptId}] Supabase logging failed:`, supabaseError);
      
      // Safari iOS fallback: Use sendBeacon
      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/log-client-error',
          JSON.stringify(errorData)
        );
        console.log(`📡 [${attemptId}] Beacon fallback:`, success ? 'sent' : 'failed');
      }
    }
  } catch (logError) {
    console.error('💥 Failed to log form error:', logError);
  }
};

// Enhanced form validation logger with security monitoring
export const logFormValidationError = (missingFields: string[], formType: string) => {
  // Sanitize inputs
  const sanitizedFields = missingFields.map(field => sanitizeInput(field, 100));
  const sanitizedFormType = sanitizeInput(formType, 50);
  
  const attemptId = `validation_${sanitizedFormType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const validationError = {
    type: 'FORM_VALIDATION_ERROR',
    missingFields: sanitizedFields,
    formType: sanitizedFormType,
    attemptId,
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    timestamp: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
  
  // Log to security monitor
  SecurityMonitor.logEvent({
    type: 'form_submission',
    details: {
      formType: sanitizedFormType,
      validationError: true,
      missingFieldsCount: sanitizedFields.length,
      severity: 'warning',
      attemptId
    }
  });

  console.warn(`⚠️ [${attemptId}] ${sanitizedFormType} validation failed:`, validationError);
  
  // Also send validation errors to logging with enhanced context
  logFormError(
    new Error(`Validation failed: ${sanitizedFields.join(', ')}`), 
    sanitizedFormType, 
    { missingFields: sanitizedFields, validationType: 'required_fields' }
  );
};