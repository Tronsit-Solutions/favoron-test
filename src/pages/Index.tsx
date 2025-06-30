
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Package, Shield, Users, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const { toast } = useToast();

  const handleAuth = (userData: any) => {
    setUser(userData);
    setShowAuthModal(false);
    toast({
      title: "¡Bienvenido a Favorón!",
      description: `Hola ${userData.name}, tu cuenta ha sido creada exitosamente.`,
    });
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (user) {
    return <Dashboard user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/f2f6b820-8e72-40a8-a7b5-c4dbaafd6a7e.png" 
              alt="Favorón Logo" 
              className="h-8"
            />
          </div>
          <div className="space-x-2">
            <Button variant="ghost" onClick={() => openAuth('login')}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => openAuth('register')}>
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Conectamos viajeros con guatemaltecos
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Convierte el espacio libre de tu maleta en una oportunidad de ayudar y ganar dinero. 
            La forma más fácil de recibir paquetes del extranjero.
          </p>
          <div className="space-x-4">
            <Button size="lg" variant="secondary" onClick={() => openAuth('register')}>
              <Package className="mr-2 h-5 w-5" />
              Solicitar Paquete
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-primary" onClick={() => openAuth('register')}>
              <Plane className="mr-2 h-5 w-5" />
              Registrar Viaje
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h3>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            
            {/* For Shoppers */}
            <Card className="gradient-card border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-6 w-6 text-primary" />
                  <CardTitle className="text-primary">Para Compradores</CardTitle>
                </div>
                <CardDescription>
                  Recibe productos del extranjero de forma segura y económica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary">1</Badge>
                  <p className="text-sm">Solicita tu paquete con link y descripción del producto</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary">2</Badge>
                  <p className="text-sm">Te conectamos con un viajero de confianza</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary">3</Badge>
                  <p className="text-sm">Paga de forma segura cuando aceptes la cotización</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="secondary">4</Badge>
                  <p className="text-sm">Recibe tu paquete en Guatemala</p>
                </div>
              </CardContent>
            </Card>

            {/* For Travelers */}
            <Card className="gradient-card border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Plane className="h-6 w-6 text-accent" />
                  <CardTitle className="text-accent">Para Viajeros</CardTitle>
                </div>
                <CardDescription>
                  Monetiza el espacio libre de tu maleta ayudando a otros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge variant="outline">1</Badge>
                  <p className="text-sm">Registra tu viaje con destino y fechas</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline">2</Badge>
                  <p className="text-sm">Ve solicitudes que coincidan con tu ruta</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline">3</Badge>
                  <p className="text-sm">Cotiza el servicio según tu conveniencia</p>
                </div>
                <div className="flex items-start space-x-3">
                  <Badge variant="outline">4</Badge>
                  <p className="text-sm">Entrega el paquete y recibe tu pago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">¿Por qué elegir Favorón?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Seguro y Confiable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Verificación de usuarios y sistema de pagos protegido
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Comunidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conectamos guatemaltecos con viajeros solidarios
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Rápido y Fácil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Proceso simple desde la solicitud hasta la entrega
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">¡Comienza ahora!</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a la comunidad de Favorón y descubre una nueva forma de conectar Guatemala con el mundo
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => openAuth('register')}>
              Crear mi cuenta
            </Button>
            <Button size="lg" variant="outline" onClick={() => openAuth('login')}>
              Ya tengo cuenta
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img 
              src="/lovable-uploads/f2f6b820-8e72-40a8-a7b5-c4dbaafd6a7e.png" 
              alt="Favorón Logo" 
              className="h-8 brightness-0 invert"
            />
          </div>
          <p className="text-white/80 mb-4">
            Conectando Guatemala con el mundo, un paquete a la vez
          </p>
          <div className="flex justify-center items-center space-x-2 text-sm text-white/60">
            <MapPin className="h-4 w-4" />
            <span>Guatemala, Centroamérica</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onAuth={handleAuth}
      />
    </div>
  );
};

export default Index;
