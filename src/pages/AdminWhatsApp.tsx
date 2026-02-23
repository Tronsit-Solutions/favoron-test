import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequireAdmin } from '@/components/auth/RequireAdmin';
import { useAuth } from '@/hooks/useAuth';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  SkipForward,
  Send,
  Eye,
  MessageCircle,
  Phone,
  User,
  TestTube,
  Zap,
  Plus,
  X,
  Edit2
} from 'lucide-react';
import { useWhatsAppLogs, WhatsAppLog } from '@/hooks/useWhatsAppLogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WhatsAppTestButton } from '@/components/admin/WhatsAppTestButton';

const TEMPLATE_OPTIONS = [
  { value: 'all', label: 'Todos los templates' },
  { value: 'welcome_v2', label: 'Welcome v2' },
  { value: 'quote_received_v2', label: 'Quote Received v2' },
  { value: 'package_assigned', label: 'Package Assigned' }
];

// Template content based on WHATSAPP_TEMPLATES.md
const TEMPLATE_CONTENT: Record<string, string> = {
  welcome_v2: `¡{{1}}, ya eres parte de Favoron!  🎉

En Favoron puedes:

🛒 Comprar productos de cualquier parte del mundo

✈️ Ganar dinero extra en tus viajes

Miles de usuarios ya confían en nosotros.

Empieza ahora:👉 www.favoron.app

_Este es un mensaje automático. No responder._`,

  quote_received_v2: `¡Hola {{1}}! 🎉

Has recibido una cotización para tu pedido.

💰 Total: Q{{2}} 

📦 Pedido: {{3}}

Ingresa a tu dashboard para ver los detalles y aceptar:

👉 www.favoron.app

_Este es un mensaje automático. No responder._`,

  package_assigned: `¡Hola {{1}}! 🎉

Se te ha asignado un nuevo paquete para traer.

📍 Destino: {{2}}

💰 Propina: {{3}}

Ingresa a tu dashboard para ver los detalles:

👉 www.favoron.app

_Este es un mensaje automático. No responder._`
};

// Function to render the message with variables substituted
const renderMessage = (templateId: string, variables: Record<string, string> | null, userName?: string | null): string => {
  const template = TEMPLATE_CONTENT[templateId];
  if (!template) return `Template "${templateId}" no tiene contenido definido`;
  
  let message = template;
  
  // First substitute variable 1 with userName if available and not in variables
  if (userName && (!variables || !variables["1"])) {
    message = message.replace(/\{\{1\}\}/g, userName);
  }
  
  // Then substitute all other variables
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
  }
  
  return message;
};

const AdminWhatsApp = () => {
  const navigate = useNavigate();
  const { user, profile, userRole } = useAuth();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  
  // Detail modal
  const [selectedLog, setSelectedLog] = useState<WhatsAppLog | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  
  // Testing mode state
  const [testingMode, setTestingMode] = useState(true);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [togglingMode, setTogglingMode] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [editingWhitelist, setEditingWhitelist] = useState(false);

  // Load testing mode config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'whatsapp_testing_mode')
          .single();
        
        if (data?.value && typeof data.value === 'object') {
          const config = data.value as { enabled?: boolean; whitelist?: string[] };
          setTestingMode(config.enabled ?? true);
          setWhitelist(config.whitelist ?? []);
        }
      } catch (err) {
        console.error('Error loading testing config:', err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfig();
  }, []);

  // Toggle testing mode
  const toggleTestingMode = async () => {
    setTogglingMode(true);
    try {
      const newValue = !testingMode;
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: { enabled: newValue, whitelist },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('key', 'whatsapp_testing_mode');
      
      if (error) throw error;
      
      setTestingMode(newValue);
      toast.success(newValue 
        ? '🧪 Modo de prueba activado - Solo números en whitelist' 
        : '🚀 Modo producción activado - Enviando a todos los usuarios'
      );
    } catch (err) {
      console.error('Error toggling testing mode:', err);
      toast.error('Error al cambiar el modo');
    } finally {
      setTogglingMode(false);
    }
  };

  // Add number to whitelist
  const addNumberToWhitelist = async () => {
    const trimmed = newNumber.trim();
    if (!trimmed) return;
    
    // Ensure it starts with +
    const formattedNumber = trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
    
    if (whitelist.includes(formattedNumber)) {
      toast.error('Este número ya está en la lista');
      return;
    }
    
    const newWhitelist = [...whitelist, formattedNumber];
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: { enabled: testingMode, whitelist: newWhitelist },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('key', 'whatsapp_testing_mode');
      
      if (error) throw error;
      
      setWhitelist(newWhitelist);
      setNewNumber('');
      toast.success(`Número ${formattedNumber} agregado`);
    } catch (err) {
      console.error('Error adding number:', err);
      toast.error('Error al agregar número');
    }
  };

  // Remove number from whitelist
  const removeNumberFromWhitelist = async (numberToRemove: string) => {
    const newWhitelist = whitelist.filter(n => n !== numberToRemove);
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: { enabled: testingMode, whitelist: newWhitelist },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('key', 'whatsapp_testing_mode');
      
      if (error) throw error;
      
      setWhitelist(newWhitelist);
      toast.success(`Número ${numberToRemove} eliminado`);
    } catch (err) {
      console.error('Error removing number:', err);
      toast.error('Error al eliminar número');
    }
  };

  const { logs, stats, loading, hasMore, loadMore, refresh, resendNotification } = useWhatsAppLogs({
    statusFilter,
    templateFilter,
    searchQuery,
    dateFrom,
    dateTo
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const userData = {
    name: profile?.first_name || user?.email?.split('@')[0] || 'Usuario',
    email: user?.email || '',
    role: userRole || 'user',
    avatarUrl: profile?.avatar_url
  };

  const handleResend = async (log: WhatsAppLog) => {
    setResending(log.id);
    await resendNotification(log);
    setResending(null);
  };

  // Get the real delivery status (from Twilio webhook) with priority over initial status
  const getDeliveryStatusBadge = (log: WhatsAppLog) => {
    // If we have a delivery_status from webhook, use that
    const deliveryStatus = log.delivery_status;
    
    if (deliveryStatus) {
      switch (deliveryStatus) {
        case 'delivered':
          return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Entregado
            </Badge>
          );
        case 'read':
          return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Leído
            </Badge>
          );
        case 'undelivered':
        case 'failed':
          return (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <XCircle className="h-3 w-3 mr-1" />
              No entregado
            </Badge>
          );
        case 'sent':
          return (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Send className="h-3 w-3 mr-1" />
              En camino
            </Badge>
          );
        case 'queued':
          return (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200">
              <Send className="h-3 w-3 mr-1" />
              En cola
            </Badge>
          );
      }
    }
    
    // Fallback to original status if no delivery_status yet
    switch (log.status) {
      case 'sent':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Send className="h-3 w-3 mr-1" />
            Aceptado
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case 'skipped':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <SkipForward className="h-3 w-3 mr-1" />
            Omitido
          </Badge>
        );
      default:
        return <Badge variant="secondary">{log.status}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Enviado
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      case 'skipped':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <SkipForward className="h-3 w-3 mr-1" />
            Omitido
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTemplateLabel = (templateId: string) => {
    const template = TEMPLATE_OPTIONS.find(t => t.value === templateId);
    return template?.label || templateId;
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          user={userData}
          onShowProfile={() => navigate('/dashboard?tab=profile')}
          onLogout={handleLogout}
          onShowUserManagement={() => navigate('/admin/control')}
          onGoHome={() => navigate('/dashboard')}
        />

        <main className="container mx-auto px-4 py-6">
          {/* Back button and title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                  Panel de WhatsApp
                </h1>
                <p className="text-sm text-muted-foreground">
                  Historial de notificaciones enviadas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <WhatsAppTestButton />
              <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Testing Mode Toggle */}
          <Card className={`mb-6 border-2 transition-colors ${
            testingMode 
              ? 'border-yellow-300 bg-yellow-50/50' 
              : 'border-green-300 bg-green-50/50'
          }`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {testingMode ? (
                    <TestTube className="h-6 w-6 text-yellow-600" />
                  ) : (
                    <Zap className="h-6 w-6 text-green-600" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {testingMode ? "🧪 Modo de Prueba" : "🚀 Modo Producción"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {testingMode 
                        ? "Solo envía a números en la lista blanca"
                        : "Enviando a todos los usuarios con WhatsApp habilitado"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {testingMode ? 'Prueba' : 'Producción'}
                  </span>
                  <Switch
                    checked={!testingMode}
                    onCheckedChange={() => toggleTestingMode()}
                    disabled={loadingConfig || togglingMode}
                  />
                </div>
              </div>

              {/* Whitelist Editor - Only show in testing mode */}
              {testingMode && (
                <div className="pt-3 border-t border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-800">
                      Números permitidos ({whitelist.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingWhitelist(!editingWhitelist)}
                      className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {editingWhitelist ? 'Cerrar' : 'Editar'}
                    </Button>
                  </div>
                  
                  {/* Current whitelist */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {whitelist.length === 0 ? (
                      <span className="text-sm text-yellow-600 italic">
                        No hay números configurados
                      </span>
                    ) : (
                      whitelist.map((number) => (
                        <Badge 
                          key={number} 
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {number}
                          {editingWhitelist && (
                            <button
                              onClick={() => removeNumberFromWhitelist(number)}
                              className="ml-1 hover:text-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Add new number form */}
                  {editingWhitelist && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="+502 1234 5678"
                        value={newNumber}
                        onChange={(e) => setNewNumber(e.target.value)}
                        className="flex-1 bg-white border-yellow-300 focus:border-yellow-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addNumberToWhitelist();
                          }
                        }}
                      />
                      <Button
                        onClick={addNumberToWhitelist}
                        disabled={!newNumber.trim()}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-700">{stats.sent}</div>
                <p className="text-sm text-green-600">Enviados</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-700">{stats.skipped}</div>
                <p className="text-sm text-yellow-600">Omitidos</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
                <p className="text-sm text-red-600">Fallidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por teléfono o nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="sent">Enviados</SelectItem>
                    <SelectItem value="failed">Fallidos</SelectItem>
                    <SelectItem value="skipped">Omitidos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateFrom ? format(dateFrom, 'dd/MM', { locale: es }) : 'Desde'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom || undefined}
                      onSelect={(d) => setDateFrom(d || null)}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px]">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateTo ? format(dateTo, 'dd/MM', { locale: es }) : 'Hasta'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo || undefined}
                      onSelect={(d) => setDateTo(d || null)}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>

                {(dateFrom || dateTo || statusFilter !== 'all' || templateFilter !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom(null);
                      setDateTo(null);
                      setStatusFilter('all');
                      setTemplateFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Logs table */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay notificaciones registradas
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Envío</TableHead>
                        <TableHead>Entrega</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">
                              {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">
                                  {log.user_name || 'Sin nombre'}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {log.phone_number}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getTemplateLabel(log.template_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status)}
                            {log.error_code && (
                              <div className="text-xs text-red-600 mt-1">
                                Error: {log.error_code}
                              </div>
                            )}
                            {log.skip_reason && (
                              <div className="text-xs text-yellow-600 mt-1 max-w-[150px] truncate" title={log.skip_reason}>
                                {log.skip_reason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.status === 'sent' ? (
                              <>
                                {getDeliveryStatusBadge(log)}
                                {log.delivery_error_code && (
                                  <div className="text-xs text-red-600 mt-1">
                                    Error: {log.delivery_error_code}
                                  </div>
                                )}
                                {log.delivered_at && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(log.delivered_at), 'HH:mm:ss')}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(log.status === 'failed' || log.status === 'skipped') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResend(log)}
                                  disabled={resending === log.id}
                                >
                                  <Send className={`h-4 w-4 ${resending === log.id ? 'animate-pulse' : ''}`} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {hasMore && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? 'Cargando...' : 'Cargar más'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Detail modal */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalle de Notificación</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado de envío</p>
                    {getStatusBadge(selectedLog.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado de entrega</p>
                    {selectedLog.status === 'sent' ? getDeliveryStatusBadge(selectedLog) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="font-medium">{getTemplateLabel(selectedLog.template_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{selectedLog.user_name || 'Sin nombre'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{selectedLog.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enviado</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                    </p>
                  </div>
                  {selectedLog.delivered_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Entregado</p>
                      <p className="font-medium">
                        {format(new Date(selectedLog.delivered_at), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                      </p>
                    </div>
                  )}
                  {selectedLog.twilio_sid && (
                    <div>
                      <p className="text-sm text-muted-foreground">Twilio SID</p>
                      <p className="font-mono text-xs">{selectedLog.twilio_sid}</p>
                    </div>
                  )}
                  {selectedLog.delivery_error_code && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Error de entrega</p>
                      <p className="text-red-600 font-medium">{selectedLog.delivery_error_code}</p>
                    </div>
                  )}
                </div>

                {/* Rendered Message Preview */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mensaje Enviado</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans flex-1">
                        {renderMessage(
                          selectedLog.template_id, 
                          selectedLog.template_variables as Record<string, string> | null,
                          selectedLog.user_name
                        )}
                      </pre>
                    </div>
                  </div>
                </div>

                {selectedLog.template_variables && Object.keys(selectedLog.template_variables).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Variables (raw)</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(selectedLog.template_variables, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Error</p>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                      {selectedLog.error_code && (
                        <p className="text-xs text-red-600 mt-1">Código: {selectedLog.error_code}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedLog.skip_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Razón de omisión</p>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                      <p className="text-sm text-yellow-800">{selectedLog.skip_reason}</p>
                    </div>
                  </div>
                )}

                {(selectedLog.status === 'failed' || selectedLog.status === 'skipped') && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      handleResend(selectedLog);
                      setSelectedLog(null);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Reenviar notificación
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RequireAdmin>
  );
};

export default AdminWhatsApp;
