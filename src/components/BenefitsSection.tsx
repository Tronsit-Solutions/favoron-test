
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, DollarSign, Users } from "lucide-react";

const BenefitsSection = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-12">¿Por qué elegir Favorón?</h3>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Seguro y Confiable</h4>
              <p className="text-gray-600">Sistema de verificación y reputación para mayor seguridad</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Precios Justos</h4>
              <p className="text-gray-600">Cotizaciones transparentes sin comisiones ocultas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Comunidad Activa</h4>
              <p className="text-gray-600">Miles de viajeros y compradores en nuestra plataforma</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
