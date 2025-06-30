
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Package, Users, MapPin, CheckCircle, DollarSign, LogIn } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [user, setUser] = useState<any>(null);

  const handleLogin = (userData: any) => {
    // Add admin role for demo purposes
    const userWithRole = {
      ...userData,
      role: userData.email === 'admin@favaron.com' ? 'admin' : 'user'
    };
    setUser(userWithRole);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const openAuthModal = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-16 pb-24 text-center">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-primary">Favorón</h1>
        </div>
        
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Conectamos viajeros con compradores
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          ¿Necesitas algo del extranjero? ¿Viajas y quieres ganar dinero? 
          Te conectamos para hacer que ambos ganen.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button size="lg" onClick={() => openAuthModal("register")} className="text-lg px-8 py-3">
            <Package className="h-5 w-5 mr-2" />
            Solicitar Paquete
          </Button>
          <Button size="lg" variant="secondary" onClick={() => openAuthModal("register")} className="text-lg px-8 py-3">
            <Plane className="h-5 w-5 mr-2" />
            Registrar Viaje
          </Button>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => openAuthModal("login")} className="text-lg px-6 py-2">
            <LogIn className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* How it Works */}
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
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
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
                <Plane className="h-8 w-8 text-accent" />
                <CardTitle className="text-2xl">Para Viajeros</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <h4 className="font-semibold">Registra tu viaje</h4>
                  <p className="text-gray-600">Comparte detalles de tu viaje y dirección donde pueden enviarte paquetes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <h4 className="font-semibold">Te emparejamos</h4>
                  <p className="text-gray-600">Te conectamos con solicitudes compatibles con tu viaje</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <h4 className="font-semibold">Envía tu cotización</h4>
                  <p className="text-gray-600">Propón tu precio por traer el paquete, incluyendo cualquier costo adicional</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <h4 className="font-semibold">Recibe el paquete</h4>
                  <p className="text-gray-600">El comprador envía el producto a tu hotel/dirección</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">5</div>
                <div>
                  <h4 className="font-semibold">Entrega y gana</h4>
                  <p className="text-gray-600">Entregas el paquete en Guatemala y recibes tu pago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
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

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-3xl font-bold mb-6">¿Listo para comenzar?</h3>
        <p className="text-xl text-gray-600 mb-8">
          Únete a nuestra comunidad y comienza a enviar o traer paquetes hoy mismo
        </p>
        <Button size="lg" onClick={() => openAuthModal("register")} className="text-lg px-8 py-3">
          Crear Cuenta Gratis
        </Button>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Admin demo: admin@favaron.com / password123</p>
        </div>
      </section>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onAuth={handleLogin}
      />
    </div>
  );
};

export default Index;
