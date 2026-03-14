import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getQuoteValues } from "@/lib/quoteHelpers";
import { Loader2, TrendingUp, TrendingDown, Crown } from "lucide-react";
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
  type: "income" | "refund" | "prime" | "cancelled";
  labelNumber?: number | null;
}

const ACTIVE_STATUSES = [
  'pending_purchase', 'purchase_confirmed', 'shipped', 'in_transit',
  'received_by_traveler', 'pending_office_confirmation',
  'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery',
  'out_for_delivery', 'completed'
];

export const RevenueDetailSheet = ({ month, onClose }: RevenueDetailSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [summary, setSummary] = useState({ gross: 0, refunds: 0, prime: 0, net: 0 });

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

        // 1. Active packages + cancelled/archived (for alignment with FinancialSummaryTable)
        const { data: activePkgs } = await supabase
          .from('packages')
          .select('id, item_description, status, quote, label_number, payment_receipt, recurrente_payment_id')
          .in('status', [...ACTIVE_STATUSES, 'cancelled', 'archived_by_shopper'])
          .gte('created_at', startDate)
          .lt('created_at', endDate);

        // 2. Completed refunds with completed_at in this month (Guatemala TZ range)
        const { data: refunds } = await supabase
          .from('refund_orders')
          .select('id, package_id, amount, status, cancelled_products, reason, completed_at')
          .eq('status', 'completed')
          .gte('completed_at', startDate)
          .lt('completed_at', endDate);

        // 3. Approved Prime memberships with approved_at in this month (Guatemala TZ range)
        const { data: primeMemberships } = await supabase
          .from('prime_memberships')
          .select('id, amount, approved_at, user_id')
          .eq('status', 'approved')
          .not('approved_at', 'is', null)
          .gte('approved_at', startDate)
          .lt('approved_at', endDate);

        const items: LineItem[] = [];
        let grossTotal = 0;
        let refundTotal = 0;
        let primeTotal = 0;

        // Process active packages
        (activePkgs || []).forEach(pkg => {
          const isCancelled = pkg.status === 'cancelled' || pkg.status === 'archived_by_shopper';

          if (isCancelled) {
            // Only include cancelled packages with payment evidence (aligned with FinancialSummaryTable)
            const receipt = pkg.payment_receipt as any;
            const hasPaymentEvidence = !!(receipt?.receipt_url || pkg.recurrente_payment_id);
            if (hasPaymentEvidence) {
              items.push({
                id: pkg.id,
                description: pkg.item_description,
                status: pkg.status,
                serviceFee: 0,
                type: "cancelled",
                labelNumber: pkg.label_number,
              });
            }
            return;
          }

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

        // Cancelled-but-paid packages net to zero (income + counterpart cancel out)
        // so they are NOT shown — aligned with FinancialSummaryTable logic

        // Process refunds — extract serviceFee from cancelled_products metadata
        (refunds || []).forEach(ref => {
          const cancelledProducts = Array.isArray(ref.cancelled_products) ? ref.cancelled_products : [];

          let refundSF = 0;
          let refundTips = 0;
          let refundDeliveryFee = 0;

          if (cancelledProducts.length > 0) {
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

        // Process Prime memberships
        (primeMemberships || []).forEach(pm => {
          const amt = Number(pm.amount);
          if (amt > 0) {
            primeTotal += amt;
            items.push({
              id: pm.id,
              description: `Membresía Prime`,
              status: 'approved',
              serviceFee: amt,
              type: "prime",
            });
          }
        });

        setSummary({
          gross: grossTotal,
          refunds: refundTotal,
          prime: primeTotal,
          net: grossTotal - refundTotal + primeTotal,
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
      <SheetContent side="right" className="!max-w-2xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="capitalize text-xl">Detalle de Ingresos — {monthLabel}</SheetTitle>
          <SheetDescription>Desglose del ingreso Favorón neto del mes</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Service Fee Bruto</p>
                <p className="text-xl font-bold text-foreground">{fmt(summary.gross)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-destructive" /> Reembolsos
                </p>
                <p className="text-xl font-bold text-destructive">-{fmt(summary.refunds)}</p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-500" /> Prime
                </p>
                <p className="text-xl font-bold text-amber-600">+{fmt(summary.prime)}</p>
              </div>
              <div className="rounded-lg border bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-primary" /> Neto
                </p>
                <p className="text-xl font-bold text-primary">{fmt(summary.net)}</p>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Detalle ({lineItems.length} registros)
              </h4>
              <div className="rounded-md border max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Descripción</TableHead>
                      <TableHead className="text-sm">Tipo</TableHead>
                      <TableHead className="text-sm text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-12">
                          Sin registros para este mes
                        </TableCell>
                      </TableRow>
                    ) : (
                      lineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm max-w-[350px] truncate">
                            {item.labelNumber ? `#${item.labelNumber} - ` : ''}{item.description}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              item.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.type === 'refund' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              item.type === 'cancelled' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400' :
                              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {item.type === 'income' ? 'Ingreso' : item.type === 'refund' ? 'Reembolso' : item.type === 'cancelled' ? 'Cancelado' : 'Prime'}
                            </span>
                          </TableCell>
                          <TableCell className={`text-sm text-right font-mono ${
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