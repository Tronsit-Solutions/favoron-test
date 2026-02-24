import { useState } from "react";
import { format, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { MarketingInvestment } from "@/hooks/useCACAnalytics";
import { useToast } from "@/hooks/use-toast";

interface InvestmentFormProps {
  investments: MarketingInvestment[];
  onAddInvestment: (data: { channel: string; month: string; investment: number; notes?: string; target_audience?: string }) => Promise<void>;
  onUpdateInvestment: (data: { id: string; channel: string; month: string; investment: number; notes?: string; target_audience?: string }) => Promise<void>;
  onDeleteInvestment: (id: string) => Promise<void>;
  isLoading: boolean;
}

const CHANNELS = [
  { value: "instagram_facebook_ads", label: "Meta Ads (FB/IG)" },
  { value: "tiktok", label: "TikTok" },
  { value: "reels", label: "Reels" },
  { value: "friend_referral", label: "Referidos" },
  { value: "other", label: "Otro" },
];

const AUDIENCES = [
  { value: "shoppers", label: "Shoppers" },
  { value: "travelers", label: "Viajeros" },
  { value: "both", label: "Ambos" },
];

// Generate last 12 months
const getMonthOptions = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    months.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: es }),
    });
  }
  return months;
};

export const InvestmentForm = ({
  investments,
  onAddInvestment,
  onUpdateInvestment,
  onDeleteInvestment,
  isLoading,
}: InvestmentFormProps) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [channel, setChannel] = useState("");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [targetAudience, setTargetAudience] = useState("both");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const monthOptions = getMonthOptions();

  const handleSubmit = async () => {
    if (!channel || !month || !amount) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa canal, mes e inversión",
        variant: "destructive",
      });
      return;
    }

    const investmentValue = parseFloat(amount);
    if (isNaN(investmentValue) || investmentValue < 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await onUpdateInvestment({
          id: editingId,
          channel,
          month,
          investment: investmentValue,
          notes: notes || undefined,
          target_audience: targetAudience,
        });
        toast({
          title: "Inversión actualizada",
          description: "Los datos se han actualizado correctamente",
        });
      } else {
        await onAddInvestment({
          channel,
          month,
          investment: investmentValue,
          notes: notes || undefined,
          target_audience: targetAudience,
        });
        toast({
          title: "Inversión registrada",
          description: "Los datos se han guardado correctamente",
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la inversión",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setEditingId(null);
    setChannel("");
    setMonth(format(new Date(), "yyyy-MM"));
    setAmount("");
    setNotes("");
    setTargetAudience("both");
  };

  const handleEdit = (inv: MarketingInvestment) => {
    setEditingId(inv.id);
    setChannel(inv.channel);
    setMonth(inv.month);
    setAmount(inv.investment.toString());
    setNotes(inv.notes || "");
    setTargetAudience(inv.target_audience || "both");
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteInvestment(id);
      toast({
        title: "Inversión eliminada",
        description: "El registro se ha eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la inversión",
        variant: "destructive",
      });
    }
  };

  const getChannelLabel = (value: string) => {
    return CHANNELS.find(c => c.value === value)?.label || value;
  };

  const getAudienceLabel = (value: string) => {
    return AUDIENCES.find(a => a.value === value)?.label || value;
  };

  const getAudienceBadgeClass = (value: string) => {
    switch (value) {
      case 'shoppers': return 'bg-blue-500/10 text-blue-700';
      case 'travelers': return 'bg-orange-500/10 text-orange-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, monthNum] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return format(date, "MMM yyyy", { locale: es });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inversiones en Marketing</h3>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Inversión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Inversión" : "Registrar Inversión"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifica los datos de la inversión" : "Agrega la inversión mensual por canal para calcular el CAC"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="channel">Canal</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="month">Mes</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Inversión (Q)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Detalles adicionales..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target_audience">Audiencia</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona audiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {investments.length > 0 ? (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Canal</th>
                <th className="text-left p-3 font-medium">Audiencia</th>
                <th className="text-left p-3 font-medium">Mes</th>
                <th className="text-right p-3 font-medium">Inversión</th>
                <th className="text-left p-3 font-medium">Notas</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {investments.slice(0, 10).map((inv) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="p-3">{getChannelLabel(inv.channel)}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getAudienceBadgeClass(inv.target_audience || 'both')}`}>
                      {getAudienceLabel(inv.target_audience || 'both')}
                    </span>
                  </td>
                  <td className="p-3 capitalize">{formatMonth(inv.month)}</td>
                  <td className="p-3 text-right font-medium">Q{inv.investment.toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                    {inv.notes || "-"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(inv)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          <p>No hay inversiones registradas</p>
          <p className="text-sm mt-1">Agrega inversiones para calcular el CAC</p>
        </div>
      )}
    </div>
  );
};
