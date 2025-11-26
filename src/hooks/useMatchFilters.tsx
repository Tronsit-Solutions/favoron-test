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
      
      const matchesSearch = 
        (pkg.item_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.user_id || '').toString().includes(searchTerm) ||
        (pkg.profiles?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.profiles?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (matchedTrip?.from_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (matchedTrip?.to_city || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [matchedPackages, trips, searchTerm, statusFilter]);

  const statsData = useMemo(() => ({
    completed: matchedPackages.filter(p => p.status === 'completed').length,
    inProgress: matchedPackages.filter(p => ['payment_pending', 'in_transit'].includes(p.status)).length,
    broken: matchedPackages.filter(p => ['rejected', 'quote_rejected'].includes(p.status)).length
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