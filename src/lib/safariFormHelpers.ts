// Safari iOS specific form submission helpers
export const isSafariIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

export const safariFormSubmitWrapper = async (submitFunction: () => Promise<void>, formType: string) => {
  const { logFormError } = await import('@/lib/formErrorLogger');
  
  try {
    // Pre-submission logging for Safari iOS
    if (isSafariIOS()) {
      console.log(`🍎 Safari iOS form submission starting: ${formType}`);
      
      // Add small delay to ensure form state is stable on Safari iOS
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await submitFunction();
    
    if (isSafariIOS()) {
      console.log(`✅ Safari iOS form submission completed: ${formType}`);
    }
  } catch (error) {
    console.error(`💥 Safari iOS form submission failed: ${formType}`, error);
    
    logFormError(error, `${formType}-safari-ios`, {
      safariVersion: navigator.userAgent.match(/Version\/([0-9\.]+)/)?.[1] || 'unknown',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    
    throw error; // Re-throw to maintain normal error handling flow
  }
};

export const enhanceFormElementsForSafari = () => {
  if (!isSafariIOS()) return;
  
  // Add webkit appearance fixes for form elements
  const style = document.createElement('style');
  style.textContent = `
    /* Safari iOS form fixes */
    input[type="text"], 
    input[type="email"], 
    input[type="url"], 
    input[type="number"], 
    input[type="tel"], 
    select, 
    textarea {
      -webkit-appearance: none !important;
      border-radius: 0 !important;
    }
    
    /* Prevent zoom on input focus */
    input, select, textarea {
      font-size: 16px !important;
    }
    
    /* Fix button tap highlight */
    button {
      -webkit-tap-highlight-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
  
  console.log('🍎 Safari iOS form enhancements applied');
};