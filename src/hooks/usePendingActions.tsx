import { useMemo } from "react";

export const usePendingActions = (packages: any[], trips: any[], currentUser: any) => {
  const pendingActions = useMemo(() => {
    if (!currentUser) return {};

    // For shoppers
    const shopperPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
    const quotesToAccept = shopperPackages.filter(pkg => pkg.status === 'quote_sent').length;
    const paymentsToMake = shopperPackages.filter(pkg => pkg.status === 'quote_accepted').length;
    const uploadsNeeded = shopperPackages.filter(pkg => 
      pkg.status === 'payment_confirmed' && !pkg.purchase_confirmation
    ).length;

    // For travelers
    const travelerTrips = trips.filter(trip => trip.user_id === currentUser.id);
    const matchedPackages = packages.filter(pkg => 
      travelerTrips.some(trip => trip.id === pkg.matched_trip_id)
    );
    const quotesToSend = matchedPackages.filter(pkg => pkg.status === 'matched').length;
    const packagesToReceive = matchedPackages.filter(pkg => pkg.status === 'in_transit').length;

    // For admin
    const paymentsToConfirm = packages.filter(pkg => pkg.status === 'payment_pending_approval').length;
    const packageApprovalsNeeded = packages.filter(pkg => pkg.status === 'pending_approval').length;
    const tripApprovalsNeeded = trips.filter(trip => trip.status === 'pending_approval').length;
    const approvalsNeeded = packageApprovalsNeeded + tripApprovalsNeeded;
    const unmatchedPackages = packages.filter(pkg => pkg.status === 'approved').length;
    const rejectedByTravelers = packages.filter(pkg => pkg.status === 'quote_rejected').length;
    
    // Count pending traveler payments - packages that are delivered_to_office but not yet paid to traveler
    const pendingTravelerPayments = packages.filter(pkg => 
      pkg.status === 'delivered_to_office' && pkg.matched_trip_id
    ).length;
    
    console.log('🔔 usePendingActions Debug - Admin totals:', {
      paymentsToConfirm,
      packageApprovalsNeeded,
      tripApprovalsNeeded,
      approvalsNeeded,
      unmatchedPackages,
      rejectedByTravelers,
      adminTotal: paymentsToConfirm + approvalsNeeded + unmatchedPackages + rejectedByTravelers
    });

    return {
      // Shopper actions
      quotesToAccept,
      paymentsToMake,
      uploadsNeeded,
      
      // Traveler actions
      quotesToSend,
      packagesToReceive,
      
      // Admin actions
      paymentsToConfirm,
      approvalsNeeded,
      packageApprovalsNeeded,
      tripApprovalsNeeded,
      unmatchedPackages,
      rejectedByTravelers,
      pendingTravelerPayments,
      
      // Totals
      shopperTotal: quotesToAccept + paymentsToMake + uploadsNeeded,
      travelerTotal: quotesToSend + packagesToReceive,
      adminTotal: paymentsToConfirm + approvalsNeeded + unmatchedPackages + rejectedByTravelers
    };
  }, [packages, trips, currentUser]);

  return pendingActions;
};