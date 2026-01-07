// Content Security Policy configuration for enhanced security

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite development
    "'unsafe-eval'", // Required for Vite development
    "https://dfhoduirmqbarjnspbdh.supabase.co",
    "https://api.resend.com",
    "https://connect.facebook.net"
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS and component styles
    "https://fonts.googleapis.com"
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
    "data:"
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "https://dfhoduirmqbarjnspbdh.supabase.co",
    "https://www.facebook.com"
  ],
  'connect-src': [
    "'self'",
    "https://dfhoduirmqbarjnspbdh.supabase.co",
    "wss://dfhoduirmqbarjnspbdh.supabase.co",
    "https://api.resend.com",
    "https://www.facebook.com",
    "https://connect.facebook.net",
    process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
    process.env.NODE_ENV === 'development' ? 'http://localhost:*' : ''
  ].filter(Boolean),
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

/**
 * Generate CSP header value from directives
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSPHeader(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
} as const;

/**
 * Apply security headers to HTML meta tags
 */
export function getSecurityMetaTags(): string {
  return `
    <meta http-equiv="Content-Security-Policy" content="${generateCSPHeader()}">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta name="referrer" content="strict-origin-when-cross-origin">
  `;
}