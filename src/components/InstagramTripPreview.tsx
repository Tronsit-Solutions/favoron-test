import React from "react";
import { formatDate } from "@/utils/dateHelpers";
import { MapPin, Calendar, Send } from "lucide-react";

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
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-16">
        <section className="bg-transparent rounded-2xl p-8">
          {/* Column Headers with Icons */}
          <div className="grid grid-cols-3 gap-4 py-3 px-6 mb-4">
            <div className="flex items-center justify-center gap-2">
              <MapPin size={20} className="text-gray-700" />
              <span className="text-lg font-bold text-gray-800">Origen</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin size={20} className="text-gray-700" />
              <span className="text-lg font-bold text-gray-800">Destino</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar size={20} className="text-gray-700" />
              <span className="text-lg font-bold text-gray-800">Fecha</span>
            </div>
          </div>

          {/* Trips List */}
          <div className="space-y-3 max-h-[750px] overflow-hidden">
            {filteredTrips.slice(0, 12).map((trip, index) => (
              <article
                key={trip.id}
                className="grid grid-cols-3 gap-4 py-4 px-6 bg-gray-50 rounded-lg border border-gray-200"
              >
                {/* Origin Column */}
                <div className="text-lg font-semibold text-gray-800 text-center">
                  {trip.from_city}
                </div>
                
                {/* Destination Column */}
                <div className="text-lg font-semibold text-gray-800 text-center">
                  {trip.to_city}
                </div>
                
                {/* Date Column */}
                <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-md border text-center">
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
          <p className="text-gray-500 text-sm">
            www.favoron.app
          </p>
        </div>
      </footer>
    </div>
  );
};