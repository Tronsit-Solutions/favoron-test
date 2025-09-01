// Client-side error logger specifically for form submissions
export const logFormError = async (error: any, formType: string, formData?: any) => {
  try {
    const errorData = {
      message: error.message || error.toString(),
      formType,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      formDataSample: formData ? { 
        hasRequiredFields: Object.keys(formData).length > 0,
        fieldCount: Object.keys(formData).length 
      } : null,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Log to console for immediate debugging
    console.error(`🚨 ${formType} form error:`, errorData);

    // Send to our edge function for persistent logging
    await fetch('/api/log-client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    }).catch(err => {
      console.warn('Failed to send error log to server:', err);
    });
  } catch (logError) {
    console.error('Failed to log form error:', logError);
  }
};

// Form validation logger
export const logFormValidationError = (missingFields: string[], formType: string) => {
  const validationError = {
    type: 'FORM_VALIDATION_ERROR',
    missingFields,
    formType,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    timestamp: new Date().toISOString()
  };
  
  console.warn(`⚠️ ${formType} validation failed:`, validationError);
  
  // Also send validation errors to logging
  logFormError(new Error(`Validation failed: ${missingFields.join(', ')}`), formType, { missingFields });
};