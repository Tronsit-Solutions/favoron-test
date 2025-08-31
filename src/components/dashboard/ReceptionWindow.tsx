

interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <span className="text-sm text-muted-foreground">
      Ventana de recepción: {new Date(firstDay).toLocaleDateString('es-GT')} - {new Date(lastDay).toLocaleDateString('es-GT')}
    </span>
  );
};

