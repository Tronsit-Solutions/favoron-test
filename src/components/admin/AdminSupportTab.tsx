import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, AlertTriangle, Eye, Package, User, Phone, Mail, Hash, Loader2, RefreshCcw, Settings, Database, CheckCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";

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
  const { rates } = usePlatformFeesContext();
  
  // Client errors state
  const [errors, setErrors] = useState<ClientErrorRow[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(false);
  const [errorSearch, setErrorSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [severity, setSeverity] = useState<string>("");
  const [errorsSubTab, setErrorsSubTab] = useState("user_reports");
  
  const { user } = useAuth();

  // Filter options
  const incidentActiveCount = packages.filter(p => p.incident_flag && p.incident_status !== 'resolved').length;
  const incidentResolvedCount = packages.filter(p => p.incident_flag && p.incident_status === 'resolved').length;
  
  const filters = [
    { id: "all", label: "Todos", count: packages.length },
    { id: "incidents_active", label: "Incidencias Activas", count: incidentActiveCount },
    { id: "incidents_resolved", label: "Resueltas", count: incidentResolvedCount },
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

  const userReports = filteredErrors.filter(e => e.type === 'user_report');
  const systemErrors = filteredErrors.filter(e => e.type !== 'user_report');

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
      case "incidents_active":
        return packagesToFilter.filter(p => p.incident_flag && p.incident_status !== 'resolved');
      case "incidents_resolved":
        return packagesToFilter.filter(p => p.incident_flag && p.incident_status === 'resolved');
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
    // This is now a simple mark - the modal-based flow is handled in AdminActionsModal
    // This is kept for backward compatibility but should ideally open the actions modal
    try {
      const newEntry = {
        action: 'marked',
        timestamp: new Date().toISOString(),
        admin_id: user?.id || '',
        admin_name: 'Admin',
        reason: 'Marcado desde pestaña de soporte',
      };

      const { error } = await supabase
        .from('packages')
        .update({ 
          incident_flag: true, 
          incident_status: 'active',
          incident_history: [newEntry],
        })
        .eq('id', packageId);

      if (error) throw error;

      // Log the action
      if (user) {
        await supabase.rpc('log_admin_action', {
          _package_id: packageId,
          _admin_id: user.id,
          _action_type: 'incident_marked',
          _action_description: 'Paquete marcado como incidencia desde soporte'
        });
      }

      console.log('✅ Package marked as incident with history');
    } catch (error) {
      console.error('Error marking as incident:', error);
    }
  };


  // State for Prime service fee recalculation tool
  const [isRecalculatingPrimeQuotes, setIsRecalculatingPrimeQuotes] = useState(false);
  const [isPreviewingPrimeQuotes, setIsPreviewingPrimeQuotes] = useState(false);
  const [primeQuoteResults, setPrimeQuoteResults] = useState<{ fixed: number; total: number } | null>(null);
  const [primeQuotePreview, setPrimeQuotePreview] = useState<Array<{
    packageId: string;
    userName: string;
    itemDescription: string;
    currentServiceFee: number;
    expectedServiceFee: number;
    currentDeliveryFee: number;
    expectedDeliveryFee: number;
    price: number;
    currentTotal: number;
    newTotal: number;
    errorType: 'serviceFee' | 'deliveryFee' | 'both';
    cityArea?: string;
  }> | null>(null);

  // Helper to check if cityArea is Guatemala City
  const isGuatemalaCityArea = (cityArea?: string): boolean => {
    if (!cityArea) return false;
    const normalized = cityArea.toLowerCase().trim();
    
    const excludedAreas = [
      'mixco', 'villa nueva', 'villanueva', 'villa canales', 'villacanales',
      'san miguel petapa', 'petapa', 'amatitlan', 'amatitlán', 'fraijanes',
      'santa catarina pinula', 'chinautla', 'san jose pinula', 'san josé pinula',
      'palencia', 'san pedro ayampuc', 'san juan sacatepequez', 'san juan sacatepéquez',
      'condado naranjo', 'san cristobal', 'san cristóbal',
      'carretera a el salvador', 'carretera el salvador',
    ];
    
    if (excludedAreas.some(excluded => normalized.includes(excluded))) {
      return false;
    }
    
    const guatemalaCityPatterns = [
      /^guatemala$/, /^guatemala\s*city$/i, /^ciudad\s*de\s*guatemala/i,
      /^guatemala\s*,?\s*guatemala$/i, /^guatemala\s+zona\s*\d+/i,
      /zona\s*\d+.*ciudad\s*de\s*guatemala/i, /^zona\s*\d+.*guatemala$/i, /^guate$/i,
    ];
    
    return guatemalaCityPatterns.some(pattern => pattern.test(normalized));
  };

  // Calculate expected delivery fee for Prime user using context
  const { getDeliveryFee: getContextDeliveryFee } = usePlatformFeesContext();
  const getExpectedDeliveryFee = (deliveryMethod?: string, cityArea?: string): number => {
    if (deliveryMethod === 'pickup' || !deliveryMethod) return 0;
    // Use context for Prime users
    return getContextDeliveryFee(deliveryMethod, 'prime', cityArea);
  };

  // Function to preview incorrectly calculated Prime quotes
  const previewPrimeQuotes = async () => {
    setIsPreviewingPrimeQuotes(true);
    setPrimeQuotePreview(null);
    setPrimeQuoteResults(null);
    
    try {
      console.log('🔍 [Prime Preview] Starting preview scan...');
      
      // Get all Prime users
      const { data: primeUsers, error: primeError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('trust_level', 'prime');
      
      if (primeError) throw primeError;
      
      const primeUserMap = new Map(primeUsers?.map(u => [u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Sin nombre']) || []);
      const primeUserIds = Array.from(primeUserMap.keys());
      
      console.log(`🔍 [Prime Preview] Found ${primeUserIds.length} Prime users:`, primeUsers?.map(u => `${u.first_name} ${u.last_name}`));
      
      if (primeUserIds.length === 0) {
        toast({ title: 'No hay usuarios Prime', description: 'No se encontraron usuarios con nivel Prime.' });
        return;
      }
      
      // Get packages for Prime users that have quotes
      const { data: packages, error: pkgError } = await supabase
        .from('packages')
        .select('id, user_id, quote, item_description, delivery_method, confirmed_delivery_address')
        .in('user_id', primeUserIds)
        .not('quote', 'is', null);
      
      if (pkgError) throw pkgError;
      
      console.log(`🔍 [Prime Preview] Found ${packages?.length || 0} packages with quotes from Prime users`);
      
      const affectedPackages: typeof primeQuotePreview = [];
      
      for (const pkg of packages || []) {
        const quote = pkg.quote as any;
        if (!quote?.price) {
          console.log(`⏭️ [Prime Preview] Skipping package ${pkg.id.slice(0,8)}: no price in quote`);
          continue;
        }
        
        const price = parseFloat(String(quote.price));
        const currentServiceFee = parseFloat(String(quote.serviceFee || '0'));
        const currentDeliveryFee = parseFloat(String(quote.deliveryFee || '0'));
        const currentTotal = parseFloat(String(quote.totalPrice || '0'));
        
        // Use dynamic rates from DB for Prime users
        const expectedServiceFee = price * rates.prime;
        const wrongServiceFee = price * rates.standard; // What a non-Prime user would pay
        
        // Get cityArea from confirmed_delivery_address
        const confirmedAddress = pkg.confirmed_delivery_address as any;
        const cityArea = confirmedAddress?.cityArea || confirmedAddress?.city || '';
        const deliveryMethod = pkg.delivery_method || 'pickup';
        
        const expectedDeliveryFee = getExpectedDeliveryFee(deliveryMethod, cityArea);
        
        // Check for errors
        const hasServiceFeeError = Math.abs(currentServiceFee - wrongServiceFee) < 1;
        const hasDeliveryFeeError = deliveryMethod === 'delivery' && 
          Math.abs(currentDeliveryFee - expectedDeliveryFee) > 0.01;
        
        console.log(`📦 [Prime Preview] Package ${pkg.id.slice(0,8)}:`, {
          price,
          currentServiceFee,
          expectedServiceFee,
          hasServiceFeeError,
          deliveryMethod,
          cityArea,
          currentDeliveryFee,
          expectedDeliveryFee,
          hasDeliveryFeeError,
        });
        
        if (hasServiceFeeError || hasDeliveryFeeError) {
          const correctedServiceFee = hasServiceFeeError ? expectedServiceFee : currentServiceFee;
          const correctedDeliveryFee = hasDeliveryFeeError ? expectedDeliveryFee : currentDeliveryFee;
          const newTotal = price + correctedServiceFee + correctedDeliveryFee;
          
          let errorType: 'serviceFee' | 'deliveryFee' | 'both' = 'serviceFee';
          if (hasServiceFeeError && hasDeliveryFeeError) errorType = 'both';
          else if (hasDeliveryFeeError) errorType = 'deliveryFee';
          
          affectedPackages.push({
            packageId: pkg.id,
            userName: primeUserMap.get(pkg.user_id) || 'Desconocido',
            itemDescription: pkg.item_description || 'Sin descripción',
            currentServiceFee,
            expectedServiceFee: correctedServiceFee,
            currentDeliveryFee,
            expectedDeliveryFee: correctedDeliveryFee,
            price,
            currentTotal,
            newTotal,
            errorType,
            cityArea,
          });
          
          console.log(`⚠️ [Prime Preview] Package ${pkg.id.slice(0,8)} NEEDS CORRECTION (${errorType}):`, {
            user: primeUserMap.get(pkg.user_id),
            item: pkg.item_description?.slice(0, 50),
            serviceFee: hasServiceFeeError ? `${currentServiceFee} → ${correctedServiceFee}` : 'OK',
            deliveryFee: hasDeliveryFeeError ? `${currentDeliveryFee} → ${correctedDeliveryFee}` : 'OK',
            total: `${currentTotal} → ${newTotal}`,
            cityArea,
          });
        }
      }
      
      setPrimeQuotePreview(affectedPackages);
      
      console.log(`✅ [Prime Preview] Scan complete. Found ${affectedPackages.length} packages needing correction`);
      
      if (affectedPackages.length === 0) {
        toast({ 
          title: 'Sin correcciones necesarias', 
          description: `Se revisaron ${packages?.length || 0} quotes Prime, ninguno necesitaba corrección.` 
        });
      } else {
        const serviceFeeErrors = affectedPackages.filter(p => p.errorType === 'serviceFee' || p.errorType === 'both').length;
        const deliveryFeeErrors = affectedPackages.filter(p => p.errorType === 'deliveryFee' || p.errorType === 'both').length;
        toast({ 
          title: `${affectedPackages.length} paquetes afectados`, 
          description: `Service Fee: ${serviceFeeErrors}, Delivery Fee: ${deliveryFeeErrors}. Revisa el preview.` 
        });
      }
    } catch (error) {
      console.error('❌ [Prime Preview] Error:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudieron obtener los quotes Prime.',
        variant: 'destructive'
      });
    } finally {
      setIsPreviewingPrimeQuotes(false);
    }
  };

  // Function to execute the correction on previewed packages
  const executePrimeQuoteCorrection = async () => {
    if (!primeQuotePreview || primeQuotePreview.length === 0) {
      toast({ title: 'Sin paquetes para corregir', description: 'Primero ejecuta el preview.', variant: 'destructive' });
      return;
    }
    
    setIsRecalculatingPrimeQuotes(true);
    
    try {
      console.log(`🔧 [Prime Fix] Starting correction of ${primeQuotePreview.length} packages...`);
      
      let fixedCount = 0;
      
      for (const pkg of primeQuotePreview) {
        // Get current package data
        const { data: currentPkg, error: fetchError } = await supabase
          .from('packages')
          .select('quote')
          .eq('id', pkg.packageId)
          .single();
        
        if (fetchError || !currentPkg) {
          console.error(`❌ [Prime Fix] Failed to fetch package ${pkg.packageId}:`, fetchError);
          continue;
        }
        
        const quote = currentPkg.quote as any;
        
        const updatedQuote = {
          ...quote,
          serviceFee: pkg.expectedServiceFee.toFixed(2),
          deliveryFee: pkg.expectedDeliveryFee.toFixed(2),
          totalPrice: pkg.newTotal.toFixed(2),
          serviceFeeRate: 0.25,
          manuallyEdited: true,
          primeRecalculatedAt: new Date().toISOString(),
          primeRecalculatedBy: user?.id || 'unknown',
          primeRecalculationNote: `Corrected ${pkg.errorType}: serviceFee=${pkg.expectedServiceFee}, deliveryFee=${pkg.expectedDeliveryFee}`
        };
        
        const { error: updateError } = await supabase
          .from('packages')
          .update({ quote: updatedQuote })
          .eq('id', pkg.packageId);
        
        if (!updateError) {
          fixedCount++;
          console.log(`✅ [Prime Fix] Fixed package ${pkg.packageId.slice(0,8)} (${pkg.errorType}):`, {
            serviceFee: `${pkg.currentServiceFee} → ${pkg.expectedServiceFee}`,
            deliveryFee: `${pkg.currentDeliveryFee} → ${pkg.expectedDeliveryFee}`,
            total: `${pkg.currentTotal} → ${pkg.newTotal}`
          });
        } else {
          console.error(`❌ [Prime Fix] Failed to update package ${pkg.packageId}:`, updateError);
        }
      }
      
      setPrimeQuoteResults({ fixed: fixedCount, total: primeQuotePreview.length });
      setPrimeQuotePreview(null); // Clear preview after execution
      
      console.log(`✅ [Prime Fix] Correction complete. Fixed ${fixedCount}/${primeQuotePreview.length} packages`);
      
      toast({ 
        title: 'Corrección completada', 
        description: `Se corrigieron ${fixedCount} de ${primeQuotePreview.length} quotes Prime.` 
      });
    } catch (error) {
      console.error('❌ [Prime Fix] Error:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudieron corregir los quotes Prime.',
        variant: 'destructive'
      });
    } finally {
      setIsRecalculatingPrimeQuotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Support Tabs */}
      <Tabs value={supportTab} onValueChange={setSupportTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="packages" className="relative">
            Solicitudes
            {packages.filter(p => p.incident_flag && p.incident_status !== 'resolved').length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full">
                {packages.filter(p => p.incident_flag && p.incident_status !== 'resolved').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errores del Cliente
          </TabsTrigger>
          <TabsTrigger value="system">
            Sistema
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
          <TabsList className="grid w-full grid-cols-5">
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
                    {activeFilter === 'incidents_active' && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Incidencias Activas</span>
                      </Badge>
                    )}
                    {activeFilter === 'incidents_resolved' && (
                      <Badge className="flex items-center space-x-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Incidencias Resueltas</span>
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
                                {pkg.incident_flag && pkg.incident_status === 'resolved' ? (
                                  <Badge className="flex items-center space-x-1 bg-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Resuelta</span>
                                  </Badge>
                                ) : pkg.incident_flag ? (
                                  <Badge variant="destructive" className="flex items-center space-x-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Incidencia</span>
                                  </Badge>
                                ) : null}
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

              <Tabs value={errorsSubTab} onValueChange={setErrorsSubTab}>
                <TabsList>
                  <TabsTrigger value="user_reports" className="gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    Reportes de Usuarios
                    {userReports.length > 0 && (
                      <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{userReports.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="system_errors" className="gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    Errores del Sistema
                    {systemErrors.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{systemErrors.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="user_reports">
                  <div className="text-sm text-muted-foreground mb-2">
                    Mostrando {userReports.length} reportes de usuarios
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[160px]">Fecha</TableHead>
                          <TableHead>Mensaje del usuario</TableHead>
                          <TableHead>Sección</TableHead>
                          <TableHead>Ruta</TableHead>
                          <TableHead>Usuario</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {errorsLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                              <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> Cargando...
                            </TableCell>
                          </TableRow>
                        ) : userReports.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                              No hay reportes de usuarios.
                            </TableCell>
                          </TableRow>
                        ) : (
                          userReports.map((e) => {
                            const ctx = typeof e.context === 'object' && e.context ? e.context as any : {};
                            return (
                              <TableRow key={e.id}>
                                <TableCell className="align-top whitespace-nowrap">{formatDate(e.created_at)}</TableCell>
                                <TableCell className="align-top">
                                  <div className="font-medium text-foreground">{e.message}</div>
                                  {ctx.hasScreenshot && (
                                    <Badge variant="outline" className="mt-1 text-xs">📷 Con screenshot</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="align-top">
                                  <Badge variant="secondary">{ctx.section || 'General'}</Badge>
                                </TableCell>
                                <TableCell className="align-top">
                                  <div>{e.route || '-'}</div>
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
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="system_errors">
                  <div className="text-sm text-muted-foreground mb-2">
                    Mostrando {systemErrors.length} errores del sistema
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
                        ) : systemErrors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                              No hay errores del sistema.
                            </TableCell>
                          </TableRow>
                        ) : (
                          systemErrors.map((e) => {
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
                </TabsContent>
              </Tabs>
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
              {/* Prime Quote Recalculation Tool */}
              <div className="p-4 border rounded-lg space-y-4">
                <div>
                  <h4 className="font-medium">Recalcular Quotes de usuarios Prime</h4>
                  <p className="text-sm text-muted-foreground">
                    Corrige quotes de usuarios Prime con errores en Service Fee y Delivery Fee según los valores configurados en Admin Control.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={previewPrimeQuotes} 
                    disabled={isPreviewingPrimeQuotes || isRecalculatingPrimeQuotes}
                    variant="outline"
                  >
                    {isPreviewingPrimeQuotes ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Escaneando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        1. Preview Afectados
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={executePrimeQuoteCorrection} 
                    disabled={isRecalculatingPrimeQuotes || !primeQuotePreview || primeQuotePreview.length === 0}
                    variant="default"
                  >
                    {isRecalculatingPrimeQuotes ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Corrigiendo...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        2. Ejecutar Corrección ({primeQuotePreview?.length || 0})
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Preview Table */}
                {primeQuotePreview && primeQuotePreview.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2 border-b">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        ⚠️ {primeQuotePreview.length} paquetes con errores en quotes Prime
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Service Fee: {primeQuotePreview.filter(p => p.errorType === 'serviceFee' || p.errorType === 'both').length} | 
                        Delivery Fee: {primeQuotePreview.filter(p => p.errorType === 'deliveryFee' || p.errorType === 'both').length}
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Error</TableHead>
                          <TableHead className="text-right">Service Fee</TableHead>
                          <TableHead className="text-right">Delivery Fee</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {primeQuotePreview.map((pkg) => (
                          <TableRow key={pkg.packageId}>
                            <TableCell className="font-medium">{pkg.userName}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={pkg.itemDescription}>
                              {pkg.itemDescription.slice(0, 30)}{pkg.itemDescription.length > 30 ? '...' : ''}
                            </TableCell>
                            <TableCell>
                              <Badge variant={pkg.errorType === 'both' ? 'destructive' : 'secondary'} className="text-xs">
                                {pkg.errorType === 'serviceFee' && 'Service'}
                                {pkg.errorType === 'deliveryFee' && 'Delivery'}
                                {pkg.errorType === 'both' && 'Ambos'}
                              </Badge>
                              {pkg.cityArea && (
                                <div className="text-xs text-muted-foreground mt-1">{pkg.cityArea}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {(pkg.errorType === 'serviceFee' || pkg.errorType === 'both') ? (
                                <div>
                                  <span className="text-destructive">Q{pkg.currentServiceFee.toFixed(0)}</span>
                                  <span className="mx-1">→</span>
                                  <span className="text-green-600">Q{pkg.expectedServiceFee.toFixed(0)}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Q{pkg.currentServiceFee.toFixed(0)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {(pkg.errorType === 'deliveryFee' || pkg.errorType === 'both') ? (
                                <div>
                                  <span className="text-destructive">Q{pkg.currentDeliveryFee.toFixed(0)}</span>
                                  <span className="mx-1">→</span>
                                  <span className="text-green-600">Q{pkg.expectedDeliveryFee.toFixed(0)}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Q{pkg.currentDeliveryFee.toFixed(0)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium">
                              <span className="text-destructive">Q{pkg.currentTotal.toFixed(0)}</span>
                              <span className="mx-1">→</span>
                              <span className="text-green-600">Q{pkg.newTotal.toFixed(0)}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="bg-muted px-3 py-2 border-t text-sm">
                      <strong>Total ahorro para clientes:</strong> Q{primeQuotePreview.reduce((sum, p) => sum + (p.currentTotal - p.newTotal), 0).toFixed(2)}
                    </div>
                  </div>
                )}
                
                {primeQuotePreview && primeQuotePreview.length === 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-sm text-green-800 dark:text-green-200">
                    ✅ No se encontraron paquetes con errores. Todos los quotes Prime están correctos.
                  </div>
                )}
                
                {primeQuoteResults && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <p>
                      <strong>Resultado:</strong> Se corrigieron {primeQuoteResults.fixed} de {primeQuoteResults.total} quotes.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupportTab;