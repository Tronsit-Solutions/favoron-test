
import { formatDate } from "@/lib/formatters";

interface TripDateProps {
  arrivalDate: string;
}

export const TripDate = ({ arrivalDate }: TripDateProps) => {
  return (
    <span className="bg-primary/10 border border-primary/30 rounded-md px-2 py-1 text-xs font-medium text-primary shadow-sm w-full sm:w-auto inline-flex items-center justify-center sm:justify-start">
      <span className="inline text-xs uppercase tracking-wide text-primary/60 mr-1 hidden sm:inline">Llegada:</span>
      <span className="font-semibold">{new Date(arrivalDate).toLocaleDateString('es-GT', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      })}</span>
    </span>
  );
};
