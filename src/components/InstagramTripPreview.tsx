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

  const TRIPS_PER_PAGE = 8;
  const pages = [];
  for (let i = 0; i < filteredTrips.length; i += TRIPS_PER_PAGE) {
    pages.push(filteredTrips.slice(i, i + TRIPS_PER_PAGE));
  }

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
        background: '#0B1426'
      } : {
        background: '#0B1426'
      }}
    >
      {/* Overlay Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Header - Airport Style with Favoron Colors */}
      <header className="relative z-20 border-b-4 border-cyan-400/40 bg-white/5 backdrop-blur-md">
        <div className="px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={favoronLogo} 
                alt="Favoron Logo" 
                className="w-10 h-10 object-contain drop-shadow-xl"
              />
              <div>
                <h1 className="text-3xl font-bold text-white tracking-[0.3em] drop-shadow-lg" style={{ fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace" }}>
                  PRÓXIMOS VIAJES
                </h1>
                <p className="text-xs text-cyan-300 tracking-[0.2em] font-semibold" style={{ fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace" }}>
                  {pageNumber > 1 ? `PÁGINA ${pageNumber}` : new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white drop-shadow-lg tracking-wider" style={{ fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace" }}>
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-cyan-300 tracking-[0.15em] font-semibold" style={{ fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace" }}>
                HORA LOCAL
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Departure Board Header */}
      <div className="relative z-10 px-8 pt-3 pb-2">
        <div className="grid grid-cols-10 gap-2 text-sm font-bold text-white tracking-[0.25em] border-b-2 border-cyan-400/50 pb-1" style={{ fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace" }}>
          <div className="col-span-2">FECHA</div>
          <div className="col-span-4">ORIGEN</div>
          <div className="col-span-4">DESTINO</div>
        </div>
      </div>

      {/* Trips Board */}
      <main className="relative z-10 px-8 pb-3 space-y-2">
        {trips.map((trip, index) => {
          const dateInfo = formatCalendarDate(trip.arrival_date);
          return (
            <article
              key={trip.id}
              className="grid grid-cols-10 gap-3 items-center bg-slate-800/80 backdrop-blur-sm border-2 border-cyan-400/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 py-3 px-4 rounded-lg"
              style={{
                animation: `flipIn 0.6s ease-out ${index * 0.1}s both`,
                fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace"
              }}
            >
              {/* Date */}
              <div className="col-span-2">
                <div className="bg-cyan-400 text-slate-900 font-bold text-base leading-tight px-2 py-1 rounded tracking-wider">
                  {dateInfo.day} {dateInfo.month}
                </div>
              </div>

              {/* Origin */}
              <div className="col-span-4">
                <div className="text-white font-bold text-base tracking-[0.15em] leading-tight">
                  {trip.from_city === "Guatemala City" ? "GUATEMALA" : trip.from_city.toUpperCase()}
                </div>
              </div>

              {/* Destination */}
              <div className="col-span-4">
                <div className="text-white font-bold text-base tracking-[0.15em] leading-tight">
                  {trip.to_city === "Guatemala City" ? "GUATEMALA" : trip.to_city.toUpperCase()}
                </div>
              </div>
            </article>
          );
        })}
      </main>

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
      {pages.map((pageTrips, index) => renderTripPage(pageTrips, index + 1))}
    </div>
  );
};