
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section className="container mx-auto px-4 py-16">
      <h3 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h3>
      
      <div className="grid md:grid-cols-2 gap-12">
        {/* For Shoppers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Para Compradores</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold">Crea tu solicitud</h4>
                <p className="text-gray-600">Comparte el link del producto que necesitas y cuánto pagarías por el servicio</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold">Te emparejamos</h4>
                <p className="text-gray-600">Nuestro sistema te conecta con viajeros que pueden traer tu producto</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold">Recibe cotización</h4>
                <p className="text-gray-600">El viajero te envía su precio final y detalles del servicio</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold">Compra y envía</h4>
                <p className="text-gray-600">Tú compras el producto online y lo envías a la dirección del viajero</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
              <div>
                <h4 className="font-semibold">Recibe tu producto</h4>
                <p className="text-gray-600">El viajero te entrega tu producto en Guatemala</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* For Travelers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
                alt="Favorón" 
                className="h-8 w-8"
              />
              <CardTitle className="text-2xl">Para Viajeros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-traveler rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold">Registra tu viaje</h4>
                <p className="text-gray-600">Comparte detalles de tu viaje y dirección donde pueden enviarte paquetes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-traveler rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold">Te emparejamos</h4>
                <p className="text-gray-600">Te conectamos con solicitudes compatibles con tu viaje</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-traveler rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold">Envía tu cotización</h4>
                <p className="text-gray-600">Propón tu precio por traer el paquete, incluyendo cualquier costo adicional</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-traveler rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold">Recibe el paquete</h4>
                <p className="text-gray-600">El comprador envía el producto a tu hotel/dirección</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-traveler rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
              <div>
                <h4 className="font-semibold">Entrega y gana</h4>
                <p className="text-gray-600">Entregas el paquete en Guatemala y recibes tu pago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HowItWorksSection;
