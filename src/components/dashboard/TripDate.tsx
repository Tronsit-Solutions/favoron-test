
import { formatDate } from "@/lib/formatters";

interface TripDateProps {
  arrivalDate: string;
}

export const TripDate = ({ arrivalDate }: TripDateProps) => {
  return (
    <span className="text-sm text-muted-foreground">
      Fecha de viaje: {new Date(arrivalDate).toLocaleDateString('es-GT')}
    </span>
  );
};
