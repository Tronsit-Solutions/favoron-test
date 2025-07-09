import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  userPackages: any[];
  userTrips: any[];
  assignedPackages: any[];
}

const StatsCards = ({ userPackages, userTrips, assignedPackages }: StatsCardsProps) => {
  const stats = [
    {
      title: "Mis Solicitudes",
      value: userPackages.length,
      description: "Paquetes solicitados"
    },
    {
      title: "Mis Viajes", 
      value: userTrips.length,
      description: "Viajes registrados"
    },
    {
      title: "Como Viajero",
      value: assignedPackages.length, 
      description: "Paquetes asignados"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;