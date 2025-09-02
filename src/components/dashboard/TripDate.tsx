
import { formatDate } from "@/lib/formatters";

interface TripDateProps {
  arrivalDate: string;
}

export const TripDate = ({ arrivalDate }: TripDateProps) => {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-sm text-foreground shadow-sm hover:shadow-md transition-shadow duration-200">
      <span className="text-primary/70 font-medium">Fecha de viaje:</span> {new Date(arrivalDate).toLocaleDateString('es-GT')}
    </div>
  );
};
