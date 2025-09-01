import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plane, Search, DollarSign, ShoppingCart, Truck, ArrowRight, Star } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-background via-background/95 to-muted/50 relative overflow-hidden animate-fade-in">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"></div>
      <div className="absolute top-20 right-1/4 w-80 h-80 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-gradient-to-l from-accent/10 to-primary/10 rounded-full blur-3xl opacity-20"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h3 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-shopper to-traveler bg-clip-text text-transparent">
              ¿Cómo funciona?
            </span>
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Un proceso simple y seguro que beneficia a todos
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12">
          {/* Shopper Card */}
          <Card className="relative overflow-hidden border-0 shadow-glow bg-gradient-to-br from-shopper/5 to-shopper/10 surface-glass hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-shopper/20 to-primary/10 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-3 bg-shopper rounded-xl text-white shadow-lg">
                  <Package className="h-8 w-8" />
                </div>
                <span className="bg-gradient-to-r from-shopper to-shopper/80 bg-clip-text text-transparent font-bold">
                  Para Compradores
                </span>
              </CardTitle>
              <p className="text-muted-foreground mt-2">Consigue productos del extranjero fácil y rápido</p>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              {[
                { icon: Search, title: "Crea tu solicitud", desc: "Describe el producto que necesitas y de dónde lo quieres" },
                { icon: Star, title: "Te emparejamos", desc: "Conectamos tu solicitud con viajeros verificados" },
                { icon: DollarSign, title: "Recibe cotización", desc: "El viajero te envía el precio y detalles transparentes" },
                { icon: ShoppingCart, title: "Realizas la compra", desc: "Compras el producto y lo envías a la dirección del viajero" },
                { icon: Truck, title: "Retira en oficina", desc: "Recoge tu producto en la oficina de Favoron" }
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                       <step.icon className="h-6 w-6 text-shopper" />
                     </div>
                  </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-foreground mb-1 text-lg">{step.title}</h4>
                     <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                   </div>
                   {index < 4 && (
                     <ArrowRight className="h-4 w-4 text-shopper/60 mt-4 opacity-50" />
                   )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Traveler Card */}
          <Card className="relative overflow-hidden border-0 shadow-glow bg-gradient-to-br from-traveler/5 to-traveler/10 surface-glass hover:scale-105 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-traveler/20 to-secondary/10 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <div className="p-3 bg-traveler rounded-xl text-white shadow-lg">
                  <Plane className="h-8 w-8" />
                </div>
                <span className="bg-gradient-to-r from-traveler to-traveler/80 bg-clip-text text-transparent font-bold">
                  Para Viajeros
                </span>
              </CardTitle>
              <p className="text-muted-foreground mt-2">Gana dinero extra en tus viajes ayudando a otros</p>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              {[
                { icon: Plane, title: "Registra tu viaje", desc: "Indica tu destino, fechas y capacidad disponible" },
                { icon: Star, title: "Te emparejamos", desc: "Conectamos tu viaje con solicitudes verificadas" },
                { icon: DollarSign, title: "Envía cotización", desc: "Revisa solicitudes y propón tus precios justos" },
                { icon: ShoppingCart, title: "Recibes el producto", desc: "El comprador envía el producto a tu dirección para que lo transportes" },
                { icon: Truck, title: "Entregas en oficina", desc: "Entregas en la oficina de Favoron y recibes tu pago" }
              ].map((step, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                       <step.icon className="h-6 w-6 text-traveler" />
                     </div>
                  </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-foreground mb-1 text-lg">{step.title}</h4>
                     <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                   </div>
                   {index < 4 && (
                     <ArrowRight className="h-4 w-4 text-traveler/60 mt-4 opacity-50" />
                   )}
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