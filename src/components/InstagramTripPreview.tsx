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
        background: '#1a2332'
      } : {
        background: 'hsl(215 30% 15%)'
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
      <header className="relative z-20 border-b-4 border-white/30 bg-white/10 backdrop-blur-md">
        <div className="px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src={favoronLogo} 
                alt="Favoron Logo" 
                className="w-8 h-8 object-contain drop-shadow-xl"
              />
              <div>
                <h1 className="text-xl font-bold text-white tracking-widest drop-shadow-lg" style={{ fontFamily: 'monospace' }}>
                  PRÓXIMOS VIAJES
                </h1>
                <p className="text-[10px] text-white/80 tracking-wider" style={{ fontFamily: 'monospace' }}>
                  {pageNumber > 1 ? `PÁGINA ${pageNumber}` : new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'monospace' }}>
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[9px] text-white/70 tracking-wider" style={{ fontFamily: 'monospace' }}>
                HORA LOCAL
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Departure Board Header */}
      <div className="relative z-10 px-8 pt-2 pb-1">
        <div className="grid grid-cols-11 gap-2 text-[9px] font-bold text-white/90 tracking-widest border-b-2 border-white/30 pb-0.5" style={{ fontFamily: 'monospace' }}>
          <div className="col-span-2">FECHA</div>
          <div className="col-span-4">ORIGEN</div>
          <div className="col-span-1 text-center">→</div>
          <div className="col-span-4">DESTINO</div>
        </div>
      </div>

      {/* Trips Board */}
      <main className="relative z-10 px-8 pb-2 space-y-1">
        {trips.map((trip, index) => {
          const dateInfo = formatCalendarDate(trip.arrival_date);
          return (
            <article
              key={trip.id}
              className="grid grid-cols-11 gap-2 items-center bg-white/95 backdrop-blur-sm border-2 border-white/50 hover:border-white hover:shadow-2xl transition-all duration-300 py-1 px-2.5 rounded-lg"
              style={{
                animation: `flipIn 0.6s ease-out ${index * 0.1}s both`,
                fontFamily: 'monospace'
              }}
            >
              {/* Date */}
              <div className="col-span-2">
                <div className="text-primary font-bold text-xs leading-tight">
                  {dateInfo.day} {dateInfo.month}
                </div>
                <div className="text-foreground/60 text-[9px]">
                  {dateInfo.year}
                </div>
              </div>

              {/* Origin */}
              <div className="col-span-4">
                <div className="text-foreground font-bold text-[11px] tracking-wide leading-tight">
                  {trip.from_city === "Guatemala City" ? "GUATEMALA" : trip.from_city.toUpperCase()}
                </div>
              </div>

              {/* Arrow */}
              <div className="col-span-1 text-center">
                <Send className="w-3.5 h-3.5 text-accent mx-auto rotate-45" />
              </div>

              {/* Destination */}
              <div className="col-span-4">
                <div className="text-foreground font-bold text-[11px] tracking-wide leading-tight">
                  {trip.to_city === "Guatemala City" ? "GUATEMALA" : trip.to_city.toUpperCase()}
                </div>
                <div className="text-foreground/60 text-[9px] mt-0.5">
                  DESTINO
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
      {renderTripPage(firstPageTrips, 1)}
      {hasSecondPage && renderTripPage(secondPageTrips, 2)}
    </div>
  );
};