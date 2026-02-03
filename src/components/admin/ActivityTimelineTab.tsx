import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Download, 
  Phone, 
  Plane, 
  Package, 
  Calendar,
  Filter,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useActivityTimeline, ActivityFilter, StatusFilter, ActivityItem } from '@/hooks/useActivityTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ActivityTimelineTab() {
  const [typeFilter, setTypeFilter] = useState<ActivityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const [visibleCount, setVisibleCount] = useState(50);

  const { activities, isLoading, error, stats } = useActivityTimeline(
    typeFilter, 
    statusFilter, 
    searchQuery, 
    dateRange
  );

  const visibleActivities = useMemo(() => 
    activities.slice(0, visibleCount), 
    [activities, visibleCount]
  );

  const handleExportExcel = () => {
    const exportData = activities.map(item => ({
      'Tipo': item.type === 'trip' ? 'Viaje' : 'Solicitud',
      'Usuario': item.userName,
      'WhatsApp': item.userPhone || 'N/A',
      'Email': item.userEmail || 'N/A',
      'Detalle': item.description,
      'Fecha': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
      'Estado': item.statusLabel,
      'Paquetes Confirmados': item.confirmedPackages ?? '',
      'Paquetes Completados': item.completedPackages ?? '',
      'Monto (Q)': item.amount ?? '',
      'Pagó': item.type === 'package' ? (item.paid ? 'Sí' : 'No') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timeline');
    XLSX.writeFile(wb, `timeline_actividad_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setDateRange({ from: null, to: null });
  };

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || searchQuery || dateRange.from || dateRange.to;

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Error cargando datos: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">Viajes registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{stats.totalPackages}</div>
            <p className="text-xs text-muted-foreground">Solicitudes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground">Resultados filtrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
              <Button onClick={handleExportExcel} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, teléfono, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ActivityFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="trips">Solo Viajes</SelectItem>
                <SelectItem value="packages">Solo Solicitudes</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="in_progress">En Proceso</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="paid">Pagados</SelectItem>
                <SelectItem value="unpaid">Sin Pagar</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM", { locale: es })} - {format(dateRange.to, "dd/MM", { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yy", { locale: es })
                    )
                  ) : (
                    "Fecha"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={{ from: dateRange.from || undefined, to: dateRange.to || undefined }}
                  onSelect={(range) => setDateRange({ 
                    from: range?.from || null, 
                    to: range?.to || null 
                  })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Usuario</TableHead>
                  <TableHead className="w-[120px]">WhatsApp</TableHead>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead className="w-[180px]">Estado</TableHead>
                  <TableHead className="w-[140px]">Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : visibleActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron actividades con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleActivities.map((item) => (
                    <ActivityRow key={`${item.type}-${item.id}`} item={item} formatWhatsAppLink={formatWhatsAppLink} />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Load More */}
          {visibleActivities.length < activities.length && (
            <div className="p-4 text-center border-t">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount(prev => prev + 50)}
              >
                Cargar más ({activities.length - visibleActivities.length} restantes)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityRow({ 
  item, 
  formatWhatsAppLink 
}: { 
  item: ActivityItem; 
  formatWhatsAppLink: (phone: string | null) => string | null;
}) {
  const whatsappLink = formatWhatsAppLink(item.userPhone);
  
  const getBadgeVariant = (color: ActivityItem['statusColor']): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (color) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'destructive': return 'destructive';
      case 'default': return 'default';
      default: return 'secondary';
    }
  };
  
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-sm">{item.userName}</div>
        {item.userEmail && (
          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
            {item.userEmail}
          </div>
        )}
      </TableCell>
      <TableCell>
        {whatsappLink ? (
          <a 
            href={whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Phone className="h-3 w-3" />
            {item.userPhone}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">N/A</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1">
          {item.type === 'trip' ? (
            <>
              <Plane className="h-3 w-3" />
              Viaje
            </>
          ) : (
            <>
              <Package className="h-3 w-3" />
              Pedido
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm">{item.description}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(item.createdAt), 'dd MMM yy', { locale: es })}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={getBadgeVariant(item.statusColor)}>
          {item.statusLabel}
        </Badge>
      </TableCell>
      <TableCell>
        {item.type === 'trip' ? (
          <div className="text-xs space-y-1">
            <div>{item.confirmedPackages || 0} confirmados</div>
            <div>{item.completedPackages || 0} completados</div>
          </div>
        ) : (
          <div className="text-sm">
            {item.amount ? `Q${item.amount.toLocaleString()}` : '-'}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export default ActivityTimelineTab;
