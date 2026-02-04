import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Download, 
  Plane, 
  Package, 
  Calendar,
  Filter,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useActivityTimeline, StatusFilter, ActivityItem } from '@/hooks/useActivityTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { TripsTimelineTable } from './timeline/TripsTimelineTable';
import { PackagesTimelineTable } from './timeline/PackagesTimelineTable';

export function ActivityTimelineTab() {
  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'packages'>('trips');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const [tripsVisibleCount, setTripsVisibleCount] = useState(50);
  const [packagesVisibleCount, setPackagesVisibleCount] = useState(50);

  // Fetch all activities (we filter by type client-side now)
  const { activities, isLoading, error, stats } = useActivityTimeline(
    'all', 
    statusFilter, 
    searchQuery, 
    dateRange
  );

  // Separate activities by type
  const tripActivities = useMemo(() => 
    activities.filter(a => a.type === 'trip'), 
    [activities]
  );
  
  const packageActivities = useMemo(() => 
    activities.filter(a => a.type === 'package'), 
    [activities]
  );

  const getChannelLabel = (channel: string | null): string => {
    switch (channel) {
      case 'tiktok': return 'TikTok';
      case 'instagram_facebook_ads': return 'Meta';
      case 'reels': return 'Reels';
      case 'friend_referral': return 'Referidos';
      case 'other': return 'Otro';
      default: return 'Sin respuesta';
    }
  };

  const handleExportExcel = () => {
    const dataToExport = activeSubTab === 'trips' ? tripActivities : packageActivities;
    
    const exportData = dataToExport.map(item => {
      if (item.type === 'trip') {
        return {
          'Tipo': 'Viaje',
          'Usuario': item.userName,
          'WhatsApp': item.userPhone || 'N/A',
          'Canal': getChannelLabel(item.acquisitionChannel),
          'Email': item.userEmail || 'N/A',
          'Ruta': item.description,
          'Fecha Llegada': item.arrivalDate ? format(new Date(item.arrivalDate), 'dd/MM/yyyy') : 'N/A',
          'Fecha Creación': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
          'Estado': item.statusLabel,
          'Paquetes Confirmados': item.confirmedPackages ?? '',
          'Paquetes Completados': item.completedPackages ?? '',
          'Detalle Paquetes': item.fullPackageDescriptions?.join(' | ') || 'Sin paquetes',
        };
      } else {
        return {
          'Tipo': 'Pedido',
          'Usuario': item.userName,
          'WhatsApp': item.userPhone || 'N/A',
          'Canal': getChannelLabel(item.acquisitionChannel),
          'Email': item.userEmail || 'N/A',
          'Descripción': item.fullDescription || item.description,
          'Fecha': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
          'Estado': item.statusLabel,
          'Monto (Q)': item.amount ?? '',
          'Pagó': item.paid ? 'Sí' : 'No'
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    const sheetName = activeSubTab === 'trips' ? 'Viajes' : 'Pedidos';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `timeline_${sheetName.toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setDateRange({ from: null, to: null });
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery || dateRange.from || dateRange.to;

  // Status filter options based on active tab
  const getStatusOptions = () => {
    if (activeSubTab === 'trips') {
      return [
        { value: 'all', label: 'Todos' },
        { value: 'completed', label: 'Completados' },
        { value: 'in_progress', label: 'En Proceso' },
        { value: 'cancelled', label: 'Cancelados' },
      ];
    } else {
      return [
        { value: 'all', label: 'Todos' },
        { value: 'completed', label: 'Completados' },
        { value: 'in_progress', label: 'En Proceso' },
        { value: 'cancelled', label: 'Cancelados' },
        { value: 'paid', label: 'Pagados' },
        { value: 'unpaid', label: 'Sin Pagar' },
      ];
    }
  };

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
            <div className="text-2xl font-bold">
              {activeSubTab === 'trips' ? tripActivities.length : packageActivities.length}
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Sub-tabs and Tables */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'trips' | 'packages')}>
            <div className="border-b px-4 pt-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="trips" className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Viajes
                  <Badge variant="secondary" className="ml-1">
                    {tripActivities.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="packages" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Pedidos
                  <Badge variant="secondary" className="ml-1">
                    {packageActivities.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="trips" className="mt-0">
              <TripsTimelineTable 
                activities={tripActivities}
                isLoading={isLoading}
                visibleCount={tripsVisibleCount}
                onLoadMore={() => setTripsVisibleCount(prev => prev + 50)}
              />
            </TabsContent>
            
            <TabsContent value="packages" className="mt-0">
              <PackagesTimelineTable 
                activities={packageActivities}
                isLoading={isLoading}
                visibleCount={packagesVisibleCount}
                onLoadMore={() => setPackagesVisibleCount(prev => prev + 50)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ActivityTimelineTab;
