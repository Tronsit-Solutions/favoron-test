import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface Trip {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
}

interface InstagramPostGeneratorProps {
  trips: Trip[];
  pageNumber: number;
  totalPages: number;
}

export const InstagramPostGenerator = forwardRef<HTMLDivElement, InstagramPostGeneratorProps>(
  ({ trips, pageNumber, totalPages }, ref) => {
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div 
        ref={ref}
        className="w-[1080px] h-[1080px] bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-500 flex flex-col relative overflow-hidden border-8 border-white"
        style={{ fontSize: '16px' }}
      >
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm px-12 py-8 text-center">
          <h1 className="text-white text-5xl font-bold mb-2">🌍 Hub de Viajes</h1>
          <p className="text-white/90 text-xl">Viajes Disponibles</p>
          {totalPages > 1 && (
            <p className="text-white/80 text-lg mt-2">
              Página {pageNumber} de {totalPages}
            </p>
          )}
        </div>

        {/* Trips List */}
        <div className="flex-1 px-12 py-8 space-y-8">
          {trips.map((trip, index) => (
            <div 
              key={trip.id}
              className="bg-white rounded-2xl p-8 shadow-lg mx-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-400 p-3 rounded-xl">
                    <Plane className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 text-2xl font-bold text-gray-800">
                      <span>{trip.from_city}</span>
                      <span className="text-teal-500">→</span>
                      <span>{trip.to_city}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5" />
                    <span className="text-lg font-medium">
                      {formatDate(trip.arrival_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-white/10 backdrop-blur-sm px-12 py-6 text-center">
          <p className="text-white/90 text-lg">
            Generado el {currentDate}
          </p>
          <p className="text-white/70 text-base mt-1">
            Favron - Conectando viajeros y compradores
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>
    );
  }
);