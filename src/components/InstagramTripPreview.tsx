import React from "react";
import { formatDate } from "@/utils/dateHelpers";
import { MapPin, Calendar, Send } from "lucide-react";
import favoronLogo from "@/assets/favoron-logo.png";

interface InstagramTripPreviewProps {
  trips: any[];
  searchTerm: string;
  forCapture?: boolean;
}

export const InstagramTripPreview = ({ trips, searchTerm, forCapture = false }: InstagramTripPreviewProps) => {
  const filteredTrips = trips.filter(trip => 
    trip.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCalendarDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
      year: date.getFullYear()
    };
  };

  const firstPageTrips = filteredTrips.slice(0, 8);
  const secondPageTrips = filteredTrips.slice(8);
  const hasSecondPage = secondPageTrips.length > 0;

  const renderTripPage = (trips: any[], pageNumber: number) => (
    <div 
      className={`relative overflow-hidden ${
        forCapture 
          ? 'w-[1080px] h-[1080px]' 
          : 'w-full aspect-square'
      }`}
      style={forCapture ? { 
        width: '1080px', 
        height: '1080px',
        background: '#1a1a2e'
      } : {
        background: 'hsl(240 30% 10%)'
      }}
    >
      {/* Header - Airport Style */}
      <header className="relative z-20 border-b-4 border-amber-500 bg-black/40 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={favoronLogo} 
                alt="Favoron Logo" 
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-amber-400 tracking-widest" style={{ fontFamily: 'monospace' }}>
                  PRÓXIMOS VIAJES
                </h1>
                <p className="text-sm text-gray-400 tracking-wider mt-1" style={{ fontFamily: 'monospace' }}>
                  {pageNumber > 1 ? `PÁGINA ${pageNumber}` : new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-gray-400 tracking-wider" style={{ fontFamily: 'monospace' }}>
                HORA LOCAL
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Departure Board Header */}
      <div className="relative z-10 px-8 pt-6 pb-3">
        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-amber-400 tracking-widest border-b border-gray-700 pb-2" style={{ fontFamily: 'monospace' }}>
          <div className="col-span-2">FECHA</div>
          <div className="col-span-4">ORIGEN</div>
          <div className="col-span-1 text-center">→</div>
          <div className="col-span-4">DESTINO</div>
          <div className="col-span-1 text-center">✓</div>
        </div>
      </div>

      {/* Trips Board */}
      <main className="relative z-10 px-8 pb-8 space-y-2">
        {trips.map((trip, index) => {
          const dateInfo = formatCalendarDate(trip.arrival_date);
          return (
            <article
              key={trip.id}
              className="grid grid-cols-12 gap-2 items-center bg-gray-900/50 backdrop-blur-sm border border-gray-700 hover:border-amber-500/50 transition-all duration-300 py-3 px-4 rounded"
              style={{
                animation: `flipIn 0.6s ease-out ${index * 0.1}s both`,
                fontFamily: 'monospace'
              }}
            >
              {/* Date */}
              <div className="col-span-2">
                <div className="text-white font-bold text-lg">
                  {dateInfo.day} {dateInfo.month}
                </div>
                <div className="text-gray-400 text-xs">
                  {dateInfo.year}
                </div>
              </div>

              {/* Origin */}
              <div className="col-span-4">
                <div className="text-white font-bold text-base tracking-wide">
                  {trip.from_city === "Guatemala City" ? "CIUDAD DE GUATEMALA" : trip.from_city.toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  ORIGEN
                </div>
              </div>

              {/* Arrow */}
              <div className="col-span-1 text-center">
                <Send className="w-5 h-5 text-amber-400 mx-auto rotate-45" />
              </div>

              {/* Destination */}
              <div className="col-span-4">
                <div className="text-white font-bold text-base tracking-wide">
                  {trip.to_city === "Guatemala City" ? "CIUDAD DE GUATEMALA" : trip.to_city.toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  DESTINO
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
              </div>
            </article>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 border-t-4 border-amber-500 bg-black/40 backdrop-blur-sm">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="text-amber-400 font-bold text-xl tracking-widest" style={{ fontFamily: 'monospace' }}>
            WWW.FAVORON.APP
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400 text-sm" style={{ fontFamily: 'monospace' }}>EN LÍNEA</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes flipIn {
          from {
            opacity: 0;
            transform: rotateX(-90deg);
          }
          to {
            opacity: 1;
            transform: rotateX(0);
          }
        }
      `}</style>
    </div>
  );

  return (
    <div className="flex flex-col space-y-8">
      {renderTripPage(firstPageTrips, 1)}
      {hasSecondPage && renderTripPage(secondPageTrips, 2)}
    </div>
  );
};