// Re-export from organized lib for backward compatibility
export type { UserRole } from '@/lib/chat';
export { 
  getUserRole,
  getUserDisplayName,
  formatMessageTime,
  isMessageFromCurrentUser,
  getMessageAlignment,
  getMessageStyles
} from '@/lib/chat';

export { getRoleLabel } from '@/lib/formatters';
export { getRoleStyles } from '@/lib/styles';
export { isImageFile, validateFile } from '@/lib/validators';