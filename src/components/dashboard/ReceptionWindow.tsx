

interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <span className="bg-accent/10 border border-accent/30 rounded-md px-2 py-1 text-xs font-medium text-accent-foreground shadow-sm w-full sm:w-auto inline-flex items-center justify-center sm:justify-start">
      <span className="inline text-xs uppercase tracking-wide text-accent/60 mr-1 hidden sm:inline">Recepción:</span>
      <span className="font-semibold">
        {new Date(firstDay).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} - {new Date(lastDay).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
      </span>
    </span>
  );
};

