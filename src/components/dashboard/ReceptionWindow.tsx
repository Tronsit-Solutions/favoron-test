

interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/20 rounded-lg px-3 py-2 text-sm text-foreground shadow-sm hover:shadow-md transition-shadow duration-200">
      <span className="text-secondary/70 font-medium">Ventana de recepción:</span> {new Date(firstDay).toLocaleDateString('es-GT')} - {new Date(lastDay).toLocaleDateString('es-GT')}
    </div>
  );
};

