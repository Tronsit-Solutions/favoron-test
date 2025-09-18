import React from "react";
import favoronLogo from "@/assets/favoron-logo.png";

interface InstagramCapturePreviewProps {
  trips: any[];
  searchTerm: string;
}

export const InstagramCapturePreview = ({ trips, searchTerm }: InstagramCapturePreviewProps) => {
  const filteredTrips = trips.filter(trip => 
    trip.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatInstagramDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const firstPageTrips = filteredTrips.slice(0, 8);
  const secondPageTrips = filteredTrips.slice(8);
  const hasSecondPage = secondPageTrips.length > 0;

  const renderTripPage = (trips: any[], pageNumber: number) => (
    <div 
      style={{
        width: '1080px',
        height: '1080px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        fontFamily: '"Bricolage Grotesque", "Inter", system-ui, sans-serif'
      }}
    >
      {/* Background Layers */}
      <div style={{
        position: 'absolute',
        inset: '0',
        background: 'linear-gradient(135deg, hsl(173 58% 39% / 0.05) 0%, hsl(0 0% 100% / 0.98) 30%, hsl(142 76% 36% / 0.08) 100%)'
      }}></div>
      
      <div style={{
        position: 'absolute',
        inset: '0',
        background: 'linear-gradient(45deg, hsl(189 94% 43% / 0.03) 0%, transparent 40%, hsl(173 58% 39% / 0.04) 100%)'
      }}></div>

      {/* Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '144px',
        height: '144px',
        background: 'hsl(173 58% 39% / 0.10)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        opacity: '0.3'
      }}></div>
      
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '128px',
        height: '128px',
        background: 'hsl(142 76% 36% / 0.08)',
        borderRadius: '50%',
        filter: 'blur(30px)',
        opacity: '0.25'
      }}></div>

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: '20',
        textAlign: 'center',
        paddingTop: '24px',
        paddingBottom: '16px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(203, 213, 225, 0.2)',
          borderRadius: '12px',
          margin: '0 24px',
          padding: '16px',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <img 
              src={favoronLogo} 
              alt="Favoron Logo" 
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain',
                opacity: '0.9'
              }}
            />
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#0f172a',
              letterSpacing: '-0.025em',
              paddingTop: '4px',
              margin: '0'
            }}>
              Hub de viajes {pageNumber > 1 ? `(${pageNumber})` : ''}
            </h1>
          </div>
          <div style={{
            width: '32px',
            height: '2px',
            background: 'linear-gradient(to right, hsl(173 58% 39%), hsl(142 76% 36%), hsl(189 94% 43%))',
            margin: '0 auto 8px'
          }}></div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        position: 'relative',
        zIndex: '10',
        padding: '0 48px'
      }}>
        <section style={{
          background: 'transparent',
          borderRadius: '8px',
          padding: '0 24px 48px',
          minHeight: '420px'
        }}>
          {/* Column Headers */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(203, 213, 225, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                background: 'hsl(173 58% 39% / 0.05)',
                border: '1px solid hsl(173 58% 39% / 0.2)'
              }}>
                <span style={{ fontSize: '12px', color: 'hsl(173 58% 39%)' }}>📍</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Origen</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                background: 'hsl(173 58% 39% / 0.05)',
                border: '1px solid hsl(173 58% 39% / 0.2)'
              }}>
                <span style={{ fontSize: '12px', color: 'hsl(173 58% 39%)' }}>📍</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Destino</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '6px',
                background: 'hsl(173 58% 39% / 0.05)',
                border: '1px solid hsl(173 58% 39% / 0.2)'
              }}>
                <span style={{ fontSize: '12px', color: 'hsl(173 58% 39%)' }}>📅</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Fecha</span>
              </div>
            </div>
          </div>

          {/* Trips List */}
          <div style={{
            maxHeight: '336px',
            overflow: 'hidden'
          }}>
            {trips.map((trip, index) => (
              <div
                key={trip.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  alignItems: 'center'
                }}
              >
                {/* Origin Column */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'hsl(173 58% 39% / 0.05)',
                  border: '1px solid hsl(173 58% 39% / 0.1)',
                  backdropFilter: 'blur(2px)'
                }}>
                  {trip.from_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.from_city}
                </div>
                
                {/* Destination Column */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'hsl(173 58% 39% / 0.05)',
                  border: '1px solid hsl(173 58% 39% / 0.1)',
                  backdropFilter: 'blur(2px)'
                }}>
                  {trip.to_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.to_city}
                </div>
                
                {/* Date Column */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#0f172a',
                  textAlign: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'hsl(173 58% 39% / 0.05)',
                  border: '1px solid hsl(173 58% 39% / 0.1)',
                  backdropFilter: 'blur(2px)'
                }}>
                  {formatInstagramDate(trip.arrival_date)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'absolute',
        bottom: '24px',
        left: '0',
        right: '0',
        zIndex: '10'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: '#64748b',
            fontSize: '12px',
            fontWeight: '500',
            margin: '0'
          }}>
            www.favoron.app
          </p>
        </div>
      </footer>
    </div>
  );

  return (
    <div>
      {renderTripPage(firstPageTrips, 1)}
      {hasSecondPage && renderTripPage(secondPageTrips, 2)}
    </div>
  );
};