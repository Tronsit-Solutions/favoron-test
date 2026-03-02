export interface ConfirmationDocument {
  filename?: string;
  uploadedAt?: string;
  filePath?: string;
  bucket?: string;
  mimeType?: string;
  size?: number;
  type?: string;
}

/**
 * Normalizes purchase_confirmation data to always return an array.
 * Handles backward compatibility with legacy single-object format.
 */
export const normalizeConfirmations = (data: any): ConfirmationDocument[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data]; // single legacy object
};
