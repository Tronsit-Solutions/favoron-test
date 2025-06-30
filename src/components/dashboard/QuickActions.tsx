
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plane, Plus } from "lucide-react";

interface QuickActionsProps {
  onShowPackageForm: () => void;
  onShowTripForm: () => void;
}

const QuickActions = ({ onShowPackageForm, onShowTripForm }: QuickActionsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onShowPackageForm}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle>Solicitar Paquete</CardTitle>
          </div>
          <CardDescription>
            ¿Necesitas algo del extranjero? Crea una solicitud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onShowTripForm}>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Plane className="h-6 w-6 text-accent" />
            <CardTitle>Registrar Viaje</CardTitle>
          </div>
          <CardDescription>
            ¿Viajas a Guatemala? Ayuda a otros y gana dinero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Viaje
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;
