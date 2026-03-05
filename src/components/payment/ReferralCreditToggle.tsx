import { Gift } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useReferralCredit } from "@/hooks/useReferralCredit";

interface ReferralCreditToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean, creditAmount: number) => void;
  maxApplicable: number; // The current total amount - credit can't exceed this
  disabled?: boolean;
}

export default function ReferralCreditToggle({
  enabled,
  onToggle,
  maxApplicable,
  disabled = false,
}: ReferralCreditToggleProps) {
  const { totalAvailable, loading } = useReferralCredit();

  if (loading || totalAvailable <= 0) return null;

  const applicableAmount = Math.min(totalAvailable, maxApplicable);

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Crédito de referidos
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Q{totalAvailable.toFixed(2)} disponible
              {applicableAmount < totalAvailable && (
                <span> · aplica Q{applicableAmount.toFixed(2)}</span>
              )}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => onToggle(checked, applicableAmount)}
          disabled={disabled}
        />
      </div>
      {enabled && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
          -Q{applicableAmount.toFixed(2)} aplicado a tu total
        </p>
      )}
    </div>
  );
}
