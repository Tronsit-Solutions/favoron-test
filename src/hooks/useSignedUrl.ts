import { useEffect, useState } from "react";
import { resolveSignedUrl } from "@/lib/storageUrls";

export function useSignedUrl(raw?: string | null, expiresInSeconds = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    async function run(attempt = 0) {
      if (!raw) {
        setUrl(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const resolved = await resolveSignedUrl(raw, expiresInSeconds);
        if (!cancelled) {
          setUrl(resolved);
          setRetryCount(0);
          setLoading(false);
        }
      } catch (e) {
        console.error(`useSignedUrl error (attempt ${attempt + 1}):`, e, { raw });
        
        // Retry logic for up to 2 attempts with exponential backoff
        if (attempt < 2 && !cancelled) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s delays
          timeoutId = setTimeout(() => {
            if (!cancelled) {
              setRetryCount(attempt + 1);
              run(attempt + 1);
            }
          }, delay);
        } else if (!cancelled) {
          setError("No se pudo generar el enlace");
        }
      } finally {
        if (!cancelled && (attempt >= 2 || url)) {
          setLoading(false);
        }
      }
    }
    
    run();
    
    return () => { 
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [raw, expiresInSeconds]);

  return { url, loading, error, retryCount };
}
