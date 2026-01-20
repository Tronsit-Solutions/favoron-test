import React from "react";
import { Plane } from "lucide-react";

interface InstagramTripPreviewProps {
  trips: any[];
  searchTerm: string;
  forCapture?: boolean;
  currentPage?: number;
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

  // 7 viajes por página para el nuevo diseño con cards horizontales
  const TRIPS_PER_PAGE = 7;
  const pages = [];
  for (let i = 0; i < filteredTrips.length; i += TRIPS_PER_PAGE) {
    pages.push(filteredTrips.slice(i, i + TRIPS_PER_PAGE));
  }

  const formatCityName = (city: string) => {
    if (city === "Guatemala City") return "Guatemala";
    // Capitalize first letter of each word
    return city.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const renderTripPage = (pageTrips: any[], pageNumber: number) => (
    <div 
      data-capture-element="true"
      style={{
        width: forCapture ? '1080px' : '100%',
        height: forCapture ? '1080px' : 'auto',
        aspectRatio: forCapture ? undefined : '1 / 1',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e8eef3 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Header - Promotional Title */}
      <header style={{ 
        position: 'relative', 
        zIndex: 20, 
        padding: forCapture ? '48px 64px 32px' : '36px 48px 24px',
        textAlign: 'center'
      }}>
        <h1 
          style={{ 
            color: '#1a1a1a',
            fontWeight: 700,
            fontSize: forCapture ? '46px' : '36px',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            fontFamily: '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            margin: 0
          }}
        >
          Pide un <span style={{ color: '#3a8ec1' }}>FAVORÓN</span>
        </h1>
        <h2 
          style={{ 
            color: '#3a8ec1',
            fontWeight: 700,
            fontSize: forCapture ? '40px' : '32px',
            lineHeight: 1.2,
            marginTop: '4px',
            letterSpacing: '-0.01em',
            fontFamily: '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale'
          }}
        >
          PRÓXIMOS VIAJEROS
        </h2>
      </header>

      {/* Trips Cards - Itinerary Style */}
      <main style={{ 
        position: 'relative', 
        zIndex: 10, 
        flex: 1, 
        padding: forCapture ? '8px 64px 80px' : '6px 48px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: forCapture ? '14px' : '10px'
        }}>
          {pageTrips.map((trip) => {
            const dateInfo = formatCalendarDate(trip.arrival_date);
            return (
              <article
                key={trip.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: forCapture ? '16px' : '12px',
                  padding: forCapture ? '20px 28px' : '16px 22px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: forCapture ? '16px' : '12px'
                }}
              >
                {/* Route: Origin → Destination */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: forCapture ? '14px' : '10px', 
                  flex: 1,
                  minWidth: 0
                }}>
                  <span 
                    style={{
                      fontFamily: '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: forCapture ? '22px' : '18px',
                      fontWeight: 700,
                      color: '#1a1a1a',
                      WebkitFontSmoothing: 'antialiased',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatCityName(trip.from_city)}
                  </span>
                  <span style={{ 
                    color: '#94a3b8', 
                    fontSize: forCapture ? '24px' : '20px',
                    fontWeight: 300,
                    lineHeight: 1
                  }}>
                    →
                  </span>
                  <span 
                    style={{
                      fontFamily: '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: forCapture ? '22px' : '18px',
                      fontWeight: 700,
                      color: '#3a8ec1',
                      WebkitFontSmoothing: 'antialiased',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatCityName(trip.to_city)}
                  </span>
                </div>

                {/* Date Badge */}
                <div 
                  style={{
                    backgroundColor: '#3a8ec1',
                    borderRadius: forCapture ? '10px' : '8px',
                    padding: forCapture ? '10px 16px' : '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: forCapture ? '8px' : '6px',
                    flexShrink: 0
                  }}
                >
                  <Plane 
                    style={{ 
                      width: forCapture ? '16px' : '14px', 
                      height: forCapture ? '16px' : '14px',
                      color: '#ffffff'
                    }} 
                  />
                  <span 
                    style={{
                      fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontSize: forCapture ? '15px' : '13px',
                      fontWeight: 600,
                      color: '#ffffff',
                      WebkitFontSmoothing: 'antialiased',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {dateInfo.day} {dateInfo.month}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Footer with Branding */}
      <footer style={{
        position: 'absolute',
        bottom: forCapture ? '32px' : '24px',
        left: forCapture ? '64px' : '48px',
        right: forCapture ? '64px' : '48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20
      }}>
        <span style={{
          fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: forCapture ? '18px' : '14px',
          fontWeight: 600,
          color: '#64748b',
          WebkitFontSmoothing: 'antialiased'
        }}>
          favoron.app
        </span>
        <span style={{
          fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: forCapture ? '16px' : '12px',
          fontWeight: 500,
          color: '#94a3b8',
          WebkitFontSmoothing: 'antialiased'
        }}>
          {pages.length > 1 ? `PÁGINA ${pageNumber}` : ''}
        </span>
      </footer>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: 'white' }}>
      {pages.map((pageTrips, index) => renderTripPage(pageTrips, index + 1))}
    </div>
  );
};
