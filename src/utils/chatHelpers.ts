import { Package, PackageMessage } from '@/types';

export type UserRole = 'shopper' | 'traveler' | 'admin';

/**
 * Determines the user's role based on package data and user ID
 */
export const getUserRole = (userId: string, pkg: Package): UserRole => {
  if (userId === pkg.user_id) return 'shopper';
  if (pkg.matched_trip_id) return 'traveler';
  return 'admin';
};

/**
 * Gets the display name for a user from message data
 */
export const getUserDisplayName = (message: PackageMessage, role: UserRole): string => {
  const profile = message.user_profile;
  
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  
  if (profile?.username) {
    return profile.username;
  }
  
  return getRoleLabel(role);
};

/**
 * Gets the color classes for a user role using the design system
 */
export const getRoleStyles = (role: UserRole) => {
  switch (role) {
    case 'shopper':
      return {
        badge: 'bg-shopper/10 text-shopper border-shopper/30',
        message: 'bg-shopper/5 border-shopper/20 ml-0',
        avatar: 'bg-shopper/10 text-shopper'
      };
    case 'traveler':
      return {
        badge: 'bg-traveler/10 text-traveler border-traveler/30',
        message: 'bg-traveler/5 border-traveler/20 mr-0',
        avatar: 'bg-traveler/10 text-traveler'
      };
    case 'admin':
      return {
        badge: 'bg-admin/10 text-admin border-admin/30',
        message: 'bg-admin/5 border-admin/20',
        avatar: 'bg-admin/10 text-admin'
      };
    default:
      return {
        badge: 'bg-muted text-muted-foreground border-border',
        message: 'bg-muted border-border',
        avatar: 'bg-muted text-muted-foreground'
      };
  }
};

/**
 * Gets the localized label for a user role
 */
export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'shopper':
      return 'Shopper';
    case 'traveler':
      return 'Viajero';
    case 'admin':
      return 'Admin';
    default:
      return 'Usuario';
  }
};

/**
 * Checks if a file is an image based on its MIME type
 */
export const isImageFile = (fileType?: string): boolean => {
  return fileType?.startsWith('image/') ?? false;
};

/**
 * Validates file size and type for uploads
 */
export const validateFile = (file: File) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'El archivo es demasiado grande (máximo 10MB)' };
  }
  
  const isValidType = allowedTypes.some(type => file.type.startsWith(type));
  if (!isValidType) {
    return { valid: false, error: 'Tipo de archivo no permitido' };
  }
  
  return { valid: true };
};