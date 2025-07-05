
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plane, Plus } from "lucide-react";

interface EmptyStateProps {
  type: 'packages' | 'trips';
  onAction: () => void;
}

const EmptyState = ({ type, onAction }: EmptyStateProps) => {
  const config = {
    packages: {
      icon: Package,
      title: "No tienes solicitudes de paquetes",
      description: "Crea tu primera solicitud para comenzar a recibir productos del extranjero",
      buttonText: "Crear Primera Solicitud"
    },
    trips: {
      icon: Plane,
      title: "No tienes viajes registrados",
      description: "Registra tu próximo viaje a Guatemala y ayuda a otros mientras ganas dinero",
      buttonText: "Registrar Primer Viaje"
    }
  };

  const { icon: Icon, title, description, buttonText } = config[type];

  return (
    <Card>
      <CardContent className="text-center py-12">
        <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h4 className="text-lg font-semibold mb-2">{title}</h4>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button variant={type === 'trips' ? 'secondary' : 'shopper'} onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
