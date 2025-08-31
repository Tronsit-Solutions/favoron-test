
interface ReceptionWindowProps {
  firstDay: string;
  lastDay: string;
}

export const ReceptionWindow = ({ firstDay, lastDay }: ReceptionWindowProps) => {
  return (
    <span className="text-sm text-muted-foreground">
      Recepción: {new Date(firstDay).toLocaleDateString('es-GT')} - {new Date(lastDay).toLocaleDateString('es-GT')}
    </span>
  );
};
