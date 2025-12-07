import { useState, useMemo } from "react";

export const useMatchFilters = (packages: any[], trips: any[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const matchedPackages = useMemo(() => 
    packages.filter(pkg => {
      // Include ALL packages with a matched trip, regardless of expiration or status
      return pkg.matched_trip_id !== null && pkg.matched_trip_id !== undefined;
    }), 
    [packages]
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
    completed: matchedPackages.filter(p => p.status === 'completed').length,
    inProgress: matchedPackages.filter(p => ['payment_pending', 'in_transit', 'matched', 'quote_sent', 'payment_pending_approval', 'pending_purchase', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'].includes(p.status)).length,
    broken: matchedPackages.filter(p => ['rejected', 'quote_rejected', 'cancelled', 'quote_expired'].includes(p.status)).length
  }), [matchedPackages]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    matchedPackages,
    statuses,
    filteredMatches,
    statsData
  };
};