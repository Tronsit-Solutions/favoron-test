import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { formatCurrency } from "@/lib/formatters";
import * as XLSX from "xlsx";

const AdminBankFileTab = () => {
  const { paymentOrders, loading } = usePaymentOrders();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pendingOrders = useMemo(() => 
    (paymentOrders || []).filter(o => o.status === 'pending'),
    [paymentOrders]
  );

  // Auto-select all pending on load
  useState(() => {
    setSelectedIds(new Set(pendingOrders.map(o => o.id)));
  });

  useMemo(() => {
    setSelectedIds(new Set(pendingOrders.map(o => o.id)));
  }, [pendingOrders]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pendingOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingOrders.map(o => o.id)));
    }
  };

  const getAccountTypeCode = (type: string) => {
    if (type?.toLowerCase().includes('ahorro')) return 2;
    return 1;
  };

  const handleDownload = () => {
    const selected = pendingOrders.filter(o => selectedIds.has(o.id));
    if (selected.length === 0) return;

    const rows = selected.map(order => [
      order.bank_account_holder,
      "",
      order.bank_account_number,
      getAccountTypeCode(order.bank_account_type),
      1,
      "",
      `Tip ${order.trip_id.slice(0, 8)}`,
      `Tip ${order.trip_id.slice(0, 8)}`,
      order.amount,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transferencias");

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `transferencias-${date}.xls`, { bookType: 'xls' });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground p-4">Cargando órdenes...</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Archivo para Transferencias Bancarias
        </CardTitle>
        <Button onClick={handleDownload} disabled={selectedIds.size === 0} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar XLS ({selectedIds.size})
        </Button>
      </CardHeader>
      <CardContent>
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay órdenes de pago pendientes.</p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size === pendingOrders.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>A: Titular</TableHead>
                  <TableHead>C: Cuenta</TableHead>
                  <TableHead>D: Tipo</TableHead>
                  <TableHead>G/H: Referencia</TableHead>
                  <TableHead className="text-right">I: Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{order.bank_account_holder}</TableCell>
                    <TableCell className="font-mono text-xs">{order.bank_account_number}</TableCell>
                    <TableCell>{getAccountTypeCode(order.bank_account_type) === 1 ? 'Monetaria (1)' : 'Ahorros (2)'}</TableCell>
                    <TableCell>Tip {order.trip_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(order.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBankFileTab;
