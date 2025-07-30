// Re-export from organized lib for backward compatibility
export { getStatusColor, getPriorityColor, getPackagePriority } from '@/lib/styles';
export { getStatusLabel, getPriorityLabel } from '@/lib/formatters';
export { 
  canEditPackage, 
  canCancelPackage, 
  canViewPackageDetails, 
  canModifyPackageStatus, 
  canUploadDocuments 
} from '@/lib/permissions';