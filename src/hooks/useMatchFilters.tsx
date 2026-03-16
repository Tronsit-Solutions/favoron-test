import { useState, useMemo } from "react";

// Statuses considered "broken" - these get deprioritized
const BROKEN_STATUSES = ['rejected', 'quote_rejected', 'cancelled', 'quote_expired'];

export const useMatchFilters = (packages: any[], trips: any[], multiAssignedPackageIds?: Set<string>) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Separate active matches from broken matches
  const { activeMatches, brokenMatches } = useMemo(() => {
    const active: any[] = [];
    const broken: any[] = [];
    
    packages.forEach(pkg => {
      const hasMatch = pkg.matched_trip_id !== null && pkg.matched_trip_id !== undefined;
      const isMultiAssigned = multiAssignedPackageIds?.has(pkg.id) ?? false;
      
      if (hasMatch || isMultiAssigned) {
        if (BROKEN_STATUSES.includes(pkg.status)) {
          broken.push(pkg);
        } else {
          active.push(pkg);
        }
      }
    });
    
    return { activeMatches: active, brokenMatches: broken };
  }, [packages, multiAssignedPackageIds]);

  // Combined matched packages (active first, then broken when loaded)
  const matchedPackages = useMemo(() => 
    [...activeMatches], 
    [activeMatches]
  );

  const statuses = useMemo(() => 
    [...new Set(matchedPackages.map(pkg => pkg.status))], 
    [matchedPackages]
  );
  
  const filteredMatches = useMemo(() => {
    return matchedPackages.filter(pkg => {
      const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
      const search = searchTerm.toLowerCase().trim();
      
      // Combine first and last names for full name search
      const shopperFullName = `${pkg.profiles?.first_name || ''} ${pkg.profiles?.last_name || ''}`.toLowerCase();
      const travelerFullName = `${matchedTrip?.profiles?.first_name || ''} ${matchedTrip?.profiles?.last_name || ''}`.toLowerCase();
      
      const matchesSearch = 
        (pkg.item_description || '').toLowerCase().includes(search) ||
        (pkg.user_id || '').toString().includes(search) ||
        shopperFullName.includes(search) ||
        travelerFullName.includes(search) ||
        (matchedTrip?.from_city || '').toLowerCase().includes(search) ||
        (matchedTrip?.to_city || '').toLowerCase().includes(search);
      
      const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [matchedPackages, trips, searchTerm, statusFilter]);

  const statsData = useMemo(() => ({
    completed: activeMatches.filter(p => p.status === 'completed').length,
    inProgress: activeMatches.filter(p => ['payment_pending', 'in_transit', 'matched', 'quote_sent', 'payment_pending_approval', 'pending_purchase', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'].includes(p.status)).length,
    broken: brokenMatches.length
  }), [activeMatches, brokenMatches]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    matchedPackages,
    activeMatches,
    brokenMatches,
    brokenMatchesCount: brokenMatches.length,
    statuses,
    filteredMatches,
    statsData
  };
};