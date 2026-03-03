
/* Global client error logger initializer
   - Captura window.error y window.unhandledrejection
   - Envía a Edge Function: /functions/v1/log-client-error
   - Evita duplicados en ráfagas
   - Expone window.favoronLogError(errorLike, context?)
*/
type AnyRecord = Record<string, any>;

declare global {
  interface Window {
    __favoronLoggerInitialized?: boolean;
    favoronLogError?: (err: unknown, context?: AnyRecord) => void;
  }
}

const EDGE_URL = "https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/log-client-error";
const PROJECT_AUTH_KEY = "sb-dfhoduirmqbarjnspbdh-auth-token";

const getAuthToken = (): string | undefined => {
  try {
    const raw = localStorage.getItem(PROJECT_AUTH_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // supabase-js v2 stores currentSession.access_token
    const token =
      parsed?.currentSession?.access_token ||
      parsed?.access_token ||
      parsed?.accessToken;
    return typeof token === "string" ? token : undefined;
  } catch {
    return undefined;
  }
};

const buildBrowserInfo = () => {
  try {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : undefined;
    const viewport =
      typeof window !== "undefined"
        ? { width: window.innerWidth, height: window.innerHeight, dpr }
        : undefined;

    return {
      ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      platform: typeof navigator !== "undefined" ? navigator.platform : undefined,
      language: typeof navigator !== "undefined" ? navigator.language : undefined,
      viewport,
      time: new Date().toISOString(),
    };
  } catch {
    return undefined;
  }
};

const fingerprintOf = (message: string, stack?: string | null) => {
  const base = `${message}|${stack || ""}`.slice(0, 500);
  // simple hash
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = (h << 5) - h + base.charCodeAt(i);
    h |= 0;
  }
  return `f${h}`;
};

const recentCache = new Map<string, number>();
const isDuplicate = (fp: string, windowMs = 10000) => {
  const now = Date.now();
  const last = recentCache.get(fp) || 0;
  if (now - last < windowMs) return true;
  recentCache.set(fp, now);
  return false;
};

const sendLog = async (payload: AnyRecord) => {
  const token = getAuthToken();

  await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true, // permite enviar incluso al cerrar pestaña (si el navegador lo soporta)
  }).catch(() => {
    // Intencionalmente silencioso para no crear loops de error
  });
};

const normalizeError = (err: unknown) => {
  if (err instanceof Error) {
    return { message: err.message, name: err.name, stack: err.stack ?? null };
  }
  if (typeof err === "string") {
    return { message: err, name: "Error", stack: null };
  }
  try {
    const message = JSON.stringify(err);
    return { message, name: "Error", stack: null };
  } catch {
    return { message: "Unknown error", name: "Error", stack: null };
  }
};

export const initClientErrorLogger = () => {
  if (typeof window === "undefined") return;
  if (window.__favoronLoggerInitialized) return;

  window.__favoronLoggerInitialized = true;

  const commonContext = () => ({
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    browser: buildBrowserInfo(),
  });

  // Manual logger accesible desde consola: window.favoronLogError(err, ctx)
  window.favoronLogError = (err: unknown, context?: AnyRecord) => {
    const norm = normalizeError(err);
    const fp = fingerprintOf(norm.message, norm.stack || undefined);
    if (isDuplicate(fp)) return;
    void sendLog({
      ...commonContext(),
      ...context,
      message: norm.message,
      name: norm.name,
      stack: norm.stack,
      type: "manual",
      severity: context?.severity || "error",
      fingerprint: fp,
      session_id: context?.session_id,
      user_id: context?.user_id,
      context: context ? { ...context } : undefined,
    });
  };

  // Capturar errores no manejados
  window.addEventListener("error", (event: ErrorEvent) => {
    const norm = normalizeError(event.error || event.message);
    const fp = fingerprintOf(norm.message, norm.stack || undefined);
    if (isDuplicate(fp)) return;

    const context = {
      filename: (event as any).filename,
      lineno: (event as any).lineno,
      colno: (event as any).colno,
    };

    void sendLog({
      ...commonContext(),
      ...context,
      message: norm.message,
      name: norm.name,
      stack: norm.stack,
      type: "error",
      severity: "error",
      fingerprint: fp,
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    event.preventDefault(); // Evitar que el navegador trate la rejection como fatal
    const reason = (event && (event as any).reason) ?? "unhandledrejection";
    const norm = normalizeError(reason);
    const fp = fingerprintOf(norm.message, norm.stack || undefined);
    if (isDuplicate(fp)) return;

    void sendLog({
      ...commonContext(),
      message: norm.message,
      name: norm.name,
      stack: norm.stack,
      type: "unhandledrejection",
      severity: "error",
      fingerprint: fp,
    });
  });
};
