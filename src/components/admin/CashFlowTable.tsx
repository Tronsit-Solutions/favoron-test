import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, ArrowDownCircle, ArrowUpCircle, Eye, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getQuoteValues } from "@/lib/quoteHelpers";
import { format, startOfMonth, addMonths, parse } from "date-fns";
import { ReceiptViewerModal } from "@/components/ui/receipt-viewer-modal";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

const CashFlowTable = () => {
  const { toast } = useToast();
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFilename, setReceiptFilename] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>("detail");

  const selectedDateRange = useMemo(() => {
    if (selectedMonth === "all") return null;
    if (selectedMonth.startsWith("year-")) {
      const year = parseInt(selectedMonth.split("-")[1]);
      return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
    }
    const d = parse(selectedMonth, "yyyy-MM", new Date());
    return { start: startOfMonth(d), end: startOfMonth(addMonths(d, 1)) };
  }, [selectedMonth]);

  // ── INGRESOS: paquetes pagados ──
  const paidStates = [
    "pending_purchase", "purchase_confirmed", "shipped", "in_transit",
    "received_by_traveler", "pending_office_confirmation", "delivered_to_office",
    "ready_for_pickup", "ready_for_delivery", "out_for_delivery", "completed",
  ];

  const { data: incomePackages, isLoading: loadingIncome } = useQuery({
    queryKey: ["cashflow-income", selectedMonth],
    queryFn: async () => {
      let q = supabase
        .from("packages")
        .select("id, user_id, status, item_description, quote, payment_method, created_at, matched_trip_id, delivery_method, payment_receipt, recurrente_payment_id, label_number")
        .in("status", paidStates)
        .not("quote", "is", null)
        .order("created_at", { ascending: false });

      if (selectedDateRange) {
        q = q.gte("created_at", selectedDateRange.start.toISOString()).lt("created_at", selectedDateRange.end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // ── EGRESOS: payment_orders completadas ──
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["cashflow-expenses", selectedMonth],
    queryFn: async () => {
      let q = supabase
        .from("payment_orders")
        .select(`
          id, traveler_id, trip_id, amount, status, created_at, completed_at,
          receipt_url, receipt_filename, notes,
          profiles!traveler_id ( first_name, last_name )
        `)
        .in("status", ["completed"])
        .order("completed_at", { ascending: false });

      if (selectedDateRange) {
        q = q.gte("completed_at", selectedDateRange.start.toISOString()).lt("completed_at", selectedDateRange.end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // ── REEMBOLSOS: refund_orders completadas ──
  const { data: completedRefunds, isLoading: loadingRefunds } = useQuery({
    queryKey: ["cashflow-refunds", selectedMonth],
    queryFn: async () => {
      let q = supabase
        .from("refund_orders")
        .select("id, amount, reason, completed_at, shopper_id, package_id, receipt_url, receipt_filename")
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (selectedDateRange) {
        q = q.gte("completed_at", selectedDateRange.start.toISOString()).lt("completed_at", selectedDateRange.end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch shopper profiles (include refund shoppers too)
  const refundShopperIds = useMemo(() => [...new Set((completedRefunds || []).map(r => r.shopper_id))], [completedRefunds]);
  const shopperIds = useMemo(() => [...new Set([...(incomePackages || []).map(p => p.user_id), ...refundShopperIds])], [incomePackages, refundShopperIds]);
  const { data: shopperProfiles } = useQuery({
    queryKey: ["cashflow-shoppers", shopperIds],
    queryFn: async () => {
      if (shopperIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, first_name, last_name").in("id", shopperIds);
      const map: Record<string, string> = {};
      data?.forEach(p => { map[p.id] = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Sin nombre"; });
      return map;
    },
    enabled: shopperIds.length > 0,
  });

  // ── CÁLCULOS ──
  const incomeRows = useMemo(() => {
    return (incomePackages || []).map(pkg => {
      const qv = getQuoteValues(pkg.quote);
      const receiptData = pkg.payment_receipt as any;
      return {
        id: pkg.id,
        date: pkg.created_at,
        shopper: shopperProfiles?.[pkg.user_id] || "—",
        description: pkg.item_description,
        tipViajero: qv.price,
        serviceFee: qv.serviceFee,
        deliveryFee: qv.deliveryFee,
        discount: qv.discountAmount,
        totalPaid: qv.finalTotalPrice,
        paymentMethod: pkg.payment_method || "bank_transfer",
        recurrentePaymentId: pkg.recurrente_payment_id || null,
        receiptUrl: receiptData?.url || receiptData?.receipt_url || receiptData?.filePath || null,
        receiptFilename: receiptData?.filename || receiptData?.receipt_filename || receiptData?.filePath?.split('/').pop() || null,
      };
    });
  }, [incomePackages, shopperProfiles]);

  const expenseRows = useMemo(() => {
    return (expenses || []).map((po: any) => {
      const profile = po.profiles;
      return {
        id: po.id,
        date: po.completed_at || po.created_at,
        traveler: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "—",
        tripId: po.trip_id,
        amount: po.amount,
        status: po.status,
        receiptUrl: po.receipt_url,
        receiptFilename: po.receipt_filename,
        notes: po.notes,
      };
    });
  }, [expenses]);

  const filteredIncomeRows = useMemo(() => {
    if (paymentMethodFilter === "all") return incomeRows;
    if (paymentMethodFilter === "card") return incomeRows.filter(r => r.paymentMethod === "card");
    return incomeRows.filter(r => r.paymentMethod !== "card");
  }, [incomeRows, paymentMethodFilter]);

  const totalIncome = useMemo(() => filteredIncomeRows.reduce((s, r) => s + r.totalPaid, 0), [filteredIncomeRows]);
  const totalExpenses = useMemo(() => expenseRows.reduce((s, r) => s + r.amount, 0), [expenseRows]);
  const totalRefunds = useMemo(() => (completedRefunds || []).reduce((s, r) => s + r.amount, 0), [completedRefunds]);
  const net = totalIncome - totalExpenses - totalRefunds;

  // ── CONSOLIDADO ──
  const consolidatedRows = useMemo(() => {
    const income = filteredIncomeRows.map(r => ({
      id: r.id,
      date: r.date,
      type: "income" as const,
      person: r.shopper,
      description: r.description,
      amount: r.totalPaid,
      paymentMethod: r.paymentMethod,
      receiptUrl: r.receiptUrl,
      receiptFilename: r.receiptFilename,
      recurrentePaymentId: r.recurrentePaymentId,
    }));
    const expense = expenseRows.map(r => ({
      id: r.id,
      date: r.date,
      type: "expense" as const,
      person: r.traveler,
      description: `Pago a viajero`,
      amount: r.amount,
      paymentMethod: "bank_transfer",
      receiptUrl: r.receiptUrl,
      receiptFilename: r.receiptFilename,
      recurrentePaymentId: null,
    }));
    const refunds = (completedRefunds || []).map(r => ({
      id: r.id,
      date: r.completed_at!,
      type: "refund" as const,
      person: shopperProfiles?.[r.shopper_id] || "—",
      description: r.reason || "Reembolso",
      amount: r.amount,
      paymentMethod: "bank_transfer",
      receiptUrl: r.receipt_url,
      receiptFilename: r.receipt_filename,
      recurrentePaymentId: null,
    }));
    return [...income, ...expense, ...refunds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredIncomeRows, expenseRows, completedRefunds, shopperProfiles]);

  // ── MESES DISPONIBLES ──
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = addMonths(now, -i);
      months.add(format(d, "yyyy-MM"));
    }
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, []);

  // ── EXCEL EXPORT ──
  const handleExport = () => {
    const incomeSheet = incomeRows.map(r => ({
      Fecha: formatDate(r.date),
      Shopper: r.shopper,
      Descripción: r.description,
      "Tip Viajero": r.tipViajero,
      "Service Fee": r.serviceFee,
      "Delivery Fee": r.deliveryFee,
      Descuento: r.discount,
      "Total Pagado": r.totalPaid,
      "Método Pago": r.paymentMethod === "card" ? "Tarjeta" : "Transferencia",
      Comprobante: r.paymentMethod === "card" ? (r.recurrentePaymentId || "—") : (r.receiptUrl ? "Transferencia" : "—"),
    }));

    const expenseSheet = expenseRows.map(r => ({
      Fecha: formatDate(r.date),
      Viajero: r.traveler,
      "ID Viaje": r.tripId?.slice(0, 8) || "—",
      Monto: r.amount,
      Estado: r.status,
      Notas: r.notes || "",
    }));

    const consolidatedSheet = consolidatedRows.map(r => ({
      Fecha: formatDate(r.date),
      Tipo: r.type === "income" ? "Ingreso" : "Egreso",
      Persona: r.person,
      Descripción: r.description,
      Monto: r.type === "income" ? r.amount : -r.amount,
      "Método Pago": r.paymentMethod === "card" ? "Tarjeta" : "Transferencia",
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(consolidatedSheet), "Consolidado");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeSheet), "Ingresos");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseSheet), "Egresos");
    XLSX.writeFile(wb, `flujo_caja_${selectedMonth}.xlsx`);
    toast({ title: "Exportado", description: "Archivo Excel descargado" });
  };

  const handleViewReceipt = async (url: string, filename?: string) => {
    if (url.startsWith("http")) {
      setReceiptUrl(url);
      setReceiptFilename(filename || null);
      return;
    }
    const { data } = await supabase.storage.from("payment-receipts").createSignedUrl(url, 3600);
    if (data?.signedUrl) {
      setReceiptUrl(data.signedUrl);
      setReceiptFilename(filename || null);
    }
  };

  const isLoading = loadingIncome || loadingExpenses || loadingRefunds;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Flujo de Caja</CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {availableMonths.map(month => {
                    const [year, monthNum] = month.split("-");
                    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                    return (
                      <SelectItem key={month} value={month}>
                        {monthNames[parseInt(monthNum) - 1]} {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-center">
              <ArrowDownCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Total Ingresos</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-muted-foreground">{filteredIncomeRows.length} transacciones</p>
            </div>
            <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-center">
              <ArrowUpCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Total Egresos</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">{expenseRows.length} pagos</p>
            </div>
            <div className={`p-4 rounded-lg border text-center ${net >= 0 ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"}`}>
              <p className="text-xs text-muted-foreground">Balance Neto</p>
              <p className={`text-xl font-bold ${net >= 0 ? "text-blue-700 dark:text-blue-400" : "text-orange-700 dark:text-orange-400"}`}>
                {formatCurrency(net)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
          <TabsTrigger value="detail">Detalle</TabsTrigger>
        </TabsList>

        {/* CONSOLIDATED VIEW */}
        <TabsContent value="consolidated">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
              ) : consolidatedRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No hay movimientos en este período</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Persona</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Comprobante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consolidatedRows.map(row => (
                        <TableRow key={`${row.type}-${row.id}`}>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(row.date)}</TableCell>
                          <TableCell>
                            {row.type === "income" ? (
                              <Badge className="text-xs bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700">
                                <ArrowDownCircle className="h-3 w-3 mr-1" /> Ingreso
                              </Badge>
                            ) : (
                              <Badge className="text-xs bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700">
                                <ArrowUpCircle className="h-3 w-3 mr-1" /> Egreso
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{row.person}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{row.description}</TableCell>
                          <TableCell className={`text-right text-xs font-medium tabular-nums ${row.type === "income" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                            {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {row.paymentMethod === "card" ? "Tarjeta" : "Transfer."}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.type === "income" && row.paymentMethod === "card" && row.recurrentePaymentId ? (
                              <span className="text-xs font-mono text-muted-foreground">ID: {row.recurrentePaymentId}</span>
                            ) : row.receiptUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleViewReceipt(row.receiptUrl!, row.receiptFilename)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Ver
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETAIL VIEW */}
        <TabsContent value="detail" className="space-y-6">
          {/* INGRESOS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowDownCircle className="h-5 w-5 text-green-600" />
                Ingresos (Pagos de Shoppers)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
              ) : filteredIncomeRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No hay ingresos en este período</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Shopper</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Tip Viajero</TableHead>
                        <TableHead className="text-right">Service Fee</TableHead>
                        <TableHead className="text-right">Delivery Fee</TableHead>
                        <TableHead className="text-right">Descuento</TableHead>
                        <TableHead className="text-right">Total Pagado</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Comprobante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncomeRows.map(row => (
                        <TableRow key={row.id}>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(row.date)}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{row.shopper}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{row.description}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">{formatCurrency(row.tipViajero)}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">{formatCurrency(row.serviceFee)}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">{formatCurrency(row.deliveryFee)}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums">
                            {row.discount > 0 ? (
                              <span className="text-green-600">-{formatCurrency(row.discount)}</span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium tabular-nums">{formatCurrency(row.totalPaid)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {row.paymentMethod === "card" ? "Tarjeta" : "Transfer."}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.paymentMethod === "card" && row.recurrentePaymentId ? (
                              <span className="text-xs font-mono text-muted-foreground">ID: {row.recurrentePaymentId}</span>
                            ) : row.paymentMethod !== "card" && row.receiptUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleViewReceipt(row.receiptUrl!, row.receiptFilename)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Ver
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* EGRESOS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowUpCircle className="h-5 w-5 text-red-600" />
                Egresos (Pagos a Viajeros)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
              ) : expenseRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No hay egresos en este período</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Viajero</TableHead>
                        <TableHead>ID Viaje</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Comprobante</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseRows.map(row => (
                        <TableRow key={row.id}>
                          <TableCell className="text-xs whitespace-nowrap">{formatDate(row.date)}</TableCell>
                          <TableCell className="text-xs">{row.traveler}</TableCell>
                          <TableCell className="text-xs font-mono">{row.tripId?.slice(0, 8) || "—"}</TableCell>
                          <TableCell className="text-right text-xs font-medium tabular-nums">{formatCurrency(row.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Completado
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.receiptUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleViewReceipt(row.receiptUrl!, row.receiptFilename)}
                              >
                                <Eye className="h-3 w-3 mr-1" /> Ver
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt viewer */}
      {receiptUrl && (
        <ReceiptViewerModal
          isOpen={!!receiptUrl}
          receiptUrl={receiptUrl}
          filename={receiptFilename || undefined}
          onClose={() => { setReceiptUrl(null); setReceiptFilename(null); }}
        />
      )}
    </div>
  );
};

export default CashFlowTable;
