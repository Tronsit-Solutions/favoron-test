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

  const firstPageTrips = filteredTrips.slice(0, 6);
  const secondPageTrips = filteredTrips.slice(6);
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
        background: 'linear-gradient(135deg, #3ab5ff 0%, #ff6b00 100%)'
      } : {
        background: 'linear-gradient(135deg, hsl(204 100% 62%) 0%, hsl(24 100% 50%) 100%)'
      }}
    >
      {/* Overlay Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Header with Logo */}
      <header className="relative z-20 pt-12 pb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src={favoronLogo} 
              alt="Favoron Logo" 
              className="w-20 h-20 object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg mb-2">
            Próximos Viajes
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/90">
            <Calendar className="w-5 h-5" />
            <p className="text-lg font-medium">
              {pageNumber > 1 ? `Página ${pageNumber}` : new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}
            </p>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <main className="relative z-10 px-8 pb-8">
        <div className="grid grid-cols-2 gap-6">
          {trips.map((trip, index) => {
            const dateInfo = formatCalendarDate(trip.arrival_date);
            return (
              <article
                key={trip.id}
                className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300"
                style={{
                  animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {/* Calendar Date Display */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-gradient-to-br from-primary to-accent text-white rounded-2xl p-4 shadow-lg min-w-[80px] text-center">
                    <div className="text-3xl font-bold leading-none mb-1">{dateInfo.day}</div>
                    <div className="text-sm font-semibold uppercase tracking-wider">{dateInfo.month}</div>
                    <div className="text-xs opacity-90 mt-1">{dateInfo.year}</div>
                  </div>
                  
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-primary rotate-45" />
                        <span className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Desde</span>
                      </div>
                      <p className="text-lg font-bold text-foreground leading-tight">
                        {trip.from_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.from_city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/20 via-primary/50 to-transparent"></div>
                  <MapPin className="w-5 h-5 text-accent" />
                  <div className="flex-1 h-px bg-gradient-to-l from-primary/20 via-primary/50 to-transparent"></div>
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">Hacia</span>
                  </div>
                  <p className="text-lg font-bold text-foreground leading-tight">
                    {trip.to_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.to_city}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 z-10">
        <div className="text-center">
          <div className="inline-block bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-xl">
            <p className="text-primary font-bold text-lg">
              www.favoron.app
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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