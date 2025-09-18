import React from 'react';

interface InstagramCaptureSimplifiedProps {
  trips: any[];
  searchTerm: string;
}

export const InstagramCaptureSimplified: React.FC<InstagramCaptureSimplifiedProps> = ({ 
  trips, 
  searchTerm 
}) => {
  // Filter trips based on search term
  const filteredTrips = trips.filter(trip => 
    trip.origin_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destination_city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for Instagram
  const formatInstagramDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    });
  };

  // Split trips into pages
  const tripsPerPage = 6;
  const firstPageTrips = filteredTrips.slice(0, tripsPerPage);
  const secondPageTrips = filteredTrips.slice(tripsPerPage, tripsPerPage * 2);

  const renderTripPage = (pageTrips: any[], pageNumber: number) => {
    return (
      <div 
        key={pageNumber}
        className="w-full h-full flex flex-col"
        style={{
          width: '700px',
          height: '700px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header */}
        <div className="px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              F
            </div>
            <h1 className="text-2xl font-bold text-white">
              Favoron
            </h1>
          </div>
          <h2 className="text-lg text-white font-medium">
            Viajes Disponibles {searchTerm && `- ${searchTerm}`}
          </h2>
        </div>

        {/* Trips Grid */}
        <div className="flex-1 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3 h-full">
            {pageTrips.map((trip, index) => (
              <div 
                key={trip.id || index}
                className="p-4 rounded-xl text-white"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div className="space-y-2">
                  <div>
                    <div className="text-xs opacity-80">Origen</div>
                    <div className="font-semibold text-sm">{trip.origin_city}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-80">Destino</div>
                    <div className="font-semibold text-sm">{trip.destination_city}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-80">Llegada</div>
                    <div className="font-medium text-sm">
                      {formatInstagramDate(trip.arrival_date)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center">
          <div className="text-white text-sm opacity-90">
            @favoron_oficial • Conectamos viajeros
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {renderTripPage(firstPageTrips, 1)}
      {secondPageTrips.length > 0 && renderTripPage(secondPageTrips, 2)}
    </div>
  );
};