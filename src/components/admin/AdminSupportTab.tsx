import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, AlertTriangle, Eye, Package, User, Phone, Mail, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminSupportTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onOpenActionsModal: (pkg: any) => void;
}

const AdminSupportTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onOpenActionsModal 
}: AdminSupportTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  // Filter options
  const filters = [
    { id: "all", label: "Todos", count: packages.length },
    { id: "incidents", label: "Incidencias", count: packages.filter(p => p.incident_flag).length },
    { id: "pending", label: "Pendientes", count: packages.filter(p => p.status === 'pending_approval').length },
    { id: "payment_pending", label: "Pagos pendientes", count: packages.filter(p => p.status === 'payment_pending').length },
  ];

  // Search function
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search in packages and join with profiles
      const { data: results, error } = await supabase
        .from('packages')
        .select(`
          *,
          profiles!packages_user_id_fkey (
            id, first_name, last_name, email, phone_number
          )
        `)
        .or(`
          id.ilike.%${searchTerm}%,
          item_description.ilike.%${searchTerm}%,
          additional_notes.ilike.%${searchTerm}%,
          user_id.in.(
            select id from profiles where 
            first_name.ilike.%${searchTerm}% or 
            last_name.ilike.%${searchTerm}% or 
            email.ilike.%${searchTerm}% or 
            phone_number.ilike.%${searchTerm}%
          )
        `);

      if (error) throw error;
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Filter packages based on active filter
  const getFilteredPackages = () => {
    const packagesToFilter = searchTerm ? searchResults : packages;
    
    switch (activeFilter) {
      case "incidents":
        return packagesToFilter.filter(p => p.incident_flag);
      case "pending":
        return packagesToFilter.filter(p => p.status === 'pending_approval');
      case "payment_pending":
        return packagesToFilter.filter(p => p.status === 'payment_pending');
      default:
        return packagesToFilter;
    }
  };

  const filteredPackages = getFilteredPackages();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Match realizado', variant: 'default' as const },
      'payment_pending': { label: 'Pago pendiente', variant: 'warning' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const markAsIncident = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ incident_flag: true })
        .eq('id', packageId);

      if (error) throw error;

      // Log the action
      if (user) {
        await supabase.rpc('log_admin_action', {
          _package_id: packageId,
          _admin_id: user.id,
          _action_type: 'incident_marked',
          _action_description: 'Paquete marcado como incidencia'
        });
      }

      // Trigger a refresh (this would normally come from a real-time update)
      window.location.reload();
    } catch (error) {
      console.error('Error marking as incident:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscador General</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, nombre, teléfono, email, o descripción del producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
            </div>
            <Button onClick={performSearch} disabled={isSearching}>
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>💡 Puedes buscar por:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline"><Hash className="h-3 w-3 mr-1" />ID del pedido</Badge>
              <Badge variant="outline"><User className="h-3 w-3 mr-1" />Nombre del usuario</Badge>
              <Badge variant="outline"><Phone className="h-3 w-3 mr-1" />Teléfono</Badge>
              <Badge variant="outline"><Mail className="h-3 w-3 mr-1" />Email</Badge>
              <Badge variant="outline"><Package className="h-3 w-3 mr-1" />Descripción del producto</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList className="grid w-full grid-cols-4">
          {filters.map(filter => (
            <TabsTrigger key={filter.id} value={filter.id} className="relative">
              {filter.label}
              {filter.count > 0 && (
                <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full">
                  {filter.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {searchTerm ? `Resultados de búsqueda (${filteredPackages.length})` : `${filters.find(f => f.id === activeFilter)?.label} (${filteredPackages.length})`}
                </span>
                {activeFilter === 'incidents' && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Incidencias Activas</span>
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPackages.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'No hay solicitudes en esta categoría'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPackages.map(pkg => (
                    <div key={pkg.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {pkg.incident_flag && (
                              <Badge variant="destructive" className="flex items-center space-x-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Incidencia</span>
                              </Badge>
                            )}
                            {getStatusBadge(pkg.status)}
                            <Badge variant="outline" className="text-xs">
                              #{pkg.id.slice(0, 8)}
                            </Badge>
                          </div>
                          
                          <div>
                            <p className="font-medium">{pkg.item_description}</p>
                            <p className="text-sm text-muted-foreground">
                              Precio: ${pkg.estimated_price} • 
                              {pkg.profiles ? 
                                ` ${pkg.profiles.first_name} ${pkg.profiles.last_name} (${pkg.profiles.email})` :
                                ` Usuario: ${pkg.user_id.slice(0, 8)}`
                              }
                            </p>
                            {pkg.profiles?.phone_number && (
                              <p className="text-xs text-muted-foreground">
                                📞 {pkg.profiles.phone_number}
                              </p>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Creado: {new Date(pkg.created_at).toLocaleDateString('es-GT')} • 
                            Actualizado: {new Date(pkg.updated_at).toLocaleDateString('es-GT')}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onViewPackageDetail(pkg)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                          
                          <Button 
                            size="sm" 
                            onClick={() => onOpenActionsModal(pkg)}
                          >
                            Acciones
                          </Button>

                          {!pkg.incident_flag && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => markAsIncident(pkg.id)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Marcar Incidencia
                            </Button>
                          )}
                        </div>
                      </div>

                      {pkg.internal_notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                          <p className="text-xs font-medium text-yellow-800">Nota interna del admin:</p>
                          <p className="text-xs text-yellow-700">{pkg.internal_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupportTab;