import { useState, useMemo } from "react";

export const useMatchFilters = (packages: any[], trips: any[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const matchedPackages = useMemo(() => 
    packages.filter(pkg => {
      // Must have a matched trip
      if (!pkg.matched_trip_id) return false;
      
      // Exclude expired quotes (by status or by time)
      const now = Date.now();
      const quoteExpiredByTime = pkg.status === 'quote_sent' && pkg.quote_expires_at && (new Date(pkg.quote_expires_at).getTime() < now);
      const assignmentExpiredByTime = pkg.status === 'matched' && pkg.matched_assignment_expires_at && (new Date(pkg.matched_assignment_expires_at).getTime() < now);
      
      // Advanced statuses that should not be filtered out even if quote is expired
      const advancedStatuses = ['completed', 'delivered_to_office', 'received_by_traveler', 'in_transit', 'pending_office_confirmation', 'payment_pending_approval', 'payment_confirmed', 'pending_purchase'];
      const isAdvancedStatus = advancedStatuses.includes(pkg.status);
      
      // Packages with payment receipt should not be filtered by quote expiration
      const hasPaymentReceipt = pkg.payment_receipt;
      
      // General quote expiration check for packages that haven't advanced past the quote stage
      const generalQuoteExpired = !isAdvancedStatus && !hasPaymentReceipt && pkg.quote_expires_at && (new Date(pkg.quote_expires_at).getTime() < now);
      
      if (pkg.status === 'quote_expired' || quoteExpiredByTime || assignmentExpiredByTime || generalQuoteExpired) return false;
      
      return true;
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