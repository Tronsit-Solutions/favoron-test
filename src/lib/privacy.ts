/**
 * Privacy utilities for protecting customer data
 */

/**
 * Anonymizes customer names for public display while preserving testimonial value
 * @param name - Original customer name
 * @returns Anonymized name (e.g., "John D." or "María C.")
 */
export const anonymizeCustomerName = (name?: string): string => {
  if (!name || name.trim().length === 0) {
    return "Cliente anónimo";
  }

  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);
  
  if (words.length === 1) {
    // Single word name: show first letter + "***"
    return words[0].charAt(0).toUpperCase() + "***";
  }
  
  // Multiple words: show first name + first letter of last name
  const firstName = words[0];
  const lastNameInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return `${firstName} ${lastNameInitial}.`;
};

/**
 * Sanitizes product descriptions to remove potentially sensitive information
 * @param description - Original product description
 * @returns Sanitized description
 */
export const sanitizeProductDescription = (description?: string): string => {
  if (!description || description.trim().length === 0) {
    return "Producto";
  }

  // Remove potential personal identifiers (phone numbers, emails, addresses)
  let sanitized = description
    // Remove phone numbers
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[teléfono]")
    .replace(/\b\+?[\d\s\-\(\)]{10,}\b/g, "[teléfono]")
    // Remove email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email]")
    // Remove potential addresses (very basic pattern)
    .replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b/gi, "[dirección]");

  // Truncate if too long
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 97) + "...";
  }

  return sanitized.trim();
};

/**
 * Checks if a customer photo is safe to display publicly
 * @param photo - Customer photo object
 * @returns boolean indicating if photo should be displayed
 */
export const isPhotoSafeForPublicDisplay = (photo: any): boolean => {
  return (
    photo.status === 'approved' &&
    photo.customer_consent === true &&
    photo.usage_type === 'testimonial'
  );
};