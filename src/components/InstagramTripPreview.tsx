import React from "react";
import { formatDate } from "@/utils/dateHelpers";

interface InstagramTripPreviewProps {
  trips: any[];
  searchTerm: string;
}

export const InstagramTripPreview = ({ trips, searchTerm }: InstagramTripPreviewProps) => {
  const filteredTrips = trips.filter(trip => 
    trip.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatInstagramDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden font-bricolage">
      {/* Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50"></div>

      {/* Header */}
      <div className="relative z-10 text-center pt-12 pb-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          Favoron
        </h1>
        <div className="w-20 h-0.5 bg-cyan-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-medium text-gray-700">
          Hub de Viajes
        </h2>
      </div>

      {/* Trips List */}
      <div className="relative z-10 px-16">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Viajes Disponibles
            </h3>
            <p className="text-sm text-gray-500">
              {filteredTrips.length} destinos activos
            </p>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-hidden">
            {filteredTrips.slice(0, 12).map((trip, index) => (
              <div
                key={trip.id}
                className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Route */}
                <div className="flex items-center gap-6 flex-1">
                  <div className="text-lg font-semibold text-gray-800 min-w-[120px]">
                    {trip.from_city}
                  </div>
                  <div className="text-cyan-500 font-bold text-xl">→</div>
                  <div className="text-lg font-semibold text-gray-800 min-w-[120px]">
                    {trip.to_city}
                  </div>
                </div>
                
                {/* Date */}
                <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-md border">
                  {formatInstagramDate(trip.arrival_date)}
                </div>
              </div>
            ))}
            
            {filteredTrips.length > 12 && (
              <div className="text-center py-4 text-gray-500 font-medium">
                +{filteredTrips.length - 12} viajes más
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 z-10">
        <div className="text-center">
          <p className="text-gray-600 font-medium text-lg mb-2">
            Conectando viajeros con shoppers
          </p>
          <p className="text-gray-500 text-sm">
            www.favoron.app
          </p>
        </div>
      </div>
    </div>
  );
};