
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plane, Package, Plus, LogOut, User, Bell, MapPin, Home, Phone, Upload } from "lucide-react";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import AddressConfirmationModal from "./AddressConfirmationModal";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [selectedPackageForAddress, setSelectedPackageForAddress] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const { toast } = useToast();

  const handlePackageSubmit = (packageData: any) => {
    const newPackage = {
      id: Date.now(),
      ...packageData,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      userId: user.id
    };
    setPackages(prev => [...prev, newPackage]);
    setShowPackageForm(false);
    toast({
      title: "¡Solicitud enviada!",
      description: "Tu solicitud de paquete está en revisión. Te notificaremos pronto.",
    });
  };

  const handleTripSubmit = (tripData: any) => {
    const newTrip = {
      id: Date.now(),
      ...tripData,
      status: 'active',
      createdAt: new Date().toISOString(),
      userId: user.id
    };
    setTrips(prev => [...prev, newTrip]);
    setShowTripForm(false);
    toast({
      title: "¡Viaje registrado!",
      description: "Tu viaje ha sido registrado exitosamente. Podrás ver solicitudes compatibles pronto.",
    });
  };

  const handleAddressConfirmation = (confirmedAddress: any) => {
    if (selectedPackageForAddress) {
      // Update package with confirmed address and new status
      setPackages(prev => prev.map(pkg => 
        pkg.id === selectedPackageForAddress.id 
          ? { ...pkg, status: 'address_confirmed', confirmedDeliveryAddress: confirmedAddress }
          : pkg
      ));
      setShowAddressConfirmation(false);
      setSelectedPackageForAddress(null);
      toast({
        title: "¡Dirección confirmada!",
        description: "El comprador ya puede proceder con la compra y envío.",
      });
    }
  };

  const mockQuoteAcceptance = (packageId: number) => {
    // Simulate a traveler accepting a quote - this would trigger address confirmation
    const packageItem = packages.find(p => p.id === packageId);
    if (packageItem) {
      // For demo purposes, we'll use a mock trip with delivery address
      const mockTripAddress = {
        streetAddress: "5ta Avenida 12-34, Zona 10",
        cityArea: "Guatemala City, Zona 10",
        hotelAirbnbName: "Hotel Casa Santo Domingo",
        contactNumber: "+502 1234-5678"
      };
      
      setSelectedPackageForAddress({ ...packageItem, deliveryAddress: mockTripAddress });
      setShowAddressConfirmation(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Badge variant="secondary">Pendiente aprobación</Badge>;
      case 'approved':
        return <Badge variant="default">Aprobado</Badge>;
      case 'matched':
        return <Badge className="bg-blue-500">Emparejado</Badge>;
      case 'quote_accepted':
        return <Badge className="bg-purple-500">Cotización aceptada</Badge>;
      case 'address_confirmed':
        return <Badge className="bg-green-500">Dirección confirmada</Badge>;
      case 'awaiting_purchase':
        return <Badge className="bg-yellow-500">Esperando compra</Badge>;
      case 'purchased':
        return <Badge className="bg-indigo-500">Comprado</Badge>;
      case 'shipped_to_traveler':
        return <Badge className="bg-orange-500">Enviado al viajero</Badge>;
      case 'in_transit':
        return <Badge className="bg-orange-500">En tránsito</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Entregado</Badge>;
      case 'active':
        return <Badge variant="default">Activo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Favorón</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </Button>
            
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">¡Hola, {user.name}! 👋</h2>
          <p className="text-muted-foreground">
            Gestiona tus solicitudes de paquetes y viajes desde aquí
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="packages">Mis Paquetes</TabsTrigger>
            <TabsTrigger value="trips">Mis Viajes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowPackageForm(true)}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Package className="h-6 w-6 text-primary" />
                    <CardTitle>Solicitar Paquete</CardTitle>
                  </div>
                  <CardDescription>
                    ¿Necesitas algo del extranjero? Crea una solicitud
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Solicitud
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowTripForm(true)}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Plane className="h-6 w-6 text-accent" />
                    <CardTitle>Registrar Viaje</CardTitle>
                  </div>
                  <CardDescription>
                    ¿Viajas a Guatemala? Ayuda a otros y gana dinero
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Viaje
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Tus últimas solicitudes y viajes</CardDescription>
              </CardHeader>
              <CardContent>
                {packages.length === 0 && trips.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tienes actividad reciente</p>
                    <p className="text-sm">Crea tu primera solicitud o registra un viaje</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...packages, ...trips]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {item.itemLink ? (
                              <Package className="h-5 w-5 text-primary" />
                            ) : (
                              <Plane className="h-5 w-5 text-accent" />
                            )}
                            <div>
                              <p className="font-medium">
                                {item.itemLink ? `Paquete: ${item.itemDescription}` : `Viaje: ${item.fromCity} → ${item.toCity}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(item.createdAt).toLocaleDateString('es-GT')}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Mis Solicitudes de Paquetes</h3>
                <p className="text-muted-foreground">Gestiona todas tus solicitudes de paquetes</p>
              </div>
              <Button onClick={() => setShowPackageForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>

            {packages.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-semibold mb-2">No tienes solicitudes de paquetes</h4>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primera solicitud para comenzar a recibir productos del extranjero
                  </p>
                  <Button onClick={() => setShowPackageForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Solicitud
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {packages.map((pkg) => (
                  <Card key={pkg.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{pkg.itemDescription}</CardTitle>
                          <CardDescription>
                            Precio estimado: ${pkg.estimatedPrice} • Fecha límite: {new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(pkg.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">
                          <strong>Link del producto:</strong>{' '}
                          <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Ver producto
                          </a>
                        </p>
                        
                        {/* Show delivery address if confirmed */}
                        {pkg.confirmedDeliveryAddress && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2 mb-2">
                              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                              <p className="text-sm font-medium text-green-800">Dirección de envío confirmada:</p>
                            </div>
                            <div className="text-sm text-green-700 ml-6">
                              <p>{pkg.confirmedDeliveryAddress.streetAddress}</p>
                              <p>{pkg.confirmedDeliveryAddress.cityArea}</p>
                              {pkg.confirmedDeliveryAddress.hotelAirbnbName && (
                                <p>{pkg.confirmedDeliveryAddress.hotelAirbnbName}</p>
                              )}
                              <p>📞 {pkg.confirmedDeliveryAddress.contactNumber}</p>
                            </div>
                          </div>
                        )}

                        {/* Action buttons based on status */}
                        {pkg.status === 'approved' && (
                          <Button 
                            onClick={() => mockQuoteAcceptance(pkg.id)}
                            className="w-full"
                            variant="outline"
                          >
                            Simular aceptación de cotización (Demo)
                          </Button>
                        )}

                        {pkg.status === 'address_confirmed' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              ✅ <strong>Siguiente paso:</strong> El viajero puede proceder con la compra del producto y enviarlo a la dirección confirmada.
                            </p>
                          </div>
                        )}

                        {pkg.additionalNotes && (
                          <p className="text-sm">
                            <strong>Notas adicionales:</strong> {pkg.additionalNotes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Mis Viajes</h3>
                <p className="text-muted-foreground">Gestiona todos tus viajes registrados</p>
              </div>
              <Button variant="secondary" onClick={() => setShowTripForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Viaje
              </Button>
            </div>

            {trips.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Plane className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-semibold mb-2">No tienes viajes registrados</h4>
                  <p className="text-muted-foreground mb-4">
                    Registra tu próximo viaje a Guatemala y ayuda a otros mientras ganas dinero
                  </p>
                  <Button variant="secondary" onClick={() => setShowTripForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primer Viaje
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {trips.map((trip) => (
                  <Card key={trip.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{trip.fromCity} → {trip.toCity}</CardTitle>
                          <CardDescription>
                            Llegada: {new Date(trip.arrivalDate).toLocaleDateString('es-GT')} • Espacio: {trip.availableSpace} kg
                          </CardDescription>
                        </div>
                        {getStatusBadge(trip.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">
                          <strong>Método de entrega:</strong> {trip.deliveryMethod}
                        </p>

                        {/* Display delivery address */}
                        {trip.deliveryAddress && (
                          <div className="bg-muted/50 border rounded-lg p-3">
                            <div className="flex items-start space-x-2 mb-2">
                              <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm font-medium">Dirección de entrega registrada:</p>
                            </div>
                            <div className="text-sm text-muted-foreground ml-6">
                              <p>{trip.deliveryAddress.streetAddress}</p>
                              <p>{trip.deliveryAddress.cityArea}</p>
                              {trip.deliveryAddress.hotelAirbnbName && (
                                <p>{trip.deliveryAddress.hotelAirbnbName}</p>
                              )}
                              <div className="flex items-center space-x-1 mt-1">
                                <Phone className="h-3 w-3" />
                                <span>{trip.deliveryAddress.contactNumber}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {trip.additionalInfo && (
                          <p className="text-sm">
                            <strong>Información adicional:</strong> {trip.additionalInfo}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Registrado el {new Date(trip.createdAt).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PackageRequestForm
        isOpen={showPackageForm}
        onClose={() => setShowPackageForm(false)}
        onSubmit={handlePackageSubmit}
      />

      <TripForm
        isOpen={showTripForm}
        onClose={() => setShowTripForm(false)}
        onSubmit={handleTripSubmit}
      />

      {selectedPackageForAddress && (
        <AddressConfirmationModal
          isOpen={showAddressConfirmation}
          onClose={() => {
            setShowAddressConfirmation(false);
            setSelectedPackageForAddress(null);
          }}
          onConfirm={handleAddressConfirmation}
          currentAddress={selectedPackageForAddress.deliveryAddress}
          packageDetails={{
            itemDescription: selectedPackageForAddress.itemDescription,
            estimatedPrice: selectedPackageForAddress.estimatedPrice
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
