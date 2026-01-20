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

  // Reducido a 8 viajes por página para mejor espaciado
  const TRIPS_PER_PAGE = 8;
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
        padding: forCapture ? '36px 48px 24px' : '28px 36px 18px',
        textAlign: 'center'
      }}>
        <h1 
          style={{ 
            color: '#1a1a1a',
            fontWeight: 700,
            fontSize: forCapture ? '56px' : '44px',
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
            fontSize: forCapture ? '56px' : '44px',
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
        padding: forCapture ? '20px 48px 12px' : '16px 36px 10px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: forCapture ? '24px' : '20px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Package 
              style={{ 
                width: forCapture ? '40px' : '34px', 
                height: forCapture ? '40px' : '34px', 
                marginBottom: '10px',
                color: '#1a1a1a'
              }} 
            />
            <span 
              style={{ 
                color: '#1a1a1a', 
                fontSize: forCapture ? '20px' : '17px',
                fontWeight: 700,
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.08em',
                WebkitFontSmoothing: 'antialiased'
              }}
            >
              ORIGEN
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <MapPin 
              style={{ 
                width: forCapture ? '40px' : '34px', 
                height: forCapture ? '40px' : '34px', 
                marginBottom: '10px',
                color: '#1a1a1a'
              }} 
            />
            <span 
              style={{ 
                color: '#1a1a1a', 
                fontSize: forCapture ? '20px' : '17px',
                fontWeight: 700,
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.08em',
                WebkitFontSmoothing: 'antialiased'
              }}
            >
              DESTINO
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Plane 
              style={{ 
                width: forCapture ? '40px' : '34px', 
                height: forCapture ? '40px' : '34px', 
                marginBottom: '10px',
                color: '#1a1a1a'
              }} 
            />
            <span 
              style={{ 
                color: '#1a1a1a', 
                fontSize: forCapture ? '20px' : '17px',
                fontWeight: 700,
                fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.08em',
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
        padding: forCapture ? '20px 48px 36px' : '16px 36px 28px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: forCapture ? '16px' : '12px' // Aumentado el gap entre filas
        }}>
          {pageTrips.map((trip) => {
            const dateInfo = formatCalendarDate(trip.arrival_date);
            return (
              <article
                key={trip.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: forCapture ? '20px' : '16px' // Aumentado el gap entre columnas
                }}
              >
                {/* Origin */}
                <div 
                  style={{
                    backgroundColor: '#3a8ec1',
                    borderRadius: '14px',
                    padding: forCapture ? '18px 14px' : '14px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <span 
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: forCapture ? '19px' : '16px',
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
                    borderRadius: '14px',
                    padding: forCapture ? '18px 14px' : '14px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <span 
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: forCapture ? '19px' : '16px',
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
                    borderRadius: '14px',
                    padding: forCapture ? '18px 14px' : '14px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <span 
                    style={{
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: forCapture ? '19px' : '16px',
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
          bottom: forCapture ? '36px' : '28px', 
          right: forCapture ? '36px' : '28px', 
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
