import { lazy, ComponentType } from "react";

/**
 * Wraps a dynamic import with retry logic for chunk/module load failures.
 * If the import fails (e.g. stale cache after deployment), it reloads the page once.
 * Uses sessionStorage to prevent infinite reload loops.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  chunkName?: string
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = `chunk-retry-${chunkName || 'default'}`;
    const hasRetried = sessionStorage.getItem(storageKey);

    try {
      const component = await componentImport();
      // Success — clear any previous retry flag
      sessionStorage.removeItem(storageKey);
      return component;
    } catch (error) {
      if (!hasRetried) {
        // First failure: mark retry and reload
        sessionStorage.setItem(storageKey, '1');
        console.warn(`[lazyWithRetry] Chunk "${chunkName || 'unknown'}" failed to load, reloading...`, error);
        window.location.reload();
        // Return dummy to satisfy types (won't render — page is reloading)
        return { default: (() => null) as unknown as T };
      }
      // Already retried once — clear flag and let error propagate to ErrorBoundary
      sessionStorage.removeItem(storageKey);
      throw error;
    }
  });
}
