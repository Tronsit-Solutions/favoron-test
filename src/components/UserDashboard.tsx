
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Plane, DollarSign, Trophy, TrendingUp, Clock } from "lucide-react";

interface UserDashboardProps {
  user: any;
  packages: any[];
  trips: any[];
}

const UserDashboard = ({ user, packages, trips }: UserDashboardProps) => {
  const userPackages = packages.filter(pkg => pkg.userId === user.id);
  const userTrips = trips.filter(trip => trip.userId === user.id);
  
  const stats = {
    packagesRequested: userPackages.length,
    packagesCompleted: userPackages.filter(pkg => pkg.status === 'delivered').length,
    totalTips: user.stats?.totalTips || 0,
    packagesDelivered: userTrips.reduce((acc, trip) => {
      // Count packages matched to this trip that are delivered
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
    if (totalActivity >= 20) return { level: "Experto", progress: 100, next: "¡Máximo nivel!" };
    if (totalActivity >= 10) return { level: "Avanzado", progress: ((totalActivity - 10) / 10) * 100, next: "10 más para Experto" };
    if (totalActivity >= 5) return { level: "Intermedio", progress: ((totalActivity - 5) / 5) * 100, next: "5 más para Avanzado" };
    return { level: "Principiante", progress: (totalActivity / 5) * 100, next: "5 actividades para Intermedio" };
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
    <div className="space-y-6">
      {/* Estadísticas principales */}
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

      {/* Nivel de usuario y progreso */}
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

      {/* Estado actual */}
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

        {/* Actividad reciente */}
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
    </div>
  );
};

export default UserDashboard;
