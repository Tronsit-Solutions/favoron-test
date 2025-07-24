
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Plane, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileHeader from "./profile/ProfileHeader";
import UserLevelCard from "./profile/UserLevelCard";
import UserStats from "./profile/UserStats";
import PersonalInfoForm from "./profile/PersonalInfoForm";
import PersonalInfoDisplay from "./profile/PersonalInfoDisplay";
import BankingInfoForm from "./profile/BankingInfoForm";
import BankingInfoDisplay from "./profile/BankingInfoDisplay";
import TripHistory from "./profile/TripHistory";
import PackageHistory from "./profile/PackageHistory";

interface UserProfileProps {
  user: any;
  packages: any[];
  trips: any[];
  onUpdateUser: (userData: any) => void;
}

const UserProfile = ({ user, packages, trips, onUpdateUser }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isBankingEditing, setIsBankingEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || '',
    phone: user.phone || '',
    idNumber: user.idNumber || '',
    bankAccountHolder: user.bankAccountHolder || '',
    bankName: user.bankName || '',
    bankAccountType: user.bankAccountType || '',
    bankAccountNumber: user.bankAccountNumber || ''
  });
  const { toast } = useToast();

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "El nombre y apellido son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const updatedUser = {
      ...user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: `${formData.firstName} ${formData.lastName}`,
      username: formData.username,
      phone: formData.phone,
      idNumber: formData.idNumber,
      bankAccountHolder: formData.bankAccountHolder,
      bankName: formData.bankName,
      bankAccountType: formData.bankAccountType,
      bankAccountNumber: formData.bankAccountNumber
    };

    onUpdateUser(updatedUser);
    setIsEditing(false);
    toast({
      title: "¡Perfil actualizado!",
      description: "Tus datos han sido guardados correctamente"
    });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      phone: user.phone || '',
      idNumber: user.idNumber || '',
      bankAccountHolder: user.bankAccountHolder || '',
      bankName: user.bankName || '',
      bankAccountType: user.bankAccountType || '',
      bankAccountNumber: user.bankAccountNumber || ''
    });
    setIsEditing(false);
  };

  const handleBankingSave = () => {
    const updatedUser = {
      ...user,
      bankAccountHolder: formData.bankAccountHolder,
      bankName: formData.bankName,
      bankAccountType: formData.bankAccountType,
      bankAccountNumber: formData.bankAccountNumber
    };

    onUpdateUser(updatedUser);
    setIsBankingEditing(false);
    toast({
      title: "¡Información bancaria actualizada!",
      description: "Tus datos bancarios han sido guardados correctamente"
    });
  };

  const handleBankingCancel = () => {
    setFormData({
      ...formData,
      bankAccountHolder: user.bankAccountHolder || '',
      bankName: user.bankName || '',
      bankAccountType: user.bankAccountType || '',
      bankAccountNumber: user.bankAccountNumber || ''
    });
    setIsBankingEditing(false);
  };

  // Calculate user stats
  const userPackages = packages.filter(pkg => pkg.userId === user.id);
  const userTrips = trips.filter(trip => trip.userId === user.id);
  
  const stats = {
    packagesRequested: userPackages.length,
    packagesCompleted: userPackages.filter(pkg => pkg.status === 'delivered').length,
    totalTips: user.stats?.totalTips || 0,
    packagesDelivered: userTrips.reduce((acc, trip) => {
      const matchedPackages = packages.filter(pkg => pkg.matchedTripId === trip.id && pkg.status === 'delivered');
      return acc + matchedPackages.length;
    }, 0)
  };

  const activeRequests = userPackages.filter(pkg => {
    // Excluir paquetes rechazados o entregados
    if (['delivered', 'rejected'].includes(pkg.status)) return false;
    
    // Excluir paquetes que pertenecen a viajes completados y pagados
    if (pkg.matched_trip_id) {
      const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
      if (matchedTrip && matchedTrip.status === 'completed_paid') return false;
    }
    
    return true;
  }).length;

  const activeTrips = userTrips.filter(trip => 
    !['completed', 'completed_paid', 'rejected'].includes(trip.status)
  ).length;

  const getUserLevel = () => {
    const totalActivity = stats.packagesRequested + stats.packagesCompleted;
    if (totalActivity >= 20) return { level: "Experto", progress: 100, next: "¡Máximo nivel!", color: "bg-yellow-500" };
    if (totalActivity >= 10) return { level: "Avanzado", progress: ((totalActivity - 10) / 10) * 100, next: "10 más para Experto", color: "bg-blue-500" };
    if (totalActivity >= 5) return { level: "Intermedio", progress: ((totalActivity - 5) / 5) * 100, next: "5 más para Avanzado", color: "bg-green-500" };
    return { level: "Principiante", progress: (totalActivity / 5) * 100, next: "5 actividades para Intermedio", color: "bg-gray-500" };
  };

  const userLevel = getUserLevel();

  const getRecentActivity = () => {
    const allActivity = [
      ...userPackages.map(pkg => ({
        type: 'package',
        item: pkg,
        date: pkg.createdAt,
        description: `Solicitud: ${pkg.itemDescription}`,
        status: pkg.status
      })),
      ...userTrips.map(trip => ({
        type: 'trip',
        item: trip,
        date: trip.createdAt,
        description: `Viaje: ${trip.fromCity} → ${trip.toCity}`,
        status: trip.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allActivity.slice(0, 5);
  };

  const recentActivity = getRecentActivity();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Match realizado', variant: 'default' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_accepted': { label: 'Cotización aceptada', variant: 'default' as const },
      'address_confirmed': { label: 'Dirección confirmada', variant: 'default' as const },
      'paid': { label: 'Pagado', variant: 'default' as const },
      'purchased': { label: 'Comprado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered': { label: 'Entregado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'active': { label: 'Activo', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <ProfileHeader 
        user={user}
        userLevel={userLevel}
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onCancel={handleCancel}
      />

      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Mi Perfil</TabsTrigger>
        <TabsTrigger value="package-history">Historial de Pedidos</TabsTrigger>
        <TabsTrigger value="trip-history">Historial de Viajes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <UserLevelCard userLevel={userLevel} />

        <UserStats stats={stats} />

      {/* Current Status and Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
            <CardDescription>Tus solicitudes y viajes activos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm">Solicitudes activas</span>
              </div>
              <Badge variant="outline">{activeRequests}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-traveler" />
                <span className="text-sm">Viajes activos</span>
              </div>
              <Badge variant="outline">{activeTrips}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tienes actividad reciente
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {activity.type === 'package' ? (
                        <Package className="h-4 w-4 text-primary" />
                      ) : (
                        <Plane className="h-4 w-4 text-traveler" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(activity.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            {isEditing ? "Edita tu información personal" : "Tu información personal registrada"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <PersonalInfoForm 
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
            />
          ) : (
            <PersonalInfoDisplay user={user} />
          )}
        </CardContent>
      </Card>

      {/* Banking Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Información Bancaria (opcional)</CardTitle>
              <CardDescription>
                {isBankingEditing ? "Edita tu información bancaria" : "Para recibir pagos por Favorones completados"}
              </CardDescription>
            </div>
            {!isBankingEditing && (
              <Button variant="outline" onClick={() => setIsBankingEditing(true)}>
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBankingEditing ? (
            <div className="space-y-4">
              <BankingInfoForm 
                formData={formData}
                setFormData={setFormData}
                onSave={handleBankingSave}
              />
              <Button 
                variant="outline" 
                onClick={handleBankingCancel}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <BankingInfoDisplay user={user} />
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="package-history">
        <PackageHistory packages={packages} trips={trips} />
      </TabsContent>

      <TabsContent value="trip-history">
        <TripHistory trips={trips} packages={packages} />
      </TabsContent>
    </Tabs>
  );
};

export default UserProfile;
