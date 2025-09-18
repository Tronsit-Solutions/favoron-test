import React, { useState } from "react";
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
    <section className="py-10 px-4 bg-gradient-to-br from-background via-background/95 to-muted/50 relative overflow-hidden animate-fade-in">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"></div>
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-gradient-to-l from-accent/10 to-primary/10 rounded-full blur-3xl opacity-20"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-8">
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Viajes Disponibles
            <span className="block text-3xl md:text-4xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              en Tiempo Real
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
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