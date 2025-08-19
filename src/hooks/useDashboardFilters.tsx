import { useState, useMemo } from 'react';
import { Package } from '@/types';

interface FilterOptions {
  showCancelled: boolean;
  showDelivered: boolean;
  showRejected: boolean;
}

export const useDashboardFilters = (packages: Package[]) => {
  const [filters, setFilters] = useState<FilterOptions>({
    showCancelled: false,
    showDelivered: true,
    showRejected: false,
  });

  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      if (pkg.status === 'cancelled' && !filters.showCancelled) return false;
      if (pkg.status === 'delivered' && !filters.showDelivered) return false;
      if (pkg.status === 'rejected' && !filters.showRejected) return false;
      return true;
    });
  }, [packages, filters]);

  const toggleFilter = (filterName: keyof FilterOptions) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const getFilterStats = () => {
    const stats = {
      total: packages.length,
      active: packages.filter(pkg => !['cancelled', 'delivered', 'rejected'].includes(pkg.status)).length,
      cancelled: packages.filter(pkg => pkg.status === 'cancelled').length,
      delivered: packages.filter(pkg => pkg.status === 'delivered').length,
      rejected: packages.filter(pkg => pkg.status === 'rejected').length,
    };

    return stats;
  };

  return {
    filters,
    filteredPackages,
    toggleFilter,
    setFilters,
    getFilterStats
  };
};