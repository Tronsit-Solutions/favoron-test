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

  const TRIPS_PER_PAGE = 10;
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
        background: '#1E88E5'
      } : {
        background: '#1E88E5'
      }}
    >
      {/* Header - LED Airport Style */}
      <header className="relative z-20" style={{ background: '#000000' }}>
        <div className="px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={favoronLogo} 
                alt="Favoron Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 
                  className="text-2xl font-bold tracking-[0.4em] leading-none"
                  style={{ 
                    fontFamily: "'Courier New', monospace",
                    color: '#FF8C00',
                    textShadow: '0 0 10px #FF8C00, 0 0 20px #FF8C00',
                    fontVariantNumeric: 'tabular-nums',
                    fontStretch: 'condensed',
                    fontWeight: 700
                  }}
                >
                  PRÓXIMOS VIAJES
                </h1>
                {pageNumber > 1 && (
                  <p 
                    className="text-xs tracking-[0.3em] font-bold leading-none mt-1"
                    style={{ 
                      fontFamily: "'Courier New', monospace",
                      color: '#FF8C00',
                      textShadow: '0 0 8px #FF8C00',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    PÁGINA {pageNumber}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-xl font-bold tracking-[0.3em] leading-none"
                style={{ 
                  fontFamily: "'Courier New', monospace",
                  color: '#FF8C00',
                  textShadow: '0 0 10px #FF8C00, 0 0 20px #FF8C00',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700
                }}
              >
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div 
                className="text-xs tracking-[0.25em] font-bold leading-none mt-1"
                style={{ 
                  fontFamily: "'Courier New', monospace",
                  color: '#FF8C00',
                  textShadow: '0 0 8px #FF8C00',
                  fontVariantNumeric: 'tabular-nums'
                }}
              >
                HORA LOCAL
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Departure Board Header */}
      <div className="relative z-10 px-8 pt-4 pb-2 border-b border-gray-700">
        <div 
          className="grid grid-cols-12 gap-3 text-xs font-bold tracking-[0.25em] leading-none pb-2"
          style={{ 
            fontFamily: "'Courier New', monospace",
            color: '#CCCCCC',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600
          }}
        >
          <div className="col-span-2">DEP. ↓</div>
          <div className="col-span-5">TO</div>
          <div className="col-span-5">FLIGHT NO.</div>
        </div>
      </div>

      {/* Trips Board */}
      <main className="relative z-10 px-8 pb-3 space-y-0.5">
        {trips.map((trip, index) => {
          const dateInfo = formatCalendarDate(trip.arrival_date);
          const flightNumber = `FR${String(index + 1001).slice(-4)}`;
          return (
            <article
              key={trip.id}
              className="grid grid-cols-12 gap-3 items-center py-2.5 px-4 border-b border-gray-800/50"
              style={{
                animation: `flipIn 0.6s ease-out ${index * 0.1}s both`,
                fontFamily: "'Courier New', monospace"
              }}
            >
              {/* Time + Date */}
              <div className="col-span-2">
                <div 
                  className="font-bold text-lg leading-tight tracking-[0.15em]"
                  style={{
                    color: '#FFA500',
                    textShadow: '0 0 8px #FFA500',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {dateInfo.day}/{dateInfo.month}
                </div>
              </div>

              {/* Route: Origin -> Destination */}
              <div className="col-span-5">
                <div 
                  className="font-bold text-base tracking-[0.2em] leading-tight uppercase"
                  style={{
                    color: '#FFA500',
                    textShadow: '0 0 8px #FFA500',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {trip.from_city === "Guatemala City" ? "GUATEMALA" : trip.from_city.replace(" City", "").toUpperCase()}
                  <span className="mx-1" style={{ color: '#666' }}>→</span>
                  {trip.to_city === "Guatemala City" ? "GUATEMALA" : trip.to_city.replace(" City", "").toUpperCase()}
                </div>
              </div>

              {/* Flight Number */}
              <div className="col-span-5">
                <div 
                  className="font-bold text-lg tracking-[0.3em] leading-tight"
                  style={{
                    color: '#00BFFF',
                    textShadow: '0 0 8px #00BFFF',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {flightNumber}
                </div>
              </div>
            </article>
          );
        })}
      </main>

      <style>{`
        @keyframes flipIn {
          from {
            transform: rotateX(-90deg);
          }
          to {
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