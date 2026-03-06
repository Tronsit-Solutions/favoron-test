import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getQuoteValues } from "@/lib/quoteHelpers";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

interface RevenueDetailSheetProps {
  month: string | null; // YYYY-MM
  onClose: () => void;
}

interface LineItem {
  id: string;
  description: string;
  status: string;
  serviceFee: number;
  type: "income" | "refund" | "cancellation";
  labelNumber?: number | null;
}

const ACTIVE_STATUSES = [
  'pending_purchase', 'purchase_confirmed', 'shipped', 'in_transit',
  'received_by_traveler', 'pending_office_confirmation',
  'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery',
  'out_for_delivery', 'completed'
];

const CANCELLED_STATUSES = ['cancelled', 'archived_by_shopper'];

export const RevenueDetailSheet = ({ month, onClose }: RevenueDetailSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [summary, setSummary] = useState({ gross: 0, refunds: 0, cancellations: 0, net: 0 });

  useEffect(() => {
    if (!month) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        // Date range for the selected month (Guatemala TZ: UTC-6)
        const startDate = `${month}-01T06:00:00.000Z`;
        const nextMonth = month.split('-');
        let y = parseInt(nextMonth[0]);
        let m = parseInt(nextMonth[1]) + 1;
        if (m > 12) { m = 1; y++; }
        const endDate = `${y}-${String(m).padStart(2, '0')}-01T06:00:00.000Z`;

        // 1. Active packages for this month
        const { data: activePkgs } = await supabase
          .from('packages')
          .select('id, item_description, status, quote, label_number, recurrente_payment_id, payment_receipt')
          .in('status', ACTIVE_STATUSES)
          .gte('created_at', startDate)
          .lt('created_at', endDate);

        // 2. Cancelled/archived packages for this month (check payment evidence client-side)
        const { data: cancelledPkgs } = await supabase
          .from('packages')
          .select('id, item_description, status, quote, label_number, recurrente_payment_id, payment_receipt')
          .in('status', CANCELLED_STATUSES)
          .gte('created_at', startDate)
          .lt('created_at', endDate);

        // 3. Completed refunds with completed_at in this month
        const { data: refunds } = await supabase
          .from('refund_orders')
          .select('id, package_id, amount, status, cancelled_products, reason, completed_at')
          .eq('status', 'completed')
          .gte('completed_at', startDate)
          .lt('completed_at', endDate);

        const items: LineItem[] = [];
        let grossTotal = 0;
        let refundTotal = 0;
        let cancellationTotal = 0;

        // Process active packages — use getQuoteValues for consistency
        (activePkgs || []).forEach(pkg => {
          const qv = getQuoteValues(pkg.quote);
          const sf = qv.serviceFee;
          if (sf > 0) {
            grossTotal += sf;
            items.push({
              id: pkg.id,
              description: pkg.item_description,
              status: pkg.status,
              serviceFee: sf,
              type: "income",
              labelNumber: pkg.label_number,
            });
          }
        });

        // Process cancelled-but-paid packages (same payment evidence logic as FinancialSummaryTable)
        const refundedPackageIds = new Set((refunds || []).map(r => r.package_id));
        (cancelledPkgs || []).forEach(pkg => {
          const receipt = pkg.payment_receipt as any;
          const hasManualReceipt = receipt && typeof receipt === 'object' && receipt.filePath;
          const hasCardPayment = !!pkg.recurrente_payment_id;
          const hasCardReceiptEvidence = receipt && typeof receipt === 'object' &&
            (receipt.method === 'card' || receipt.payment_id || receipt.provider === 'recurrente');
          const hasPaid = hasManualReceipt || hasCardPayment || hasCardReceiptEvidence;

          if (!hasPaid) return;

          const qv = getQuoteValues(pkg.quote);
          const sf = qv.serviceFee;
          if (sf <= 0) return;

          // Income entry
          grossTotal += sf;
          items.push({
            id: pkg.id + '-income',
            description: pkg.item_description,
            status: pkg.status,
            serviceFee: sf,
            type: "income",
            labelNumber: pkg.label_number,
          });

          // If no refund order exists, add cancellation counterpart
          if (!refundedPackageIds.has(pkg.id)) {
            cancellationTotal += sf;
            items.push({
              id: pkg.id + '-cancel',
              description: `Cancelación - ${pkg.item_description}`,
              status: pkg.status,
              serviceFee: -sf,
              type: "cancellation",
              labelNumber: pkg.label_number,
            });
          }
        });

        // Process refunds — extract serviceFee from cancelled_products metadata (same as FinancialSummaryTable)
        (refunds || []).forEach(ref => {
          const cancelledProducts = Array.isArray(ref.cancelled_products) ? ref.cancelled_products : [];

          let refundSF = 0;
          let refundTips = 0;
          let refundDeliveryFee = 0;

          if (cancelledProducts.length > 0) {
            // Use serviceFee from metadata (correct field)
            refundSF = (cancelledProducts as any[]).reduce((sum: number, p: any) => {
              if (p.serviceFee !== undefined) return sum + (Number(p.serviceFee) || 0);
              return sum;
            }, 0);

            refundTips = (cancelledProducts as any[]).reduce((sum: number, p: any) => {
              if (p.tip !== undefined) return sum + (Number(p.tip) || 0);
              if (p.adminAssignedTip !== undefined) return sum + (Number(p.adminAssignedTip) || 0);
              return sum;
            }, 0);

            refundDeliveryFee = (cancelledProducts as any[]).reduce((sum: number, p: any) => {
              if (p.deliveryFee !== undefined) return sum + (Number(p.deliveryFee) || 0);
              return sum;
            }, 0);

            // Fallback for legacy records without explicit serviceFee
            if (refundSF === 0 && refundTips > 0) {
              refundSF = Math.max(0, ref.amount - refundTips - refundDeliveryFee);
            }
          }

          if (refundSF > 0) {
            refundTotal += refundSF;
            items.push({
              id: ref.id,
              description: `Reembolso - ${ref.reason || 'N/A'}`,
              status: 'refund_completed',
              serviceFee: -refundSF,
              type: "refund",
            });
          }
        });

        setSummary({
          gross: grossTotal,
          refunds: refundTotal,
          cancellations: cancellationTotal,
          net: grossTotal - refundTotal - cancellationTotal,
        });
        setLineItems(items);
      } catch (err) {
        console.error('Error fetching revenue detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [month]);

  const monthLabel = month
    ? format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: es })
    : '';

  const fmt = (v: number) => `Q${Math.abs(v).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Sheet open={!!month} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="capitalize">Detalle de Ingresos — {monthLabel}</SheetTitle>
          <SheetDescription>Desglose del service fee neto del mes</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Service Fee Bruto</p>
                <p className="text-lg font-bold text-foreground">{fmt(summary.gross)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-destructive" /> Reembolsos
                </p>
                <p className="text-lg font-bold text-destructive">-{fmt(summary.refunds)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Minus className="h-3 w-3 text-orange-500" /> Cancelaciones
                </p>
                <p className="text-lg font-bold text-orange-500">-{fmt(summary.cancellations)}</p>
              </div>
              <div className="rounded-lg border bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" /> Neto
                </p>
                <p className="text-lg font-bold text-primary">{fmt(summary.net)}</p>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Detalle ({lineItems.length} registros)
              </h4>
              <div className="rounded-md border max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Descripción</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-8">
                          Sin registros para este mes
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {item.labelNumber ? `#${item.labelNumber} - ` : ''}{item.description}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              item.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.type === 'refund' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}>
                              {item.type === 'income' ? 'Ingreso' : item.type === 'refund' ? 'Reembolso' : 'Cancelación'}
                            </span>
                          </TableCell>
                          <TableCell className={`text-xs text-right font-mono ${
                            item.serviceFee < 0 ? 'text-destructive' : 'text-foreground'
                          }`}>
                            {item.serviceFee < 0 ? '-' : ''}{fmt(item.serviceFee)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
