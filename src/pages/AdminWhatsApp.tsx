import { useState } from 'react';
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
  User
} from 'lucide-react';
import { useWhatsAppLogs, WhatsAppLog } from '@/hooks/useWhatsAppLogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const TEMPLATE_OPTIONS = [
  { value: 'all', label: 'Todos los templates' },
  { value: 'welcome_v2', label: 'Welcome v2' },
  { value: 'quote_received_v2', label: 'Quote Received v2' },
  { value: 'package_assigned', label: 'Package Assigned' }
];

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
            <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

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
                        <TableHead>Estado</TableHead>
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
                              <div className="text-xs text-yellow-600 mt-1">
                                {log.skip_reason}
                              </div>
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
                    <p className="text-sm text-muted-foreground">Estado</p>
                    {getStatusBadge(selectedLog.status)}
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
                    <p className="text-sm text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.created_at), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                    </p>
                  </div>
                  {selectedLog.twilio_sid && (
                    <div>
                      <p className="text-sm text-muted-foreground">Twilio SID</p>
                      <p className="font-mono text-xs">{selectedLog.twilio_sid}</p>
                    </div>
                  )}
                </div>

                {selectedLog.template_variables && Object.keys(selectedLog.template_variables).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Variables</p>
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
