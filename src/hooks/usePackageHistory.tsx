import { Package } from '@/types';

export interface PackageHistoryInfo {
  isReQuote: boolean;
  reason: 'expired' | 'rejected' | 'new';
  details?: string;
  timestamp?: Date;
}

export const usePackageHistory = () => {
  const getPackageHistory = (pkg: Package): PackageHistoryInfo => {
    // Check for rejection reason and re-quote request
    const hasRejectionReason = pkg.rejection_reason && pkg.rejection_reason.trim() !== '';
    const wantsRequote = pkg.wants_requote === true;
    
    if (hasRejectionReason && wantsRequote) {
      return {
        isReQuote: true,
        reason: 'rejected',
        details: pkg.rejection_reason,
        timestamp: pkg.updated_at ? new Date(pkg.updated_at) : undefined
      };
    }

    // Check admin actions log for expiration
    if (pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log)) {
      const logs = pkg.admin_actions_log as any[];
      const expirationLog = logs.find(log => {
        const action = typeof log.action === 'string' ? log.action : '';
        const details = typeof log.details === 'string' ? log.details : '';
        return action.includes('expire') || 
               action.includes('timeout') ||
               details.includes('expired');
      });
      
      if (expirationLog) {
        return {
          isReQuote: true,
          reason: 'expired',
          details: 'Cotización expiró por falta de respuesta',
          timestamp: expirationLog.timestamp ? new Date(expirationLog.timestamp) : undefined
        };
      }
    }

    return {
      isReQuote: false,
      reason: 'new'
    };
  };

  const isReQuotedPackage = (pkg: Package): boolean => {
    return getPackageHistory(pkg).isReQuote;
  };

  const filterPackagesByHistory = (packages: Package[], filter: 'all' | 'new' | 'requoted'): Package[] => {
    if (filter === 'all') return packages;
    
    return packages.filter(pkg => {
      const history = getPackageHistory(pkg);
      return filter === 'requoted' ? history.isReQuote : !history.isReQuote;
    });
  };

  const getReQuoteStats = (packages: Package[]) => {
    const stats = {
      total: packages.length,
      new: 0,
      expired: 0,
      rejected: 0
    };

    packages.forEach(pkg => {
      const history = getPackageHistory(pkg);
      if (!history.isReQuote) {
        stats.new++;
      } else if (history.reason === 'expired') {
        stats.expired++;
      } else if (history.reason === 'rejected') {
        stats.rejected++;
      }
    });

    return stats;
  };

  return {
    getPackageHistory,
    isReQuotedPackage,
    filterPackagesByHistory,
    getReQuoteStats
  };
};