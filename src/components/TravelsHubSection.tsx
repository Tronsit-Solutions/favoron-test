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
    <section className="py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Viajes Disponibles Ahora
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Descubre viajeros reales que pueden traer tus productos. 
            Nuestra plataforma conecta personas en tiempo real.
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