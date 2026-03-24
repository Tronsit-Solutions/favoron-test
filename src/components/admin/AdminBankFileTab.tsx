import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import * as XLSX from "xlsx";

type RowData = {
  colA: string;
  colB: string;
  colC: string;
  colD: string | number;
  colE: string | number;
  colF: string;
  colG: string;
  colH: string;
  colI: string | number;
};

const BANK_CODE_MAP: Record<string, string> = {
  'banco de guatemala': '01',
  'credito hipotecario nacional': '04',
  'banco de los trabajadores': '12',
  'banco cuscatlan': '13',
  'banco industrial': '15',
  'banco de desarrollo rural': '16',
  'banrural': '16',
  'interbanco': '19',
  'citibank': '30',
  'vivibanco': '36',
  'banco ficohsa': '39',
  'ficohsa': '39',
  'promerica': '40',
  'banco de antigua': '41',
  'banco de america central': '42',
  'bac': '42',
  'banco agromercantil': '44',
  'agromercantil': '44',
  'banco azteca': '47',
  'banco inv': '48',
  'banco credicorp': '49',
  'banco nexa': '50',
  'banco multimoney': '51',
};

const getBankCode = (bankName: string): string => {
  if (!bankName) return '';
  const lower = bankName.toLowerCase().trim();
  for (const [key, code] of Object.entries(BANK_CODE_MAP)) {
    if (lower.includes(key)) return code;
  }
  return '';
};

const getAccountTypeCode = (type: string) => {
  if (type?.toLowerCase().includes('ahorro')) return 2;
  return 1;
};

const AdminBankFileTab = () => {
  const { paymentOrders, loading } = usePaymentOrders();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedRows, setEditedRows] = useState<Record<string, RowData>>({});
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const pendingOrders = useMemo(() =>
    (paymentOrders || []).filter(o => o.status === 'pending'),
    [paymentOrders]
  );

  const visibleOrders = useMemo(() =>
    pendingOrders.filter(o => !hiddenIds.has(o.id)),
    [pendingOrders, hiddenIds]
  );

  useEffect(() => {
    setSelectedIds(new Set(pendingOrders.map(o => o.id)));
    const rows: Record<string, RowData> = {};
    for (const o of pendingOrders) {
      rows[o.id] = {
        colA: o.bank_account_holder || "",
        colB: "",
        colC: o.bank_account_number || "",
        colD: getAccountTypeCode(o.bank_account_type),
        colE: 1,
        colF: getBankCode(o.bank_name || ""),
        colG: `Tip ${o.trip_id.slice(0, 8)}`,
        colH: `Tip ${o.trip_id.slice(0, 8)}`,
        colI: o.amount,
      };
    }
    setEditedRows(rows);
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
    if (selectedIds.size === visibleOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleOrders.map(o => o.id)));
    }
  };

  const removeRow = (id: string) => {
    setHiddenIds(prev => new Set(prev).add(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateCell = (id: string, key: keyof RowData, value: string) => {
    setEditedRows(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  };

  const handleDownload = () => {
    const selected = visibleOrders.filter(o => selectedIds.has(o.id));
    if (selected.length === 0) return;

    const headers = ["Nombre", "Id Participante", "Cuenta credito / debito", "Tipo Cuenta", "Moneda", "Banco", "Descripcion Corta", "Adenda", "Valor Q"];
    const rows = [
      headers,
      ...selected.map(o => {
        const r = editedRows[o.id];
        return [r.colA, r.colB, r.colC, r.colD, r.colE, r.colF, r.colG, r.colH, r.colI];
      })
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transferencias");
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `transferencias-${date}.xls`, { bookType: 'xls' });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground p-4">Cargando órdenes...</p>;
  }

  const inputClass = "h-8 px-2 border-transparent bg-transparent hover:border-input focus:border-primary text-sm";

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
        {visibleOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay órdenes de pago pendientes.</p>
        ) : (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={visibleOrders.length > 0 && selectedIds.size === visibleOrders.length} onCheckedChange={toggleAll} />
                  </TableHead>
                   <TableHead>Nombre</TableHead>
                   <TableHead>Id Participante</TableHead>
                   <TableHead>Cuenta credito / debito</TableHead>
                   <TableHead>Tipo Cuenta</TableHead>
                   <TableHead>Moneda</TableHead>
                   <TableHead>Banco</TableHead>
                   <TableHead>Descripcion Corta</TableHead>
                   <TableHead>Adenda</TableHead>
                   <TableHead className="text-right">Valor Q</TableHead>
                   <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map(order => {
                  const r = editedRows[order.id];
                  if (!r) return null;
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={r.colA} onChange={e => updateCell(order.id, 'colA', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={r.colB} onChange={e => updateCell(order.id, 'colB', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={`${inputClass} font-mono`} value={r.colC} onChange={e => updateCell(order.id, 'colC', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={String(r.colD)} onChange={e => updateCell(order.id, 'colD', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={String(r.colE)} onChange={e => updateCell(order.id, 'colE', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={r.colF} onChange={e => updateCell(order.id, 'colF', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={r.colG} onChange={e => updateCell(order.id, 'colG', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={inputClass} value={r.colH} onChange={e => updateCell(order.id, 'colH', e.target.value)} />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input className={`${inputClass} text-right font-semibold`} value={String(r.colI)} onChange={e => updateCell(order.id, 'colI', e.target.value)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminBankFileTab;
