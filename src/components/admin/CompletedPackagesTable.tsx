import React, { useMemo } from "react";
import { Package } from "@/types";
import { formatDate, formatFullName } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletedPackagesTableProps {
  packages: Package[];
}

const CompletedPackagesTable = ({ packages }: CompletedPackagesTableProps) => {
  const completedPackages = useMemo(() => {
    return packages
      .filter((pkg) => pkg.status === "completed")
      .map((pkg) => {
        const createdDate = new Date(pkg.created_at);
        const completedDate = new Date(pkg.updated_at);
        const daysElapsed = Math.ceil(
          (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...pkg,
          daysElapsed,
          createdDate,
          completedDate,
        };
      })
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  }, [packages]);

  const stats = useMemo(() => {
    if (completedPackages.length === 0) return { totalCompleted: 0, avgDays: 0 };
    
    const totalDays = completedPackages.reduce((sum, pkg) => sum + pkg.daysElapsed, 0);
    const avgDays = Math.round(totalDays / completedPackages.length);
    
    return {
      totalCompleted: completedPackages.length,
      avgDays,
    };
  }, [completedPackages]);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Q${numAmount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio de Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDays} días</div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Paquetes Completados</CardTitle>
        </CardHeader>
        <CardContent>
          {completedPackages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay paquetes completados para mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Shopper</TableHead>
                    <TableHead>Viajero</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Fecha Completado</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {formatDate(pkg.created_at)}
                      </TableCell>
                      <TableCell>
                        Usuario #{pkg.user_id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        {pkg.matched_trip_id ? `Viajero #${pkg.matched_trip_id.slice(-8)}` : "No asignado"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {pkg.item_description}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{pkg.purchase_origin}</div>
                          <div className="text-muted-foreground">↓</div>
                          <div>{pkg.package_destination}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(pkg.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={pkg.daysElapsed > 7 ? "text-amber-600" : "text-green-600"}>
                          {pkg.daysElapsed}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {pkg.estimated_price ? formatCurrency(pkg.estimated_price) : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedPackagesTable;