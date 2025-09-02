import { useEffect, useState } from "react";
import { resolveSignedUrl } from "@/lib/storageUrls";

export function useSignedUrl(raw?: string | null, expiresInSeconds = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!raw) {
        setUrl(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resolved = await resolveSignedUrl(raw, expiresInSeconds);
        if (!cancelled) setUrl(resolved);
      } catch (e) {
        console.error("useSignedUrl error", e);
        if (!cancelled) setError("No se pudo generar el enlace");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [raw, expiresInSeconds]);

  return { url, loading, error };
}
