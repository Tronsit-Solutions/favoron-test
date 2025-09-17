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
    <div className="w-[1080px] h-[1080px] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 relative overflow-hidden font-bricolage">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/20 rounded-full translate-y-20 -translate-x-20"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-16 pb-8">
        <div className="mb-6">
          <h1 className="text-7xl font-bold text-white mb-4 tracking-tight">
            🌍 Favoron
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-300 to-white mx-auto rounded-full"></div>
        </div>
        <h2 className="text-4xl font-semibold text-white/95 mb-2">
          Hub de Viajes
        </h2>
        <p className="text-xl text-white/80 font-medium">
          Conectando viajeros con shoppers
        </p>
      </div>

      {/* Trips Grid */}
      <div className="relative z-10 px-12">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-2">
              Viajes Disponibles
            </h3>
            <p className="text-lg text-gray-600 font-medium">
              {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''} esperando por ti
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-hidden">
            {filteredTrips.slice(0, 6).map((trip, index) => (
              <div
                key={trip.id}
                className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border-l-4 border-cyan-400 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  {/* Route */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                      <span className="text-3xl">🛫</span>
                      <span className="text-cyan-600">{trip.from_city}</span>
                      <span className="text-blue-500 text-3xl">→</span>
                      <span className="text-blue-600">{trip.to_city}</span>
                      <span className="text-3xl">🛬</span>
                    </div>
                  </div>
                  
                  {/* Date Badge */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                    📅 {formatInstagramDate(trip.arrival_date)}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTrips.length > 6 && (
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 text-center border-2 border-dashed border-indigo-300">
                <p className="text-2xl font-bold text-indigo-600">
                  +{filteredTrips.length - 6} viajes más disponibles
                </p>
                <p className="text-lg text-indigo-500 font-medium mt-2">
                  ¡Únete a Favoron para ver todos!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/20 to-transparent pt-8 pb-6">
        <div className="text-center">
          <p className="text-white font-bold text-2xl mb-2">
            💼 Shopper • 🧳 Viajero • 🤝 Conexión
          </p>
          <p className="text-white/90 text-lg font-medium">
            Tu plataforma de confianza para envíos internacionales
          </p>
          <div className="mt-4">
            <p className="text-white/80 text-base font-medium">
              🌐 www.favoron.app
            </p>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 z-5">
        <div className="w-20 h-20 bg-cyan-300/30 rounded-full animate-pulse"></div>
      </div>
      <div className="absolute bottom-32 right-32 z-5">
        <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      <div className="absolute top-1/3 left-12 z-5">
        <div className="w-12 h-12 bg-blue-300/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
};