
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, DollarSign, Users, Shield, Zap, Heart, Globe, Award } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Sistema de verificación de usuarios y garantía de protección en cada transacción",
      color: "from-shopper to-shopper/80",
      bgColor: "from-shopper/5 to-shopper/10"
    },
    {
      icon: DollarSign,
      title: "Precios Justos",
      description: "Cotizaciones transparentes, sin comisiones ocultas ni sorpresas al final",
      color: "from-success to-success/80",
      bgColor: "from-success/5 to-success/10"
    },
    {
      icon: Zap,
      title: "Rápido y Fácil",
      description: "Proceso optimizado que te ahorra tiempo y simplifica todo el proceso",
      color: "from-warning to-accent",
      bgColor: "from-warning/5 to-accent/10"
    },
    {
      icon: Users,
      title: "Comunidad Confiable",
      description: "Miles de usuarios verificados que forman parte de nuestra red global",
      color: "from-traveler to-traveler/80",
      bgColor: "from-traveler/5 to-traveler/10"
    },
    {
      icon: Globe,
      title: "Alcance Global",
      description: "Conectamos personas en más de 50 destinos alrededor del mundo",
      color: "from-primary to-primary/80",
      bgColor: "from-primary/5 to-primary/10"
    },
    {
      icon: Award,
      title: "Calidad Garantizada",
      description: "Sistema de calificaciones que asegura la mejor experiencia para todos",
      color: "from-accent to-secondary",
      bgColor: "from-accent/5 to-secondary/10"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-white via-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-green-200 to-yellow-200 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <h3 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-shopper via-traveler to-primary bg-clip-text text-transparent">
              ¿Por qué elegir Favorón?
            </span>
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            La plataforma más confiable y eficiente para conectar viajeros con compradores. 
            Diseñada pensando en tu seguridad y comodidad.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={index}
              className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-white/80 backdrop-blur-sm hover:scale-105"
            >
              <CardContent className="p-8 text-center relative">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.bgColor} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${benefit.color} shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Content */}
                <h4 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-gray-800">
                  {benefit.title}
                </h4>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
                  {benefit.description}
                </p>
                
                {/* Hover indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${benefit.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full shadow-md">
              <Heart className="h-5 w-5 text-success" />
              <span className="font-semibold text-gray-800">+1000 usuarios felices</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full shadow-md">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-semibold text-gray-800">99% entregas exitosas</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full shadow-md">
              <Award className="h-5 w-5 text-warning" />
              <span className="font-semibold text-gray-800">4.8/5 calificación promedio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
