import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateUTC } from '@/lib/formatters';

interface PackageForReception {
  id: string;
  item_description: string;
  status: string;
  created_at: string;
  purchase_origin: string;
  package_destination: string;
  matched_trip_id: string | null;
  user_id: string;
  shopper_name?: string;
  traveler_name?: string;
}

const OperationsReceptionTab = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageForReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          item_description,
          status,
          created_at,
          purchase_origin,
          package_destination,
          matched_trip_id,
          user_id
        `)
        .in('status', ['in_transit', 'received_by_traveler', 'pending_office_confirmation'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch shopper and traveler names
      const packagesWithNames = await Promise.all(
        (data || []).map(async (pkg) => {
          let shopperName = '';
          let travelerName = '';

          // Get shopper name
          const { data: shopperData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', pkg.user_id)
            .single();

          if (shopperData) {
            shopperName = `${shopperData.first_name || ''} ${shopperData.last_name || ''}`.trim();
          }

          // Get traveler name if matched
          if (pkg.matched_trip_id) {
            const { data: tripData } = await supabase
              .from('trips')
              .select('user_id')
              .eq('id', pkg.matched_trip_id)
              .single();

            if (tripData) {
              const { data: travelerData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', tripData.user_id)
                .single();

              if (travelerData) {
                travelerName = `${travelerData.first_name || ''} ${travelerData.last_name || ''}`.trim();
              }
            }
          }

          return {
            ...pkg,
            shopper_name: shopperName,
            traveler_name: travelerName,
          };
        })
      );

      setPackages(packagesWithNames);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Error al cargar paquetes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleConfirmReception = async (packageId: string) => {
    if (!user) return;

    setConfirmingId(packageId);
    try {
      const { error } = await supabase.rpc('admin_confirm_office_delivery', {
        _package_id: packageId,
        _admin_id: user.id,
      });

      if (error) throw error;

      toast.success('Recepción confirmada exitosamente');
      fetchPackages();
    } catch (error: any) {
      console.error('Error confirming reception:', error);
      toast.error(error.message || 'Error al confirmar recepción');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">En tránsito</Badge>;
      case 'received_by_traveler':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">Recibido por viajero</Badge>;
      case 'pending_office_confirmation':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pendiente confirmación</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay paquetes pendientes</h3>
          <p className="text-muted-foreground">
            Todos los paquetes han sido procesados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Paquetes pendientes de confirmación ({packages.length})
        </h2>
        <Button variant="outline" size="sm" onClick={fetchPackages}>
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(pkg.status)}
                    <span className="text-xs text-muted-foreground">
                      {formatDateUTC(pkg.created_at)}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground line-clamp-2">
                    {pkg.item_description}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>📦 Shopper: {pkg.shopper_name || 'Desconocido'}</span>
                    {pkg.traveler_name && (
                      <span>✈️ Viajero: {pkg.traveler_name}</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pkg.purchase_origin} → {pkg.package_destination}
                  </div>
                </div>
                <Button
                  onClick={() => handleConfirmReception(pkg.id)}
                  disabled={confirmingId === pkg.id}
                  className="shrink-0"
                >
                  {confirmingId === pkg.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Recepción
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OperationsReceptionTab;
