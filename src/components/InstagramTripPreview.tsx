import React from "react";
import { formatDate } from "@/utils/dateHelpers";
import { MapPin, Calendar, Send, Plane, Luggage, ArrowRight } from "lucide-react";
import favoronLogo from "@/assets/favoron-logo.png";

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
      {/* Enhanced Multi-Layer Background with Logo Colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-background/98 to-blue-600/10"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/5 via-transparent to-blue-700/8 backdrop-blur-3xl"></div>
      
      {/* Advanced Glass Layer with Travel Theme */}
      <div className="absolute inset-0 backdrop-blur-sm saturate-150 brightness-105">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-transparent to-blue-600/8"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/12 rounded-full blur-2xl opacity-35"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-xl opacity-30"></div>
        
        {/* Travel Pattern Elements */}
        <div className="absolute top-20 right-20 w-8 h-8 opacity-10">
          <Plane className="w-full h-full text-blue-500 rotate-45" />
        </div>
        <div className="absolute bottom-32 left-24 w-6 h-6 opacity-8">
          <Luggage className="w-full h-full text-blue-600" />
        </div>
        <div className="absolute top-1/2 left-16 w-5 h-5 opacity-6">
          <Plane className="w-full h-full text-blue-500 -rotate-12" />
        </div>
        <div className="absolute top-3/4 right-32 w-7 h-7 opacity-8">
          <Luggage className="w-full h-full text-blue-400" />
        </div>
      </div>

      {/* Premium Light Effects with Blue Theme */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/6 via-transparent to-transparent opacity-70"></div>
      <div className="absolute inset-0" style={{
        background: `radial-gradient(circle at 20% 30%, hsl(220 70% 50% / 0.12) 0%, transparent 40%), 
                     radial-gradient(circle at 80% 70%, hsl(210 65% 55% / 0.08) 0%, transparent 35%),
                     radial-gradient(circle at 60% 20%, hsl(200 60% 60% / 0.06) 0%, transparent 30%)`
      }}></div>

      {/* Enhanced Glass Header with Logo */}
      <header className="relative z-20 text-center pt-6 pb-2">
        <div className="backdrop-blur-xl bg-background/25 border border-blue-500/30 rounded-3xl mx-8 py-8 shadow-2xl shadow-blue-500/20">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src={favoronLogo} 
              alt="Favoron Logo" 
              className="w-16 h-16 drop-shadow-lg filter brightness-110"
            />
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent"></div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight">
              Hub de viajes
            </h1>
          </div>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 mx-auto rounded-full mb-2 shadow-lg shadow-blue-500/30"></div>
          <p className="text-blue-600/80 font-medium text-lg">Conectando destinos, creando experiencias</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-16">
        <section className="bg-transparent rounded-2xl px-8 pb-8">
          {/* Enhanced Glass Column Headers */}
          <div className="backdrop-blur-lg bg-background/35 border border-blue-500/40 rounded-2xl p-6 mb-6 shadow-xl shadow-blue-500/15">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/15 border border-blue-500/30 shadow-lg shadow-blue-500/20">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <MapPin size={22} className="text-blue-600" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Origen</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/15 border border-blue-500/30 shadow-lg shadow-blue-500/20">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <ArrowRight size={22} className="text-blue-600" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Destino</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/15 border border-blue-500/30 shadow-lg shadow-blue-500/20">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Calendar size={22} className="text-blue-600" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">Fecha</span>
              </div>
            </div>
          </div>

          {/* Enhanced Trips List */}
          <div className="space-y-3 max-h-[750px] overflow-hidden">
            {filteredTrips.slice(0, 12).map((trip, index) => (
              <article
                key={trip.id}
                className="group relative grid grid-cols-3 items-center gap-6 py-3 px-8 hover:-translate-y-1 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/20"
              >
                {/* Flight Path Line */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent group-hover:via-blue-500/60 transition-all duration-500"></div>
                
                {/* Travel Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="p-2 rounded-full bg-blue-500/20 border border-blue-500/40 backdrop-blur-sm group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300">
                    <Plane size={16} className="text-blue-600 rotate-90" />
                  </div>
                </div>
                
                {/* Origin Column */}
                <div className="relative text-lg font-bold text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/8 to-blue-600/12 border border-blue-500/25 backdrop-blur-sm group-hover:from-blue-500/15 group-hover:to-blue-600/20 group-hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-blue-700 font-black tracking-wide">
                      {trip.from_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.from_city}
                    </span>
                  </div>
                </div>
                
                {/* Destination Column */}
                <div className="relative text-lg font-bold text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/8 to-blue-600/12 border border-blue-500/25 backdrop-blur-sm group-hover:from-blue-500/15 group-hover:to-blue-600/20 group-hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-blue-700 font-black tracking-wide">
                      {trip.to_city === "Guatemala City" ? "Ciudad de Guatemala" : trip.to_city}
                    </span>
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  </div>
                </div>
                
                {/* Date Column */}
                <div className="relative text-center p-4 rounded-2xl bg-gradient-to-br from-blue-500/12 to-blue-600/18 border border-blue-500/30 backdrop-blur-lg group-hover:from-blue-500/18 group-hover:to-blue-600/25 group-hover:border-blue-500/45 transition-all duration-300 shadow-lg shadow-blue-500/15">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">
                      {formatInstagramDate(trip.arrival_date)}
                    </span>
                  </div>
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

      {/* Enhanced Footer */}
      <footer className="absolute bottom-8 left-0 right-0 z-10">
        <div className="text-center">
          <div className="backdrop-blur-lg bg-background/20 border border-blue-500/30 rounded-2xl mx-8 py-4 shadow-xl shadow-blue-500/15">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src={favoronLogo} 
                alt="Favoron" 
                className="w-8 h-8 drop-shadow-md"
              />
              <p className="text-blue-600 text-lg font-bold tracking-wide">
                www.favoron.app
              </p>
            </div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};