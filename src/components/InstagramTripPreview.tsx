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
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden font-bricolage">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50"></div>

      {/* Header Section */}
      <header className="relative z-10 text-center pt-6 pb-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight pt-4">
          Hub de viajes
        </h1>
        <div className="w-20 h-0.5 bg-cyan-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-medium text-gray-700">
          Favoron
        </h2>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-16">
        <section className="bg-transparent rounded-2xl p-8">

          {/* Trips List */}
          <div className="space-y-3 max-h-[750px] overflow-hidden">
            {filteredTrips.slice(0, 12).map((trip, index) => (
              <article
                key={trip.id}
                className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Route Information */}
                <div className="flex items-center gap-6 flex-1">
                  <span className="text-lg font-semibold text-gray-800 min-w-[120px]">
                    {trip.from_city}
                  </span>
                  <span className="text-cyan-500 font-bold text-xl">→</span>
                  <span className="text-lg font-semibold text-gray-800 min-w-[120px]">
                    {trip.to_city}
                  </span>
                </div>
                
                {/* Date Badge */}
                <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-md border">
                  {formatInstagramDate(trip.arrival_date)}
                </div>
              </article>
            ))}
            
            {filteredTrips.length > 12 && (
              <div className="text-center py-4 text-gray-500 font-medium">
                +{filteredTrips.length - 12} viajes más
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 left-0 right-0 z-10">
        <div className="text-center">
          <p className="text-gray-600 font-medium text-lg mb-2">
            Conectando viajeros con shoppers
          </p>
          <p className="text-gray-500 text-sm">
            www.favoron.app
          </p>
        </div>
      </footer>
    </div>
  );
};