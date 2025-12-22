import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, AlertTriangle, Eye, Package, User, Phone, Mail, Hash, Loader2, RefreshCcw, Settings, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ClientErrorRow {
  id: string;
  created_at: string;
  message: string;
  name?: string | null;
  type?: string | null;
  severity?: string | null;
  route?: string | null;
  url?: string | null;
  referrer?: string | null;
  stack?: string | null;
  user_id?: string | null;
  browser?: any | null;
  context?: any | null;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
}

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
  const [supportTab, setSupportTab] = useState("packages");
  
  const { toast } = useToast();
  
  // Client errors state
  const [errors, setErrors] = useState<ClientErrorRow[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(false);
  const [errorSearch, setErrorSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [severity, setSeverity] = useState<string>("");
  
  const { user } = useAuth();

  // Filter options
  const filters = [
    { id: "all", label: "Todos", count: packages.length },
    { id: "incidents", label: "Incidencias", count: packages.filter(p => p.incident_flag).length },
    { id: "pending", label: "Pendientes", count: packages.filter(p => p.status === 'pending_approval').length },
    { id: "payment_pending", label: "Pagos pendientes", count: packages.filter(p => p.status === 'payment_pending').length },
  ];

  // Client errors functions
  const severityColor = (s?: string | null) => {
    switch ((s || '').toLowerCase()) {
      case 'fatal':
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'info':
      default: return 'secondary';
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString('es-GT');

  const fetchErrors = async () => {
    setErrorsLoading(true);
    try {
      let query = supabase
        .from('client_errors')
        .select(`
          *,
          profiles!client_errors_user_id_fkey (
            first_name, last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      const { data, error } = await query;
      if (error) throw error;
      setErrors((data || []) as any);
    } catch (e) {
      console.error('Failed to fetch client errors', e);
      setErrors([]);
    } finally {
      setErrorsLoading(false);
    }
  };

  useEffect(() => {
    if (supportTab === 'errors') {
      fetchErrors();
    }
  }, [supportTab]);

  const filteredErrors = errors.filter(e => {
    const matchesSearch = errorSearch
      ? (e.message?.toLowerCase().includes(errorSearch.toLowerCase()) ||
         e.stack?.toLowerCase().includes(errorSearch.toLowerCase()) ||
         e.route?.toLowerCase().includes(errorSearch.toLowerCase()))
      : true;
    const matchesRoute = routeFilter ? (e.route || '').includes(routeFilter) : true;
    const matchesSeverity = severity ? (e.severity || '').toLowerCase() === severity.toLowerCase() : true;
    return matchesSearch && matchesRoute && matchesSeverity;
  });

  // Search function
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchLower = searchTerm.toLowerCase();
      
      // Get all packages with profiles
      const { data: allPackages, error } = await supabase
        .from('packages')
        .select(`
          *,
          profiles!packages_user_id_fkey (
            id, first_name, last_name, email, phone_number
          )
        `);

      if (error) throw error;

      // Filter client-side for better name matching
      const results = (allPackages || []).filter(pkg => {
        // Search in package fields
        const matchesPackageId = pkg.id?.toLowerCase().includes(searchLower);
        const matchesItemDesc = pkg.item_description?.toLowerCase().includes(searchLower);
        const matchesNotes = pkg.additional_notes?.toLowerCase().includes(searchLower);
        
        // Search in user profile fields
        const firstName = pkg.profiles?.first_name?.toLowerCase() || '';
        const lastName = pkg.profiles?.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = pkg.profiles?.email?.toLowerCase() || '';
        const phone = pkg.profiles?.phone_number?.toLowerCase() || '';
        
        const matchesFirstName = firstName.includes(searchLower);
        const matchesLastName = lastName.includes(searchLower);
        const matchesFullName = fullName.includes(searchLower);
        const matchesEmail = email.includes(searchLower);
        const matchesPhone = phone.includes(searchLower);
        
        return matchesPackageId || matchesItemDesc || matchesNotes ||
               matchesFirstName || matchesLastName || matchesFullName || matchesEmail || matchesPhone;
      });
      
      setSearchResults(results);
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

      // Update will come from real-time subscription
      console.log('✅ Package marked as incident - real-time will update UI');
    } catch (error) {
      console.error('Error marking as incident:', error);
    }
  };


  return (
    <div className="space-y-6">
      {/* Support Tabs */}
      <Tabs value={supportTab} onValueChange={setSupportTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages" className="relative">
            Solicitudes
            {packages.filter(p => p.incident_flag).length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full">
                {packages.filter(p => p.incident_flag).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errores del Cliente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xl">Errores del cliente</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchErrors} disabled={errorsLoading}>
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={errorSearch}
                    onChange={(e) => setErrorSearch(e.target.value)}
                    placeholder="Buscar por mensaje, ruta o stack"
                    className="pl-9"
                  />
                </div>
                <Input
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  placeholder="Filtrar por ruta (ej. /auth)"
                />
                <Input
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  placeholder="Severidad (error, warning, info)"
                />
                <Button
                  variant={errorSearch.includes('auth_') || routeFilter.includes('/auth') ? "default" : "outline"}
                  onClick={() => {
                    setErrorSearch('auth_');
                    setRouteFilter('/auth');
                    setSeverity('');
                  }}
                  className="w-full"
                >
                  🔐 Filtro Auth
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Mostrando {filteredErrors.length} de {errors.length} registros
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Fecha</TableHead>
                      <TableHead>Mensaje</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead>Severidad</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Navegador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> Cargando...
                        </TableCell>
                      </TableRow>
                    ) : filteredErrors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No hay errores que coincidan con tu búsqueda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredErrors.map((e) => {
                        const ua = typeof e.browser === 'object' && e.browser?.userAgent ? String(e.browser.userAgent) : '';
                        const shortMsg = e.message?.slice(0, 120) || '';
                        return (
                          <TableRow key={e.id}>
                            <TableCell className="align-top whitespace-nowrap">{formatDate(e.created_at)}</TableCell>
                            <TableCell className="align-top">
                              <div className="font-medium">{shortMsg}{e.message && e.message.length > 120 ? '…' : ''}</div>
                              {e.stack && (
                                <pre className="mt-1 text-xs max-h-28 overflow-auto whitespace-pre-wrap text-muted-foreground">
                                  {e.stack}
                                </pre>
                              )}
                            </TableCell>
                            <TableCell className="align-top">
                              <div>{e.route || '-'}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[240px]">{e.url || ''}</div>
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge variant={severityColor(e.severity)}>{e.severity || 'info'}</Badge>
                            </TableCell>
                            <TableCell className="align-top text-xs">
                              {e.user_id ? (
                                <div>
                                  {e.profiles?.first_name && e.profiles?.last_name ? (
                                    <div className="font-medium">
                                      {e.profiles.first_name} {e.profiles.last_name}
                                    </div>
                                  ) : null}
                                  <span className="font-mono text-muted-foreground">
                                    {e.user_id.slice(0,8)}…
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">anónimo</span>
                              )}
                            </TableCell>
                            <TableCell className="align-top text-xs">
                              {ua ? ua.slice(0,80) + (ua.length > 80 ? '…' : '') : '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Herramientas del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg text-center text-muted-foreground">
                <p>No hay herramientas del sistema disponibles actualmente.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupportTab;