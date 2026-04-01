import { Globe, Shield, DollarSign, Users } from "lucide-react";

const PlatformDescriptionSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            ¿Qué es <span className="text-primary">Favorón</span>?
          </h2>
          <div className="w-16 h-0.5 bg-primary mx-auto"></div>
        </div>

        {/* Main description */}
        <div className="text-center mb-12">
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            La plataforma que conecta compradores que necesitan productos del extranjero 
            con viajeros dispuestos a traerlos de forma <span className="text-traveler font-semibold">segura</span>, 
            <span className="text-success font-semibold"> económica</span> y 
            <span className="text-shopper font-semibold"> confiable</span>.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {[
            { icon: Globe, title: "Global", desc: "Productos de cualquier parte del mundo", color: "text-info" },
            { icon: Shield, title: "Seguro", desc: "Verificación y protección garantizada", color: "text-success" },
            { icon: DollarSign, title: "Económico", desc: "Precios justos y transparentes", color: "text-warning" },
            { icon: Users, title: "Confiable", desc: "Comunidad verificada y activa", color: "text-accent" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 text-center border border-border">
              <div className={`w-11 h-11 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformDescriptionSection;
