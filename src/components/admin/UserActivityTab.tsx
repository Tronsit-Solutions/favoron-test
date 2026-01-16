import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserActivityReport, UserActivityData } from "@/hooks/useUserActivityReport";
import { Users, Package, Plane, Download, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type FilterType = 'all' | 'shopper_only' | 'traveler_only' | 'both' | 'inactive_traveler';

export const UserActivityTab = () => {
  const { data, summary, isLoading } = useUserActivityReport();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter data
  const filteredData = useMemo(() => {
    let result = data;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(user => user.userType === filterType);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.email?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [data, filterType, searchTerm]);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay datos para exportar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Main users sheet
      const usersSheet = filteredData.map(user => ({
        'Email': user.email || 'N/A',
        'Nombre': user.first_name || '',
        'Apellido': user.last_name || '',
        'Fecha Registro': user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        'Tipo Usuario': getUserTypeLabel(user.userType),
        'Total Solicitudes': user.totalPackages,
        'Solicitudes Completadas': user.completedPackages,
        'Solicitudes Canceladas': user.cancelledPackages,
        'Solicitudes Pendientes': user.pendingPackages,
        'Total Viajes': user.totalTrips,
        'Viajes Completados': user.completedTrips,
        'Viajes con Paquetes': user.tripsWithPackages,
        'Viajes sin Favorones Completados': user.tripsWithoutCompletedPackages,
      }));

      // Summary sheet
      const summarySheet = [{
        'Total Usuarios Activos': summary.totalActiveUsers,
        'Solo Compradores': summary.shoppersOnly,
        'Solo Viajeros (con entregas)': summary.travelersOnly,
        'Ambos Roles': summary.bothRoles,
        'Viajeros Inactivos (sin entregas)': summary.inactiveTravelers,
      }];

      // Inactive travelers sheet (special focus)
      const inactiveTravelers = data.filter(u => u.userType === 'inactive_traveler').map(user => ({
        'Email': user.email || 'N/A',
        'Nombre': `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A',
        'Fecha Registro': user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es }) : 'N/A',
        'Total Viajes Registrados': user.totalTrips,
        'Viajes con Paquetes Asignados': user.tripsWithPackages,
        'Motivo Probable': user.tripsWithPackages === 0 
          ? 'Ningún paquete asignado' 
          : 'Paquetes no completados (cancelados/rechazados)',
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), "Resumen");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersSheet), "Usuarios");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inactiveTravelers), "Viajeros Inactivos");

      const filename = `Actividad_Usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Descarga exitosa",
        description: `Reporte exportado: ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de actividad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Actividad de Usuarios
          </h2>
          <p className="text-muted-foreground">
            Usuarios que han hecho solicitudes o registrado viajes
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={filteredData.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activos</p>
                <p className="text-2xl font-bold">{summary.totalActiveUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solo Compradores</p>
                <p className="text-2xl font-bold text-blue-600">{summary.shoppersOnly}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solo Viajeros</p>
                <p className="text-2xl font-bold text-green-600">{summary.travelersOnly}</p>
              </div>
              <Plane className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ambos Roles</p>
                <p className="text-2xl font-bold text-purple-600">{summary.bothRoles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viajeros Inactivos</p>
                <p className="text-2xl font-bold text-destructive">{summary.inactiveTravelers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                <SelectItem value="shopper_only">Solo compradores</SelectItem>
                <SelectItem value="traveler_only">Solo viajeros (activos)</SelectItem>
                <SelectItem value="both">Ambos roles</SelectItem>
                <SelectItem value="inactive_traveler">Viajeros inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredData.length} de {data.length} usuarios
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Solicitudes</TableHead>
                  <TableHead className="text-center">Viajes</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 100).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'Sin nombre'}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email || 'Sin email'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <UserTypeBadge type={user.userType} />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{user.totalPackages}</span>
                          <div className="flex gap-1 text-xs">
                            <span className="text-green-600">{user.completedPackages}✓</span>
                            <span className="text-destructive">{user.cancelledPackages}✗</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{user.totalTrips}</span>
                          {user.totalTrips > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {user.tripsWithPackages} con paq.
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.created_at 
                          ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredData.length > 100 && (
            <div className="p-4 text-center text-sm text-muted-foreground border-t">
              Mostrando 100 de {filteredData.length} resultados. Exporta a Excel para ver todos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function getUserTypeLabel(type: UserActivityData['userType']): string {
  switch (type) {
    case 'shopper_only': return 'Solo comprador';
    case 'traveler_only': return 'Solo viajero';
    case 'both': return 'Ambos roles';
    case 'inactive_traveler': return 'Viajero inactivo';
    default: return type;
  }
}

function UserTypeBadge({ type }: { type: UserActivityData['userType'] }) {
  switch (type) {
    case 'shopper_only':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Comprador</Badge>;
    case 'traveler_only':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Viajero</Badge>;
    case 'both':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Ambos</Badge>;
    case 'inactive_traveler':
      return <Badge variant="destructive">Viajero Inactivo</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}
