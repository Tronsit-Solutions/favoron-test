import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plane, Search, DollarSign, ShoppingCart, Truck, ArrowRight, Star } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            ¿Cómo funciona?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Un proceso simple y seguro que beneficia a todos
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-10">
          {/* Shopper Card */}
          <Card className="border border-border bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2.5 bg-shopper rounded-lg text-white">
                  <Package className="h-6 w-6" />
                </div>
                <span className="text-shopper font-bold">Para Shoppers</span>
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">Consigue productos del extranjero fácil y rápido</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { icon: Search, title: "Crea tu solicitud", desc: "Describe el producto que necesitas y de dónde lo quieres" },
                { icon: Star, title: "Te conectamos", desc: "Te conectamos con un viajero de confianza" },
                { icon: DollarSign, title: "Recibe cotización", desc: "El viajero te envía cotización y detalles por el Favorón" },
                { icon: ShoppingCart, title: "Realizas la compra", desc: "Compras el producto y lo envías a la dirección del viajero" },
                { icon: Truck, title: "Recibe tu producto", desc: "Retira en oficina o recibe a domicilio" }
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-shopper" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-0.5">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Traveler Card */}
          <Card className="border border-border bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2.5 bg-traveler rounded-lg text-white">
                  <Plane className="h-6 w-6" />
                </div>
                <span className="text-traveler font-bold">Para Viajeros</span>
              </CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">Gana dinero extra en tus viajes ayudando a otros</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { icon: Plane, title: "Registra tu viaje", desc: "Indica tu destino, fechas y capacidad disponible" },
                { icon: Star, title: "Te emparejamos", desc: "Conectamos tu viaje con solicitudes verificadas" },
                { icon: DollarSign, title: "Envía cotización", desc: "Revisa solicitudes y propón tus precios justos" },
                { icon: ShoppingCart, title: "Recibes el producto", desc: "El comprador envía el producto a tu dirección para que lo transportes" },
                { icon: Truck, title: "Entregas en oficina", desc: "Entregas en la oficina de Favoron y recibes tu pago" }
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <step.icon className="h-5 w-5 text-traveler" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-0.5">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
