
import { formatDate } from "@/lib/formatters";

interface TripDateProps {
  arrivalDate: string;
}

export const TripDate = ({ arrivalDate }: TripDateProps) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2.5 text-sm font-medium text-primary shadow-sm w-full sm:w-auto">
      <span className="block sm:inline text-xs uppercase tracking-wide text-primary/70 mb-1 sm:mb-0 sm:mr-2">Llegada</span>
      <span className="font-semibold">{new Date(arrivalDate).toLocaleDateString('es-GT', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      })}</span>
    </div>
  );
};
