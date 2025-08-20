import { useState } from "react";
import AvailableTripsCard from "@/components/AvailableTripsCard";
import AvailableTripsModal from "@/components/AvailableTripsModal";

const TravelsHubSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewTrips = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section className="py-10 px-4 bg-gradient-to-br from-teal-400 via-cyan-300 to-emerald-400 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-teal-200/30 rounded-full blur-2xl"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 mb-6">
            <span className="text-2xl">🌍</span>
            <span className="text-slate-800 font-medium">Hub de Viajes</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
            Viajes Disponibles
            <span className="block text-3xl md:text-4xl bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              en Tiempo Real
            </span>
          </h2>
          
          <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Conectamos personas reales que viajan con quienes necesitan productos del extranjero. 
            <span className="font-semibold">Transparencia total, confianza real.</span>
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <AvailableTripsCard onViewTrips={handleViewTrips} />
        </div>
      </div>

      <AvailableTripsModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default TravelsHubSection;