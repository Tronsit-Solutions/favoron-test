

interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl px-3 py-2.5 text-sm font-medium text-accent-foreground shadow-sm w-full sm:w-auto">
      <span className="block sm:inline text-xs uppercase tracking-wide text-accent/70 mb-1 sm:mb-0 sm:mr-2">Recepción</span>
      <span className="font-semibold">
        {new Date(firstDay).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} - {new Date(lastDay).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
};

