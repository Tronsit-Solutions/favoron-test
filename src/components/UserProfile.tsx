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
import PersonalInfoDisplay from "./profile/PersonalInfoDisplay";
import BankingInfoForm from "./profile/BankingInfoForm";
import BankingInfoDisplay from "./profile/BankingInfoDisplay";
import TripHistory from "./profile/TripHistory";
import PackageHistory from "./profile/PackageHistory";
import { EmailNotificationSettings } from "./profile/EmailNotificationSettings";
import { WhatsAppNotificationSettings } from "./profile/WhatsAppNotificationSettings";
import ReferralSection from "./profile/ReferralSection";

interface UserProfileProps {
  user: any;
  packages: any[];
  trips: any[];
  onUpdateUser: (userData: any) => void;
}

const UserProfile = ({ user, packages, trips, onUpdateUser }: UserProfileProps) => {
  const [isBankingEditing, setIsBankingEditing] = useState(false);
  const [formData, setFormData] = useState({
    bankAccountHolder: user.bank_account_holder || user.bankAccountHolder || '',
    bankName: user.bank_name || user.bankName || '',
    bankAccountType: user.bank_account_type || user.bankAccountType || '',
    bankAccountNumber: user.bank_account_number || user.bankAccountNumber || '',
    // Database fields
    bank_account_holder: user.bank_account_holder || user.bankAccountHolder || '',
    bank_name: user.bank_name || user.bankName || '',
    bank_account_type: user.bank_account_type || user.bankAccountType || '',
    bank_account_number: user.bank_account_number || user.bankAccountNumber || ''
  });
  const { toast } = useToast();
  const handleBankingSave = () => {
    const updatedUser = {
      ...user,
      bankAccountHolder: formData.bank_account_holder || formData.bankAccountHolder,
      bankName: formData.bank_name || formData.bankName,
      bankAccountType: formData.bank_account_type || formData.bankAccountType,
      bankAccountNumber: formData.bank_account_number || formData.bankAccountNumber,
      // Database fields for proper saving
      bank_account_holder: formData.bank_account_holder || formData.bankAccountHolder,
      bank_name: formData.bank_name || formData.bankName,
      bank_account_type: formData.bank_account_type || formData.bankAccountType,
      bank_account_number: formData.bank_account_number || formData.bankAccountNumber
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
      bankAccountHolder: user.bank_account_holder || user.bankAccountHolder || '',
      bankName: user.bank_name || user.bankName || '',
      bankAccountType: user.bank_account_type || user.bankAccountType || '',
      bankAccountNumber: user.bank_account_number || user.bankAccountNumber || '',
      // Database fields
      bank_account_holder: user.bank_account_holder || user.bankAccountHolder || '',
      bank_name: user.bank_name || user.bankName || '',
      bank_account_type: user.bank_account_type || user.bankAccountType || '',
      bank_account_number: user.bank_account_number || user.bankAccountNumber || ''
    });
    setIsBankingEditing(false);
  };

  // Calculate user stats with correct data structure
  const userPackages = packages.filter(pkg => pkg.user_id === user.id);
  const userTrips = trips.filter(trip => trip.user_id === user.id);
  
  // Calcular paquetes completados (entregados en oficina o de viajes completados)
  const completedPackages = userPackages.filter(pkg => {
    if (pkg.status === 'delivered_to_office') return true;
    if (pkg.matched_trip_id) {
      const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
      return matchedTrip && matchedTrip.status === 'completed_paid';
    }
    return false;
  });

  // Calcular paquetes entregados como viajero (de todos los viajes del usuario)
  const deliveredAsTraverler = packages.filter(pkg => {
    const matchedTrip = userTrips.find(trip => trip.id === pkg.matched_trip_id);
    if (!matchedTrip) return false;
    
    // Incluir paquetes entregados en oficina O de viajes completados y pagados
    return pkg.status === 'delivered_to_office' || matchedTrip.status === 'completed_paid';
  });

  // Calcular propinas totales ganadas
  const totalTips = deliveredAsTraverler.reduce((sum, pkg) => {
    const tip = pkg.quote?.price ? parseFloat(pkg.quote.price) : 0;
    return sum + tip;
  }, 0);
  
  const stats = {
    packagesRequested: userPackages.length, // Todos los paquetes pedidos
    packagesCompleted: completedPackages.length, // Paquetes completados como shopper
    totalTips: totalTips, // Propinas ganadas como viajero
    packagesDelivered: deliveredAsTraverler.length // Paquetes entregados como viajero
  };

  const activeRequests = userPackages.filter(pkg => {
    // Excluir paquetes rechazados, cancelados o entregados en oficina
    if (['delivered_to_office', 'rejected', 'cancelled'].includes(pkg.status)) return false;
    
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
    // Check for Prime status first (trust_level from database)
    const trustLevel = user.trust_level || user.trustLevel;
    if (trustLevel === 'prime') {
      return { 
        level: "Prime", 
        progress: 100, 
        next: "¡Máximo nivel!", 
        color: "bg-purple-500",
        isPrime: true,
        trustLevel: 'prime'
      };
    }

    // Activity-based levels for non-Prime users
    const totalActivity = stats.packagesRequested + stats.packagesCompleted;
    if (totalActivity >= 20) return { 
      level: "Experto", 
      progress: 100, 
      next: "¡Máximo nivel!", 
      color: "bg-yellow-500",
      isPrime: false,
      trustLevel: trustLevel || 'basic'
    };
    if (totalActivity >= 10) return { 
      level: "Avanzado", 
      progress: ((totalActivity - 10) / 10) * 100, 
      next: "10 más para Experto", 
      color: "bg-blue-500",
      isPrime: false,
      trustLevel: trustLevel || 'basic'
    };
    if (totalActivity >= 5) return { 
      level: "Intermedio", 
      progress: ((totalActivity - 5) / 5) * 100, 
      next: "5 más para Avanzado", 
      color: "bg-green-500",
      isPrime: false,
      trustLevel: trustLevel || 'basic'
    };
    return { 
      level: "Principiante", 
      progress: (totalActivity / 5) * 100, 
      next: "5 actividades para Intermedio", 
      color: "bg-gray-500",
      isPrime: false,
      trustLevel: trustLevel || 'basic'
    };
  };

  const userLevel = getUserLevel();

  const getRecentActivity = () => {
    const allActivity = [
      ...userPackages.map(pkg => ({
        type: 'package',
        item: pkg,
        date: pkg.created_at,
        description: `Solicitud: ${pkg.item_description}`,
        status: pkg.status
      })),
      ...userTrips.map(trip => ({
        type: 'trip',
        item: trip,
        date: trip.created_at,
        description: `Viaje: ${trip.from_city} → ${trip.to_city}`,
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
      
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered_to_office': { label: 'Entregado en oficina', variant: 'default' as const },
      'delivered': { label: 'Entregado', variant: 'default' as const },
      'completed_paid': { label: 'Finalizado y Pagado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'active': { label: 'Activo', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4 md:space-y-6 mobile-container">
      <ProfileHeader 
        user={user}
        userLevel={userLevel}
        onUpdateUser={onUpdateUser}
      />

      <TabsList className="grid w-full grid-cols-1 h-auto gap-1 sm:grid-cols-3 sm:h-10 sm:gap-0">
        <TabsTrigger value="overview" className="py-3 sm:py-1.5 text-sm">Mi Perfil</TabsTrigger>
        <TabsTrigger value="package-history" className="py-3 sm:py-1.5 text-sm">Historial de Pedidos</TabsTrigger>
        <TabsTrigger value="trip-history" className="py-3 sm:py-1.5 text-sm">Historial de Viajes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 md:space-y-6">
        <UserLevelCard userLevel={userLevel} />

        <UserStats stats={stats} />

      {/* Current Status and Recent Activity */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="text-lg">Estado Actual</CardTitle>
            <CardDescription className="text-sm">Tus solicitudes y viajes activos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">Solicitudes activas</span>
              </div>
              <Badge variant="outline" className="ml-2">{activeRequests}</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Plane className="h-4 w-4 text-traveler flex-shrink-0" />
                <span className="text-sm">Viajes activos</span>
              </div>
              <Badge variant="outline" className="ml-2">{activeTrips}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              <span>Actividad Reciente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tienes actividad reciente
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start justify-between gap-3 py-2">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
                      {activity.type === 'package' ? (
                        <Package className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <Plane className="h-4 w-4 text-traveler flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-2">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.date).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="text-lg">Información Personal</CardTitle>
          <CardDescription className="text-sm">
            Tu información personal registrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <PersonalInfoDisplay user={user} />
        </CardContent>
      </Card>

      {/* Email Notification Settings */}
      <EmailNotificationSettings 
        userId={user.id}
        emailNotifications={user.email_notifications ?? true}
        emailNotificationPreferences={user.email_notification_preferences || {}}
        onUpdate={(value) => onUpdateUser({ ...user, email_notifications: value })}
        onPreferencesUpdate={(preferences) => onUpdateUser({ ...user, email_notification_preferences: preferences })}
      />

      {/* WhatsApp Notification Settings */}
      <WhatsAppNotificationSettings 
        userId={user.id}
        whatsappNotifications={user.whatsapp_notifications ?? false}
        whatsappNotificationPreferences={user.whatsapp_notification_preferences || {}}
        onUpdate={(value) => onUpdateUser({ ...user, whatsapp_notifications: value })}
        onPreferencesUpdate={(preferences) => onUpdateUser({ ...user, whatsapp_notification_preferences: preferences })}
      />

      {/* Referral Program */}
      <ReferralSection />

      {/* Banking Information */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">Información Bancaria (opcional)</CardTitle>
              <CardDescription className="text-sm">
                {isBankingEditing ? "Edita tu información bancaria" : "Para recibir pagos por Favorones completados"}
              </CardDescription>
            </div>
            {!isBankingEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsBankingEditing(true)} className="self-start sm:self-center">
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {isBankingEditing ? (
            <div className="space-y-4">
              <BankingInfoForm 
                onSave={handleBankingSave}
              />
              <Button 
                variant="outline" 
                onClick={handleBankingCancel}
                className="w-full"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <BankingInfoDisplay />
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
