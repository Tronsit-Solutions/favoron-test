import { DollarSign, Users, Shield, Zap, Globe, Award } from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    { icon: Shield, title: "100% Seguro", description: "Sistema de verificación de usuarios y garantía de protección en cada transacción", color: "text-shopper" },
    { icon: DollarSign, title: "Precios Justos", description: "Cotizaciones transparentes, sin comisiones ocultas ni sorpresas al final", color: "text-success" },
    { icon: Zap, title: "Rápido y Fácil", description: "Proceso optimizado que te ahorra tiempo y simplifica todo el proceso", color: "text-warning" },
    { icon: Users, title: "Comunidad Confiable", description: "Miles de usuarios verificados que forman parte de nuestra red global", color: "text-traveler" },
    { icon: Globe, title: "Alcance Global", description: "Conectamos personas en más de 50 destinos alrededor del mundo", color: "text-primary" },
    { icon: Award, title: "Calidad Garantizada", description: "Sistema de calificaciones que asegura la mejor experiencia para todos", color: "text-accent" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h3 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            ¿Por qué elegir Favorón?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            La plataforma más confiable y eficiente para conectar viajeros con compradores.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="p-6 rounded-xl border border-border bg-white text-center">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
