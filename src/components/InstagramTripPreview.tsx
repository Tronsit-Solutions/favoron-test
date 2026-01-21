import React from "react";
import { formatDate } from "@/utils/dateHelpers";
import { MapPin, Package, Plane } from "lucide-react";
import favoronLogo from "@/assets/favoron-logo.png";

interface InstagramTripPreviewProps {
  trips: any[];
  searchTerm: string;
  forCapture?: boolean;
  currentPage?: number; // Renderizar solo una página específica para captura
}

export const InstagramTripPreview = ({ trips, searchTerm, forCapture = false, currentPage }: InstagramTripPreviewProps) => {
  const filteredTrips = trips.filter(trip => 
    trip.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCalendarDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
    };
  };

  const TRIPS_PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < filteredTrips.length; i += TRIPS_PER_PAGE) {
    pages.push(filteredTrips.slice(i, i + TRIPS_PER_PAGE));
  }

  const renderTripPage = (trips: any[], pageNumber: number) => (
    <div 
      data-capture-element="true"
      className={`relative overflow-hidden flex flex-col ${
        forCapture 
          ? 'w-[1080px] h-[1080px]' 
          : 'w-full aspect-square'
      }`}
      style={forCapture ? { 
        width: '1080px', 
        height: '1080px',
        backgroundColor: '#f5f5f5',
        position: 'relative'
      } : {
        backgroundColor: '#f5f5f5'
      }}
    >
      {/* Header - Promotional Title */}
      <header className="relative z-20 py-4 px-8">
        <div className="text-center">
          <h1 
            className="text-5xl font-bold leading-tight font-bricolage"
            style={{ 
              color: '#1a1a1a',
              fontWeight: 700,
              letterSpacing: '0.02em',
              fontFamily: '"Bricolage Grotesque", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}
          >
            Pide un <span style={{ color: '#3a8ec1', letterSpacing: '0.02em' }}>FAVORÓN</span> con los
          </h1>
          <h2 
            className="text-5xl font-bold leading-tight font-bricolage mt-2"
            style={{ 
              color: '#3a8ec1',
              fontWeight: 700,
              letterSpacing: '0.02em',
              fontFamily: '"Bricolage Grotesque", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}
          >
            PRÓXIMOS VIAJEROS
          </h2>
        </div>
      </header>

      {/* Icons with Labels */}
      <div className="relative z-10 px-8 py-4">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col items-center">
            <Package className="w-10 h-10 mb-2" style={{ color: '#1a1a1a' }} />
            <span className="text-xl font-bold" style={{ color: '#1a1a1a', letterSpacing: '0.02em', fontFamily: '"Bricolage Grotesque", sans-serif' }}>ORIGEN</span>
          </div>
          <div className="flex flex-col items-center">
            <MapPin className="w-10 h-10 mb-2" style={{ color: '#1a1a1a' }} />
            <span className="text-xl font-bold" style={{ color: '#1a1a1a', letterSpacing: '0.02em', fontFamily: '"Bricolage Grotesque", sans-serif' }}>DESTINO</span>
          </div>
          <div className="flex flex-col items-center">
            <Plane className="w-10 h-10 mb-2" style={{ color: '#1a1a1a' }} />
            <span className="text-xl font-bold" style={{ color: '#1a1a1a', letterSpacing: '0.02em', fontFamily: '"Bricolage Grotesque", sans-serif' }}>SALIDA</span>
          </div>
        </div>
      </div>

      {/* Trips Cards */}
      <main className="relative z-10 flex-1 px-8 py-4">
        <div className="flex flex-col gap-3 mb-6">
          {trips.map((trip, index) => {
            const dateInfo = formatCalendarDate(trip.arrival_date);
            return (
              <article
                key={trip.id}
                className="grid grid-cols-3 gap-4 font-bricolage"
              >
                {/* Origin */}
                <div 
                  className="py-4 px-3 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: '#3a8ec1'
                  }}
                >
                  <div 
                    className="font-bold text-xl text-center leading-tight"
                    style={{
                      color: '#ffffff',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      fontFamily: '"Bricolage Grotesque", sans-serif'
                    }}
                  >
                    {trip.from_city === "Guatemala City" ? "GUATEMALA" : trip.from_city.toUpperCase()}
                  </div>
                </div>

                {/* Destination */}
                <div 
                  className="py-4 px-3 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: '#3a8ec1'
                  }}
                >
                  <div 
                    className="font-bold text-xl text-center leading-tight"
                    style={{
                      color: '#ffffff',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      fontFamily: '"Bricolage Grotesque", sans-serif'
                    }}
                  >
                    {trip.to_city === "Guatemala City" ? "GUATEMALA" : trip.to_city.toUpperCase()}
                  </div>
                </div>

                {/* Date */}
                <div 
                  className="py-4 px-3 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: '#3a8ec1'
                  }}
                >
                  <div 
                    className="font-bold text-xl text-center leading-tight"
                    style={{
                      color: '#ffffff',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      fontFamily: '"Bricolage Grotesque", sans-serif'
                    }}
                  >
                    {dateInfo.day} {dateInfo.month}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Page Number - Bottom Right */}
      {pageNumber > 1 && (
        <div className="absolute bottom-8 right-8 z-20">
          <p 
            className="text-base font-bold leading-none font-bricolage"
            style={{ 
              color: '#666666'
            }}
          >
            PÁGINA {pageNumber}
          </p>
        </div>
      )}
    </div>
  );

  // Si currentPage está definido, renderizar solo esa página específica
  if (currentPage !== undefined) {
    const pageIndex = currentPage - 1;
    if (pageIndex >= 0 && pageIndex < pages.length) {
      return renderTripPage(pages[pageIndex], currentPage);
    }
    return null;
  }

  // Si no, renderizar todas las páginas
  return (
    <div className="flex flex-col space-y-8 bg-white">
      {pages.map((pageTrips, index) => renderTripPage(pageTrips, index + 1))}
    </div>
  );
};