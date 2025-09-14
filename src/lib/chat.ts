import type { PackageMessage, Package } from '@/types';
import { getRoleStyles } from './styles';

export type UserRole = 'shopper' | 'traveler' | 'admin';

// User role determination
export const getUserRole = (userId: string, pkg: Package, userDatabaseRole?: string): UserRole => {
  // If user has admin role in database, always return admin
  if (userDatabaseRole === 'admin') return 'admin';
  
  // Otherwise check package relationship
  if (pkg.user_id === userId) return 'shopper';
  
  // For non-admin, non-owner users, they are travelers
  return 'traveler';
};

// User display utilities
export const getUserDisplayName = (message: PackageMessage, role: UserRole): string => {
  // If we have profile data, use the full name
  if (message.user_profile?.first_name || message.user_profile?.last_name) {
    const fullName = [message.user_profile.first_name, message.user_profile.last_name]
      .filter(Boolean)
      .join(' ');
    if (fullName) return fullName;
  }
  
  // Fallback to role-based names
  const roleNames = {
    shopper: 'Comprador',
    traveler: 'Viajero', 
    admin: 'Administrador'
  };
  
  return roleNames[role];
};

// Chat message utilities
export const formatMessageTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isMessageFromCurrentUser = (message: PackageMessage, userId: string): boolean => {
  return message.user_id === userId;
};

export const getMessageAlignment = (message: PackageMessage, userId: string): 'left' | 'right' => {
  return isMessageFromCurrentUser(message, userId) ? 'right' : 'left';
};

export const getMessageStyles = (role: UserRole, isCurrentUser: boolean) => {
  const roleStyles = getRoleStyles(role);
  
  if (isCurrentUser) {
    return {
      container: 'ml-auto max-w-[80%]',
      bubble: `${roleStyles.bg} ${roleStyles.text} ${roleStyles.border} border`,
      name: roleStyles.text
    };
  }
  
  return {
    container: 'mr-auto max-w-[80%]',
    bubble: `bg-muted text-muted-foreground border border-border`,
    name: 'text-muted-foreground'
  };
};