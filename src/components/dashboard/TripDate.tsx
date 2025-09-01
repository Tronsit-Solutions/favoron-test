
import { formatDate } from "@/lib/formatters";

interface TripDateProps {
  arrivalDate: string;
}

export const TripDate = ({ arrivalDate }: TripDateProps) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5 text-xs font-medium text-primary shadow-sm w-auto">
      <span className="inline text-xs uppercase tracking-wide text-primary/70 mr-1">Llegada</span>
      <span className="font-semibold">{new Date(arrivalDate).toLocaleDateString('es-GT', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      })}</span>
    </div>
  );
};
