import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface UserActionsProps {
  onLoadTestData: () => void;
  onLoadTestPackage: () => void;
  onLoadTestTrip: () => void;
}

const UserActions = ({ onLoadTestData, onLoadTestPackage, onLoadTestTrip }: UserActionsProps) => {
  return (
    <div className="bg-card p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Acciones de Prueba</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onLoadTestData} variant="outline" size="sm">
          Cargar Datos de Prueba
        </Button>
        <Button onClick={onLoadTestPackage} variant="outline" size="sm">
          Crear Paquete de Prueba
        </Button>
        <Button onClick={onLoadTestTrip} variant="outline" size="sm">
          Crear Viaje de Prueba
        </Button>
      </div>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground">
        Usa estas opciones para generar datos de prueba y probar la funcionalidad.
      </p>
    </div>
  );
};

export default UserActions;