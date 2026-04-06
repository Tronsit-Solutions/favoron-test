import { useState, useMemo } from "react";
import { TripFilters } from "./TripFilters";
import { TripStatsHeader } from "./TripStatsHeader";
import { TripCard } from "./TripCard";
import { EmptyTripsState } from "./EmptyTripsState";
import { useTripAssignmentStats } from "@/hooks/useTripAssignmentStats";

interface AvailableTripsTabProps {
  trips: any[];
  packages: any[];
  onViewTripDetail: (trip: any) => void;
}

const AvailableTripsTab = ({ trips, packages, onViewTripDetail }: AvailableTripsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState("all");

  // Function to calculate total value of packages for a specific trip
  const calculateTripPackagesTotal = (tripId: string) => {
    // Include all statuses from quote_sent onwards, excluding quote_expired and quote_rejected
    const validStatuses = ['quote_sent', 'payment_pending', 'paid', 'pending_purchase', 'in_transit', 'delivered_to_office', 'received_by_traveler', 'completed'];
    
    const tripPackages = packages.filter(pkg => 
      pkg.matched_trip_id === tripId && 
      validStatuses.includes(pkg.status)
    );

    return tripPackages.reduce((total, pkg) => {
      if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
        // Sum all products: quantity * estimatedPrice
        const productsTotal = pkg.products_data.reduce((productSum, product) => {
          const price = parseFloat(product.estimatedPrice || '0');
          const quantity = parseInt(product.quantity || '1');
          return productSum + (price * quantity);
        }, 0);
        return total + productsTotal;
      } else {
        // Fallback to estimated_price
        return total + parseFloat(pkg.estimated_price || '0');
      }
    }, 0);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  
  const availableTrips = trips.filter(trip => {
    const isValidStatus = ['approved', 'active'].includes(trip.status);
    const isNotExpired = new Date(trip.arrival_date) >= today;
    return isValidStatus && isNotExpired;
  });
  
  // Get unique origins for filter
  const origins = [...new Set(availableTrips.map(trip => trip.from_city))];

  // Filter trips based on search and filters
  const filteredTrips = availableTrips.filter(trip => {
    const matchesSearch = 
      (trip.from_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.to_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.user_id || '').toString().includes(searchTerm) ||
      // Búsqueda por nombres del viajero
      ((trip as any)?.profiles?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((trip as any)?.profiles?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((trip as any)?.profiles?.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrigin = originFilter === "all" || trip.from_city === originFilter;
    
    return matchesSearch && matchesOrigin;
  }).sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());

  const tripInputs = useMemo(() => 
    filteredTrips.map(t => ({ tripId: t.id, userId: t.user_id })),
    [filteredTrips]
  );
  const statsMap = useTripAssignmentStats(tripInputs);

  const approvedCount = filteredTrips.filter(t => t.status === 'approved').length;
  const activeCount = filteredTrips.filter(t => {
    const hasMatchedPackages = packages.some(p => p.matched_trip_id === t.id);
    return t.status === 'approved' && hasMatchedPackages;
  }).length;
  const hasFilters = searchTerm !== "" || originFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <TripStatsHeader
        filteredTripsCount={filteredTrips.length}
        approvedCount={approvedCount}
        activeCount={activeCount}
      />

      {/* Search and Filters */}
      <TripFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        originFilter={originFilter}
        onOriginChange={setOriginFilter}
        origins={origins}
      />

      {/* Trips List */}
      <div className="space-y-3">
        {filteredTrips.length === 0 ? (
          <EmptyTripsState hasFilters={hasFilters} />
        ) : (
          filteredTrips.map(trip => {
            const tripStats = statsMap[trip.id];
            return (
              <TripCard
                key={trip.id}
                trip={trip}
                packagesTotal={calculateTripPackagesTotal(trip.id)}
                onViewTripDetail={onViewTripDetail}
                hasBoost={Boolean(trip.boost_code)}
                assignmentStats={tripStats?.assignments}
                travelerHistory={tripStats?.travelerHistory}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default AvailableTripsTab;