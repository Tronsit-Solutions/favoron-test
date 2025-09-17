import React from "react";
import { formatDate } from "@/utils/dateHelpers";
import { MapPin, Calendar, Send } from "lucide-react";

interface InstagramTripPreviewProps {
  trips: any[];
  searchTerm: string;
}

export const InstagramTripPreview = ({ trips, searchTerm }: InstagramTripPreviewProps) => {
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
    <div className="w-full aspect-square bg-background relative overflow-hidden">
      {/* Glassmorphism Multi-Layer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/98 to-secondary/8"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/3 via-transparent to-primary/4 backdrop-blur-xl"></div>
      
      {/* Advanced Glass Layer with Depth */}
      <div className="absolute inset-0 backdrop-blur-sm saturate-150 brightness-105">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/6"></div>
        <div className="absolute top-0 left-0 w-36 h-36 bg-primary/10 rounded-full blur-xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/8 rounded-full blur-lg opacity-25"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-accent/6 rounded-full blur-md opacity-20"></div>
      </div>

      {/* Premium Light Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/3 via-transparent to-transparent opacity-60"></div>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 40%), 
                     radial-gradient(circle at 80% 70%, hsl(var(--secondary) / 0.06) 0%, transparent 35%),
                     radial-gradient(circle at 60% 20%, hsl(var(--accent) / 0.04) 0%, transparent 30%)`
      }}></div>

      {/* Premium Glass Header */}
      <header className="relative z-20 text-center pt-2 pb-1">
        <div className="backdrop-blur-xl bg-background/20 border border-border/20 rounded-xl mx-3 py-2">
          <h1 className="text-lg font-bold text-foreground mb-1 tracking-tight pt-1">
            Hub de viajes {pageNumber > 1 && `(${pageNumber})`}
          </h1>
          <div className="w-8 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto mb-1"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6">
        <section className="bg-transparent rounded-lg px-3 pb-6 min-h-[420px]">
          {/* Glass Column Headers */}
          <div className="backdrop-blur-lg bg-background/30 border border-border/30 rounded-lg p-2 mb-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center justify-center gap-1 p-1 rounded-md bg-primary/5 border border-primary/20">
                <MapPin size={8} className="text-primary" />
                <span className="text-xs font-bold text-foreground">Origen</span>
              </div>
              <div className="flex items-center justify-center gap-1 p-1 rounded-md bg-primary/5 border border-primary/20">
                <MapPin size={8} className="text-primary" />
                <span className="text-xs font-bold text-foreground">Destino</span>
              </div>
              <div className="flex items-center justify-center gap-1 p-1 rounded-md bg-primary/5 border border-primary/20">
                <Calendar size={8} className="text-primary" />
                <span className="text-xs font-bold text-foreground">Fecha</span>
              </div>
            </div>
          </div>

          {/* Trips List */}
          <div className="max-h-[336px] overflow-hidden">
            {trips.map((trip, index) => (
              <article
                key={trip.id}
                className="group grid grid-cols-3 gap-2 py-2 px-2 hover:-translate-y-0.5 transition-all duration-300 items-center"
              >
                {/* Origin Column */}
                <div className="text-xs font-semibold text-foreground text-center p-1 rounded-lg bg-primary/5 border border-primary/10 backdrop-blur-sm group-hover:bg-primary/8 transition-colors duration-300">
                  {trip.from_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.from_city}
                </div>
                
                {/* Destination Column */}
                <div className="text-xs font-semibold text-foreground text-center p-1 rounded-lg bg-primary/5 border border-primary/10 backdrop-blur-sm group-hover:bg-primary/8 transition-colors duration-300">
                  {trip.to_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.to_city}
                </div>
                
                {/* Date Column */}
                <div className="text-xs font-semibold text-foreground text-center p-1 rounded-lg bg-primary/5 border border-primary/10 backdrop-blur-sm group-hover:bg-primary/8 transition-colors duration-300">
                  {formatInstagramDate(trip.arrival_date)}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-3 left-0 right-0 z-10">
        <div className="text-center">
          <p className="text-muted-foreground text-xs font-medium">
            www.favoron.app
          </p>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="flex flex-col space-y-8">
      {renderTripPage(firstPageTrips, 1)}
      {hasSecondPage && renderTripPage(secondPageTrips, 2)}
    </div>
  );
};