

interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <span className="bg-accent/10 border border-accent/30 rounded-lg px-2 py-1.5 text-xs font-medium text-accent-foreground shadow-sm w-auto inline-flex items-center">
      <span className="inline text-xs uppercase tracking-wide text-accent/70 mr-1">Recepción</span>
      <span className="font-semibold">
        {new Date(firstDay).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} - {new Date(lastDay).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
      </span>
    </span>
  );
};

