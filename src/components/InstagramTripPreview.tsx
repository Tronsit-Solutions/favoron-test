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

  return (
    <div className="w-[1080px] h-[1080px] bg-background relative overflow-hidden">
      {/* Modern Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/50"></div>
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.1) 0%, transparent 25%), 
                           radial-gradient(circle at 75% 75%, hsl(var(--primary) / 0.1) 0%, transparent 25%)`
        }}></div>
      </div>

      {/* Header Section */}
      <header className="relative z-10 text-center pt-6 pb-4">
        <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight pt-4">
          Hub de viajes
        </h1>
        <div className="w-20 h-0.5 bg-primary mx-auto mb-4"></div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-16">
        <section className="bg-gradient-to-br from-card/80 via-card/60 to-primary/10 backdrop-blur-md rounded-3xl p-8 border border-primary/20 shadow-glow">
          {/* Column Headers with Icons */}
          <div className="grid grid-cols-3 gap-4 py-4 px-6 mb-6 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-2xl border border-primary/20">
            <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl border border-primary/30">
              <MapPin size={20} className="text-primary" />
              <span className="text-lg font-bold text-primary">Origen</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-xl border border-secondary/30">
              <MapPin size={20} className="text-secondary" />
              <span className="text-lg font-bold text-secondary">Destino</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-accent/10 to-accent/20 rounded-xl border border-accent/30">
              <Calendar size={20} className="text-accent" />
              <span className="text-lg font-bold text-accent">Fecha</span>
            </div>
          </div>

          {/* Trips List */}
          <div className="space-y-3 max-h-[750px] overflow-hidden">
            {filteredTrips.slice(0, 12).map((trip, index) => (
              <article
                key={trip.id}
                className="grid grid-cols-3 gap-4 py-4 px-6 bg-gradient-to-r from-card/90 via-primary/5 to-card/90 backdrop-blur-md rounded-2xl border border-primary/20 shadow-glow hover:shadow-xl hover:border-primary/40 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Origin Column */}
                <div className="text-lg font-semibold text-foreground text-center p-2 bg-gradient-to-br from-primary/5 to-transparent rounded-lg">
                  {trip.from_city}
                </div>
                
                {/* Destination Column */}
                <div className="text-lg font-semibold text-foreground text-center p-2 bg-gradient-to-br from-secondary/5 to-transparent rounded-lg">
                  {trip.to_city}
                </div>
                
                {/* Date Column */}
                <div className="text-sm font-medium text-accent bg-gradient-to-br from-accent/10 to-accent/20 px-4 py-3 rounded-xl border border-accent/30 text-center backdrop-blur-sm hover-scale">
                  {formatInstagramDate(trip.arrival_date)}
                </div>
              </article>
            ))}
            
            {filteredTrips.length > 12 && (
              <div className="text-center py-4 text-muted-foreground font-medium">
                +{filteredTrips.length - 12} viajes más
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 left-0 right-0 z-10">
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">
            www.favoron.app
          </p>
        </div>
      </footer>
    </div>
  );
};