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
        background: '#000000'
      } : {
        background: '#000000'
      }}
    >
      {/* Header - LED Airport Style */}
      <header className="relative z-20 border-b-2" style={{ borderColor: '#FFFFFF' }}>
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
                    color: '#AAAAAA',
                    textShadow: '0 0 8px #AAAAAA',
                    fontVariantNumeric: 'tabular-nums',
                    fontStretch: 'condensed',
                    fontWeight: 700
                  }}
                >
                  PRÓXIMOS VIAJES
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-xl font-bold tracking-[0.3em] leading-none"
                style={{ 
                  fontFamily: "'Courier New', monospace",
                  color: '#AAAAAA',
                  textShadow: '0 0 8px #AAAAAA',
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
                  color: '#AAAAAA',
                  textShadow: '0 0 6px #AAAAAA',
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
      <div className="relative z-10 px-8 pt-4 pb-2">
        <div 
          className="grid grid-cols-12 gap-3 text-xs font-bold tracking-[0.3em] border-b leading-none pb-2"
          style={{ 
            fontFamily: "'Courier New', monospace",
            color: '#AAAAAA',
            textShadow: '0 0 6px #AAAAAA',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            borderColor: '#555555'
          }}
        >
          <div className="col-span-2">FECHA</div>
          <div className="col-span-5">ORIGEN</div>
          <div className="col-span-5">DESTINO</div>
        </div>
      </div>

      {/* Trips Board */}
      <main className="relative z-10 px-8 pb-3 space-y-0">
        {trips.map((trip, index) => {
          const dateInfo = formatCalendarDate(trip.arrival_date);
          return (
            <article
              key={trip.id}
              className="grid grid-cols-12 gap-3 items-center border-b py-2 px-4"
              style={{
                animation: `flipIn 0.6s ease-out ${index * 0.1}s both`,
                fontFamily: "'Courier New', monospace",
                borderColor: '#222222'
              }}
            >
              {/* Date */}
              <div className="col-span-2">
                <div 
                  className="font-bold text-sm leading-none tracking-[0.15em]"
                  style={{
                    color: '#FFFF00',
                    textShadow: '0 0 8px #FFFF00',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {dateInfo.day} {dateInfo.month}
                </div>
              </div>

              {/* Origin */}
              <div className="col-span-5">
                <div 
                  className="font-bold text-sm tracking-[0.2em] leading-none"
                  style={{
                    color: '#FFFF00',
                    textShadow: '0 0 8px #FFFF00',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {trip.from_city === "Guatemala City" ? "GUATEMALA" : trip.from_city.toUpperCase()}
                </div>
              </div>

              {/* Destination */}
              <div className="col-span-5">
                <div 
                  className="font-bold text-sm tracking-[0.2em] leading-none"
                  style={{
                    color: '#FFFF00',
                    textShadow: '0 0 8px #FFFF00',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {trip.to_city === "Guatemala City" ? "GUATEMALA" : trip.to_city.toUpperCase()}
                </div>
              </div>
            </article>
          );
        })}
      </main>

      {/* Page Number - Bottom Right */}
      {pageNumber > 1 && (
        <div className="absolute bottom-6 right-8 z-20">
          <p 
            className="text-sm tracking-[0.3em] font-bold leading-none"
            style={{ 
              fontFamily: "'Courier New', monospace",
              color: '#AAAAAA',
              textShadow: '0 0 6px #AAAAAA',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            PÁGINA {pageNumber}
          </p>
        </div>
      )}

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