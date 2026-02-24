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
import { IncidentCost } from "@/hooks/useCACAnalytics";
import { useToast } from "@/hooks/use-toast";

interface IncidentCostFormProps {
  incidentCosts: IncidentCost[];
  onAdd: (data: { month: string; amount: number; description?: string }) => Promise<void>;
  onUpdate: (data: { id: string; month: string; amount: number; description?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

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

export const IncidentCostForm = ({
  incidentCosts,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: IncidentCostFormProps) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const monthOptions = getMonthOptions();

  const handleSubmit = async () => {
    if (!month || !amount) {
      toast({ title: "Campos requeridos", description: "Por favor completa mes y monto", variant: "destructive" });
      return;
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < 0) {
      toast({ title: "Monto inválido", description: "Por favor ingresa un monto válido", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await onUpdate({ id: editingId, month, amount: amountValue, description: description || undefined });
        toast({ title: "Costo actualizado", description: "Los datos se han actualizado correctamente" });
      } else {
        await onAdd({ month, amount: amountValue, description: description || undefined });
        toast({ title: "Costo registrado", description: "Los datos se han guardado correctamente" });
      }
      resetForm();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el costo", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setOpen(false);
    setEditingId(null);
    setMonth(format(new Date(), "yyyy-MM"));
    setAmount("");
    setDescription("");
  };

  const handleEdit = (ic: IncidentCost) => {
    setEditingId(ic.id);
    setMonth(ic.month);
    setAmount(ic.amount.toString());
    setDescription(ic.description || "");
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast({ title: "Costo eliminado", description: "El registro se ha eliminado correctamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el costo", variant: "destructive" });
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
        <h3 className="text-lg font-semibold">Costos por Incidencias</h3>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Costo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Costo" : "Registrar Costo de Incidencia"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifica los datos del costo" : "Registra cuánto gastaste en incidencias (paquetes perdidos, compensaciones, etc.)"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ic-month">Mes</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ic-amount">Monto (Q)</Label>
                <Input
                  id="ic-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ic-description">Descripción (opcional)</Label>
                <Textarea
                  id="ic-description"
                  placeholder="Ej: Paquete perdido #123, compensación directa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {incidentCosts.length > 0 ? (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Mes</th>
                <th className="text-right p-3 font-medium">Monto</th>
                <th className="text-left p-3 font-medium">Descripción</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {incidentCosts.slice(0, 10).map((ic) => (
                <tr key={ic.id} className="border-b last:border-0">
                  <td className="p-3 capitalize">{formatMonth(ic.month)}</td>
                  <td className="p-3 text-right font-medium">Q{Number(ic.amount).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-[200px]">{ic.description || "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ic)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(ic.id)}>
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
          <p>No hay costos de incidencias registrados</p>
          <p className="text-sm mt-1">Agrega costos para ver el impacto en el LTV neto</p>
        </div>
      )}
    </div>
  );
};
