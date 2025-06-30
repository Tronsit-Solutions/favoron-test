
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, Mail, Phone, CreditCard, AtSign, Edit2, Save, X, Package, Plane, DollarSign, Trophy, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileProps {
  user: any;
  packages: any[];
  trips: any[];
  onUpdateUser: (userData: any) => void;
}

const UserProfile = ({ user, packages, trips, onUpdateUser }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || '',
    phone: user.phone || '',
    idNumber: user.idNumber || ''
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
      idNumber: formData.idNumber
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
      idNumber: user.idNumber || ''
    });
    setIsEditing(false);
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

  const activeRequests = userPackages.filter(pkg => 
    !['delivered', 'rejected'].includes(pkg.status)
  ).length;

  const activeTrips = userTrips.filter(trip => 
    !['completed', 'rejected'].includes(trip.status)
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
      'matched': { label: 'Emparejado', variant: 'default' as const },
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
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>
                  {user.username ? `@${user.username}` : 'Sin nombre de usuario'}
                </CardDescription>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={`${userLevel.color} text-white`}>
                    {userLevel.level}
                  </Badge>
                  <Badge variant="outline">
                    Miembro desde {new Date(user.joinedAt).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant={isEditing ? "destructive" : "outline"}
              onClick={isEditing ? handleCancel : () => setIsEditing(true)}
            >
              {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {isEditing ? "Cancelar" : "Editar Perfil"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* User Level and Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Tu Nivel: {userLevel.level}</span>
          </CardTitle>
          <CardDescription>{userLevel.next}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso al siguiente nivel</span>
              <span>{Math.round(userLevel.progress)}%</span>
            </div>
            <Progress value={userLevel.progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.packagesRequested}</p>
                <p className="text-xs text-muted-foreground">Favorones pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.packagesDelivered}</p>
                <p className="text-xs text-muted-foreground">Favorones entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${stats.totalTips}</p>
                <p className="text-xs text-muted-foreground">Propinas ganadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.packagesCompleted}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <Plane className="h-4 w-4 text-accent" />
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
                        <Plane className="h-4 w-4 text-accent" />
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
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="usuario123"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+502 1234 5678"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">DPI/Pasaporte</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                    placeholder="Número de identificación"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Nombre completo</p>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Correo electrónico</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">{user.phone || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Identificación</p>
                  <p className="text-sm text-muted-foreground">{user.idNumber || 'No registrado'}</p>
                </div>
              </div>

              {user.username && (
                <div className="flex items-center space-x-3">
                  <AtSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nombre de usuario</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
