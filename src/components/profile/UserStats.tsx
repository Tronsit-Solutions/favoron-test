
import { Card, CardContent } from "@/components/ui/card";
import { Package, Plane, DollarSign, Trophy } from "lucide-react";

interface UserStatsProps {
  stats: {
    packagesRequested: number;
    packagesCompleted: number;
    totalTips: number;
    packagesDelivered: number;
  };
}

const UserStats = ({ stats }: UserStatsProps) => {
  const statCards = [
    {
      icon: Package,
      value: stats.packagesRequested,
      label: "Favorones pedidos",
      color: "text-primary"
    },
    {
      icon: Plane,
      value: stats.packagesDelivered,
      label: "Favorones entregados",
      color: "text-traveler"
    },
    {
      icon: DollarSign,
      value: `Q${stats.totalTips.toFixed(2)}`,
      label: "Propinas ganadas",
      color: "text-green-600"
    },
    {
      icon: Trophy,
      value: stats.packagesCompleted,
      label: "Completados",
      color: "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserStats;
