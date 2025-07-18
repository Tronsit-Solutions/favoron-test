import { Badge } from "@/components/ui/badge";

interface MatchStatsHeaderProps {
  totalMatches: number;
  statsData: {
    completed: number;
    inProgress: number;
    broken: number;
  };
}

export const MatchStatsHeader = ({ totalMatches, statsData }: MatchStatsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">🔗 Matches activos</h3>
        <p className="text-sm text-muted-foreground">
          {totalMatches} matches en seguimiento
        </p>
      </div>
      <div className="flex space-x-2">
        <Badge variant="secondary" className="bg-green-50 text-green-700">
          {statsData.completed} Completados
        </Badge>
        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
          {statsData.inProgress} En proceso
        </Badge>
        <Badge variant="secondary" className="bg-red-50 text-red-700">
          {statsData.broken} Matches rotos
        </Badge>
      </div>
    </div>
  );
};