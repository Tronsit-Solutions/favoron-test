import { forwardRef, useState } from "react";
import { InstagramPostHeader } from "./InstagramPostHeader";
import { InstagramTripCard } from "./InstagramTripCard";
import { InstagramPostDecorations } from "./InstagramPostDecorations";

interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
}

interface InstagramPostGeneratorProps {
  trips: Trip[];
  pageNumber: number;
  totalPages: number;
  onTripsUpdate?: (updatedTrips: Trip[]) => void;
}

export const InstagramPostGenerator = forwardRef<HTMLDivElement, InstagramPostGeneratorProps>(
  ({ trips, pageNumber, totalPages, onTripsUpdate }, ref) => {
    const [editableTrips, setEditableTrips] = useState(trips);

    const handleTripUpdate = (updatedTrip: Trip) => {
      const newTrips = editableTrips.map(trip => 
        trip.id === updatedTrip.id ? updatedTrip : trip
      );
      setEditableTrips(newTrips);
      if (onTripsUpdate) {
        onTripsUpdate(newTrips);
      }
    };

    return (
      <div 
        ref={ref}
        className="w-[1080px] h-[1080px] bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-500 flex flex-col relative overflow-hidden border-8 border-white"
        style={{ 
          fontSize: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          width: '1080px',
          height: '1080px'
        }}
      >
        <InstagramPostHeader pageNumber={pageNumber} totalPages={totalPages} />

        {/* Trips List */}
        <div className="flex-1 px-12 py-6 space-y-4">
          {editableTrips.map((trip) => (
            <InstagramTripCard 
              key={trip.id} 
              trip={trip} 
              onTripUpdate={handleTripUpdate}
            />
          ))}
        </div>

        <InstagramPostDecorations />
      </div>
    );
  }
);