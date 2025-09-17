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
      {/* Glassmorphism Multi-Layer Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background/98 to-secondary/8"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/3 via-transparent to-primary/4 backdrop-blur-3xl"></div>
      
      {/* Advanced Glass Layer with Depth */}
      <div className="absolute inset-0 backdrop-blur-sm saturate-150 brightness-105">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/6"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/8 rounded-full blur-2xl opacity-25"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/6 rounded-full blur-xl opacity-20"></div>
      </div>

      {/* Premium Light Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/3 via-transparent to-transparent opacity-60"></div>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 20% 30%, hsl(var(--primary) / 0.08) 0%, transparent 40%), 
                     radial-gradient(circle at 80% 70%, hsl(var(--secondary) / 0.06) 0%, transparent 35%),
                     radial-gradient(circle at 60% 20%, hsl(var(--accent) / 0.04) 0%, transparent 30%)`
      }}></div>

      {/* Premium Glass Header */}
      <header className="relative z-20 text-center pt-6 pb-4">
        <div className="backdrop-blur-xl bg-background/20 border border-border/20 rounded-3xl mx-8 py-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] shadow-primary/10">
          <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight pt-2 drop-shadow-lg">
            Hub de viajes
          </h1>
          <div className="w-20 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto mb-2 shadow-glow"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-16">
        <section className="bg-transparent rounded-2xl p-8">
          {/* Glass Column Headers */}
          <div className="backdrop-blur-lg bg-background/30 border border-border/30 rounded-2xl p-4 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
                <MapPin size={20} className="text-primary" />
                <span className="text-lg font-bold text-foreground">Origen</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
                <MapPin size={20} className="text-primary" />
                <span className="text-lg font-bold text-foreground">Destino</span>
              </div>
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
                <Calendar size={20} className="text-primary" />
                <span className="text-lg font-bold text-foreground">Fecha</span>
              </div>
            </div>
          </div>

          {/* Trips List */}
          <div className="space-y-3 max-h-[750px] overflow-hidden">
            {filteredTrips.slice(0, 12).map((trip, index) => (
              <article
                key={trip.id}
                className="group grid grid-cols-3 gap-4 py-5 px-6 backdrop-blur-xl saturate-150 bg-background/25 rounded-3xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:border-primary/30 transition-all duration-500 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.15) 100%)`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 0 rgba(255,255,255,0.05)`
                }}
              >
                {/* Origin Column */}
                <div className="text-lg font-semibold text-foreground text-center p-2 rounded-2xl bg-primary/5 border border-primary/10 backdrop-blur-sm group-hover:bg-primary/8 transition-colors duration-300">
                  {trip.from_city}
                </div>
                
                {/* Destination Column */}
                <div className="text-lg font-semibold text-foreground text-center p-2 rounded-2xl bg-primary/5 border border-primary/10 backdrop-blur-sm group-hover:bg-primary/8 transition-colors duration-300">
                  {trip.to_city}
                </div>
                
                {/* Date Column */}
                <div className="text-sm font-medium text-muted-foreground px-4 py-2 rounded-2xl border text-center backdrop-blur-lg group-hover:text-foreground transition-colors duration-300 bg-primary/5 border-primary/10">
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