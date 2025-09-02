

interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <div className="bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground">
      Ventana de recepción: {new Date(firstDay).toLocaleDateString('es-GT')} - {new Date(lastDay).toLocaleDateString('es-GT')}
    </div>
  );
};

