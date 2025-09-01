import { Globe, Shield, DollarSign, Users } from "lucide-react";

const PlatformDescriptionSection = () => {
  return (
    <section className="pt-8 pb-16 bg-gradient-to-br from-background via-background/95 to-muted/50 relative overflow-hidden animate-fade-in">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full opacity-60 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-accent/10 via-accent/5 to-transparent rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            ¿Qué es <span className="bg-gradient-to-r from-traveler to-shopper bg-clip-text text-transparent">Favorón</span>?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-traveler to-shopper mx-auto rounded-full"></div>
        </div>

        {/* Main description */}
        <div className="text-center mb-12">
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto font-medium">
            La plataforma que conecta compradores que necesitan productos del extranjero 
            con viajeros dispuestos a traerlos de forma <span className="text-traveler font-semibold">segura</span>, 
            <span className="text-success font-semibold"> económica</span> y 
            <span className="text-shopper font-semibold"> confiable</span>.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="surface-glass rounded-xl p-6 text-center shadow-glow border border-border/30 hover:shadow-glow-info hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6 text-info" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Global</h3>
            <p className="text-sm text-muted-foreground">Productos de cualquier parte del mundo</p>
          </div>

          <div className="surface-glass rounded-xl p-6 text-center shadow-glow border border-border/30 hover:shadow-glow-success hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Seguro</h3>
            <p className="text-sm text-muted-foreground">Verificación y protección garantizada</p>
          </div>

          <div className="surface-glass rounded-xl p-6 text-center shadow-glow border border-border/30 hover:shadow-glow-warning hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Económico</h3>
            <p className="text-sm text-muted-foreground">Precios justos y transparentes</p>
          </div>

          <div className="surface-glass rounded-xl p-6 text-center shadow-glow border border-border/30 hover:shadow-glow-accent hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Confiable</h3>
            <p className="text-sm text-muted-foreground">Comunidad verificada y activa</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformDescriptionSection;