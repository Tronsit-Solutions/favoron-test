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

  const TRIPS_PER_PAGE = 12;
  const pages = [];
  for (let i = 0; i < filteredTrips.length; i += TRIPS_PER_PAGE) {
    pages.push(filteredTrips.slice(i, i + TRIPS_PER_PAGE));
  }

  const renderTripPage = (trips: any[], pageNumber: number) => (
    <div 
      className={`relative overflow-hidden flex flex-col ${
        forCapture 
          ? 'w-[1080px] h-[1080px]' 
          : 'w-full aspect-square'
      }`}
      style={forCapture ? { 
        width: '1080px', 
        height: '1080px',
        background: 'transparent'
      } : {
        background: 'transparent'
      }}
    >
      {/* Header - LED Airport Style */}
      <header className="relative z-20" style={{ backgroundColor: '#1a2942' }}>
        <div className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 
                  className="text-4xl font-bold tracking-[0.1em] leading-none font-bricolage"
                  style={{ 
                    color: '#fbbf24',
                    fontVariantNumeric: 'tabular-nums',
                    fontStretch: 'condensed',
                    fontWeight: 700,
                    textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                  }}
                >
                  PRÓXIMOS VIAJES
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div 
                className="text-2xl font-bold tracking-[0.3em] leading-none font-bricolage"
                style={{ 
                  color: '#fbbf24',
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 700,
                  textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                }}
              >
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div 
                className="text-xs tracking-[0.25em] font-bold leading-none mt-1 font-bricolage"
                style={{ 
                  color: '#fbbf24',
                  fontVariantNumeric: 'tabular-nums',
                  opacity: 0.8
                }}
              >
                HORA LOCAL
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Departure Board Header */}
      <div className="relative z-10 px-4" style={{ backgroundColor: '#1a2942' }}>
        <div 
          className="grid grid-cols-12 gap-3 text-base font-bold tracking-[0.3em] leading-none pb-2 font-bricolage"
          style={{ 
            color: '#fbbf24',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            opacity: 0.9
          }}
        >
          <div className="col-span-2">FECHA</div>
          <div className="col-span-1"></div>
          <div className="col-span-5">ORIGEN</div>
          <div className="col-span-4">DESTINO</div>
        </div>
      </div>

      {/* Trips Board */}
      <main className="relative z-10 flex-1 flex flex-col">
        {trips.map((trip, index) => {
          const dateInfo = formatCalendarDate(trip.arrival_date);
          return (
            <article
              key={trip.id}
              className="grid grid-cols-12 gap-3 items-center py-2 px-4 font-bricolage flex-1"
              style={{
                animation: forCapture ? 'none' : `flipIn 0.6s ease-out ${index * 0.1}s both`,
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#d4ebf7'
              }}
            >
              {/* Date */}
              <div className="col-span-2">
                <div 
                  className="font-bold text-lg leading-none tracking-[0.15em]"
                  style={{
                    color: '#ffffff',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {dateInfo.day} {dateInfo.month}
                </div>
              </div>

              {/* Empty column */}
              <div className="col-span-1"></div>

              {/* Origin */}
              <div className="col-span-5">
                <div 
                  className="font-bold text-lg tracking-[0.2em] leading-none"
                  style={{
                    color: '#ffffff',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 700
                  }}
                >
                  {trip.from_city === "Guatemala City" ? "GUATEMALA" : trip.from_city.toUpperCase()}
                </div>
              </div>

              {/* Destination */}
              <div className="col-span-4">
                <div 
                  className="font-bold text-lg tracking-[0.2em] leading-none"
                  style={{
                    color: '#ffffff',
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
        <div className="absolute bottom-6 right-4 z-20">
          <p 
            className="text-sm tracking-[0.3em] font-bold leading-none font-bricolage"
            style={{ 
              color: '#3a8ec1',
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
    <div className="flex flex-col space-y-8 bg-white">
      {pages.map((pageTrips, index) => renderTripPage(pageTrips, index + 1))}
    </div>
  );
};