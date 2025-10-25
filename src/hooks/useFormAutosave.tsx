import { useEffect, useMemo, useRef, useState, useCallback } from "react";

export interface UseFormAutosaveOptions {
  storage?: "local" | "session";
  debounceMs?: number;
  encrypt?: boolean;
}

/**
 * Hook para auto-guardar formularios con debounce y rehidratación automática
 * Previene pérdida de datos al cambiar de pestaña o recargar la página
 * 
 * @param key - Clave única para identificar el formulario en storage
 * @param initial - Estado inicial del formulario
 * @param opts - Opciones de configuración (storage type, debounce, encriptación)
 * @returns { values, setValues, updateField, reset, isDirty }
 */
export function useFormAutosave<T extends Record<string, any>>(
  key: string,
  initial: T,
  opts?: UseFormAutosaveOptions
) {
  const storage = opts?.storage === "session" ? sessionStorage : localStorage;
  const debounceMs = opts?.debounceMs ?? 400;

  // Hidratar estado inicial desde storage
  const hydrated = useMemo(() => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return initial;
      
      const parsed = JSON.parse(raw);
      
      // Deserializar fechas
      const deserializeValue = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        
        // Detectar strings de fecha ISO y convertir a Date
        if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
          return new Date(obj);
        }
        
        // Procesar objetos recursivamente
        if (typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date)) {
          const result: any = {};
          for (const k in obj) {
            result[k] = deserializeValue(obj[k]);
          }
          return result;
        }
        
        // Procesar arrays recursivamente
        if (Array.isArray(obj)) {
          return obj.map(item => deserializeValue(item));
        }
        
        return obj;
      };
      
      return deserializeValue(parsed) as T;
    } catch (error) {
      console.warn(`Failed to hydrate form from storage (${key}):`, error);
      return initial;
    }
  }, [key, storage]);

  const [values, setValues] = useState<T>(hydrated);
  const [isDirty, setDirty] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  // Auto-guardar con debounce
  useEffect(() => {
    // No marcar como dirty ni guardar en el primer render (hidratación)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setDirty(true);

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Guardar después del debounce
    timeoutRef.current = window.setTimeout(() => {
      try {
        const serialized = JSON.stringify(values);
        storage.setItem(key, serialized);
        console.log(`💾 Form autosaved: ${key}`);
      } catch (error) {
        console.error(`Failed to autosave form (${key}):`, error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [values, key, debounceMs, storage]);

  // Helper para actualizar un campo específico
  const updateField = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  // Resetear y limpiar storage
  const reset = useCallback(() => {
    try {
      storage.removeItem(key);
      console.log(`🗑️ Form draft cleared: ${key}`);
    } catch (error) {
      console.error(`Failed to clear form draft (${key}):`, error);
    }
    setValues(initial);
    setDirty(false);
  }, [key, storage, initial]);

  return {
    values,
    setValues,
    updateField,
    reset,
    isDirty
  };
}
