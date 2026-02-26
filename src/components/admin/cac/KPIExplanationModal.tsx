import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calculator, Info } from "lucide-react";

interface KPIExplanationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  value: string;
  formula: string;
  calculation: string;
  explanation: string;
}

const KPIExplanationModal = ({ open, onClose, title, value, formula, calculation, explanation }: KPIExplanationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>Detalle del cálculo de esta métrica</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor actual</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Fórmula
            </p>
            <div className="rounded-lg border bg-muted/30 p-3">
              <code className="text-sm">{formula}</code>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Cálculo</p>
            <div className="rounded-lg border bg-muted/30 p-3">
              <code className="text-sm break-all">{calculation}</code>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Explicación
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{explanation}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KPIExplanationModal;
