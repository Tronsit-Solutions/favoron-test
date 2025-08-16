import { useState } from "react";
import { TripFilters } from "./TripFilters";
import { TripStatsHeader } from "./TripStatsHeader";
import { TripCard } from "./TripCard";
import { EmptyTripsState } from "./EmptyTripsState";

interface AvailableTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
}

const AvailableTripsTab = ({ trips, onViewTripDetail }: AvailableTripsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState("all");

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
      (trip.user_id || '').toString().includes(searchTerm);
    
    const matchesOrigin = originFilter === "all" || trip.from_city === originFilter;
    
    return matchesSearch && matchesOrigin;
  }).sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime());

  const approvedCount = filteredTrips.filter(t => t.status === 'approved').length;
  const activeCount = filteredTrips.filter(t => t.status === 'active').length;
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
          filteredTrips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              onViewTripDetail={onViewTripDetail}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableTripsTab;