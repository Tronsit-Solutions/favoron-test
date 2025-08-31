
import { formatDate } from "@/lib/formatters";

interface TripDateProps {
  arrivalDate: string;
}

export const TripDate = ({ arrivalDate }: TripDateProps) => {
  return (
    <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
      Fecha de viaje: {new Date(arrivalDate).toLocaleDateString('es-GT')}
    </div>
  );
};
