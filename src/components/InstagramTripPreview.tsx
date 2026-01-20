import React from "react";
import { MapPin, Package, Plane } from "lucide-react";

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

  const TRIPS_PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < filteredTrips.length; i += TRIPS_PER_PAGE) {
    pages.push(filteredTrips.slice(i, i + TRIPS_PER_PAGE));
  }

  const formatCityName = (city: string) => {
    if (city === "Guatemala City") return "GUATEMALA";
    return city.toUpperCase();
  };

  const renderTripPage = (pageTrips: any[], pageNumber: number) => (
    <div 
      data-capture-element="true"
      style={{
        width: forCapture ? '1080px' : '100%',
        height: forCapture ? '1080px' : 'auto',
        aspectRatio: forCapture ? undefined : '1 / 1',
        backgroundColor: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      {/* Header - Promotional Title with Bricolage Grotesque */}
      <header style={{ 
        position: 'relative', 
        zIndex: 20, 
        padding: forCapture ? '28px 40px 20px' : '24px 32px 16px',
        textAlign: 'center'
      }}>
        <h1 
          style={{ 
            color: '#1a1a1a',
            fontWeight: 700,
            fontSize: forCapture ? '52px' : '42px',
            lineHeight: 1.1,
            letterSpacing: '0.01em',
            fontFamily: '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            margin: 0
          }}
        >
          Pide un <span style={{ color: '#3a8ec1' }}>FAVORÓN</span> con los
        </h1>
        <h2 
          style={{ 
            color: '#3a8ec1',
            fontWeight: 700,
            fontSize: forCapture ? '52px' : '42px',
            lineHeight: 1.1,
            marginTop: '8px',
            letterSpacing: '0.01em',
            fontFamily: '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale'
          }}
        >
          PRÓXIMOS VIAJEROS
        </h2>
      </header>

      {/* Icons with Labels - Inter font */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        padding: forCapture ? '16px 40px' : '12px 32px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: forCapture ? '24px' : '20px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Package 
              style={{ 
                width: forCapture ? '36px' : '32px', 
                height: forCapture ? '36px' : '32px', 
                marginBottom: '8px',
                color: '#1a1a1a'
              }} 
            />
            <span 
              style={{ 
                color: '#1a1a1a', 
                fontSize: forCapture ? '18px' : '16px',
                fontWeight: 600,
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.05em',
                WebkitFontSmoothing: 'antialiased'
              }}
            >
              ORIGEN
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MapPin 
              style={{ 
                width: forCapture ? '36px' : '32px', 
                height: forCapture ? '36px' : '32px', 
                marginBottom: '8px',
                color: '#1a1a1a'
              }} 
            />
            <span 
              style={{ 
                color: '#1a1a1a', 
                fontSize: forCapture ? '18px' : '16px',
                fontWeight: 600,
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.05em',
                WebkitFontSmoothing: 'antialiased'
              }}
            >
              DESTINO
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Plane 
              style={{ 
                width: forCapture ? '36px' : '32px', 
                height: forCapture ? '36px' : '32px', 
                marginBottom: '8px',
                color: '#1a1a1a'
              }} 
            />
            <span 
              style={{ 
                color: '#1a1a1a', 
                fontSize: forCapture ? '18px' : '16px',
                fontWeight: 600,
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.05em',
                WebkitFontSmoothing: 'antialiased'
              }}
            >
              SALIDA
            </span>
          </div>
        </div>
      </div>

      {/* Trips Cards */}
      <main style={{ 
        position: 'relative', 
        zIndex: 10, 
        flex: 1, 
        padding: forCapture ? '12px 40px 24px' : '8px 32px 20px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: forCapture ? '10px' : '8px'
        }}>
          {pageTrips.map((trip) => {
            const dateInfo = formatCalendarDate(trip.arrival_date);
            return (
              <article
                key={trip.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: forCapture ? '16px' : '12px'
                }}
              >
                {/* Origin */}
                <div 
                  style={{
                    backgroundColor: '#3a8ec1',
                    borderRadius: '12px',
                    padding: forCapture ? '14px 12px' : '12px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span 
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: forCapture ? '18px' : '16px',
                      fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                      WebkitFontSmoothing: 'antialiased'
                    }}
                  >
                    {formatCityName(trip.from_city)}
                  </span>
                </div>

                {/* Destination */}
                <div 
                  style={{
                    backgroundColor: '#3a8ec1',
                    borderRadius: '12px',
                    padding: forCapture ? '14px 12px' : '12px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span 
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: forCapture ? '18px' : '16px',
                      fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                      WebkitFontSmoothing: 'antialiased'
                    }}
                  >
                    {formatCityName(trip.to_city)}
                  </span>
                </div>

                {/* Date */}
                <div 
                  style={{
                    backgroundColor: '#3a8ec1',
                    borderRadius: '12px',
                    padding: forCapture ? '14px 12px' : '12px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span 
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: forCapture ? '18px' : '16px',
                      fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      letterSpacing: '0.02em',
                      WebkitFontSmoothing: 'antialiased'
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

      {/* Page Number - Bottom Right */}
      {pageNumber > 1 && (
        <div style={{ 
          position: 'absolute', 
          bottom: forCapture ? '32px' : '24px', 
          right: forCapture ? '32px' : '24px', 
          zIndex: 20 
        }}>
          <p 
            style={{ 
              color: '#666666',
              fontSize: forCapture ? '16px' : '14px',
              fontWeight: 600,
              fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
              margin: 0,
              WebkitFontSmoothing: 'antialiased'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', backgroundColor: 'white' }}>
      {pages.map((pageTrips, index) => renderTripPage(pageTrips, index + 1))}
    </div>
  );
};
