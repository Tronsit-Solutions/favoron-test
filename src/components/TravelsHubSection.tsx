import { useState } from "react";
import AvailableTripsCard from "@/components/AvailableTripsCard";
import AvailableTripsModal from "@/components/AvailableTripsModal";

const TravelsHubSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Viajes Disponibles
            <span className="block text-2xl md:text-3xl text-primary mt-1">
              en Tiempo Real
            </span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conectamos personas reales que viajan con quienes necesitan productos del extranjero.{" "}
            <span className="font-semibold">Transparencia total, confianza real.</span>
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <AvailableTripsCard onViewTrips={() => setIsModalOpen(true)} />
        </div>
      </div>

      <AvailableTripsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};

export default TravelsHubSection;
