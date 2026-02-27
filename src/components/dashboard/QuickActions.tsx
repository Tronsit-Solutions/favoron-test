
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plane, Plus } from "lucide-react";

interface QuickActionsProps {
  onShowPackageForm: () => void;
  onShowTripForm: () => void;
}

const QuickActions = ({ onShowPackageForm, onShowTripForm }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mobile-content">
      <Card className={`hover:shadow-lg transition-shadow cursor-pointer`} onClick={onShowPackageForm}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              Solicitar Favorón
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            ¿Necesitas algo del extranjero? Pide un Favorón
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button variant="shopper" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nueva Solicitud</span>
            <span className="sm:hidden">Nuevo Pedido</span>
          </Button>
        </CardContent>
      </Card>

      <Card className={`hover:shadow-lg transition-shadow cursor-pointer`} onClick={onShowTripForm}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-traveler" />
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              Registrar Viaje
            </CardTitle>
          </div>
          <CardDescription className="text-sm">
            ¿Viajas? Ayuda a otros y gana dinero
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button variant="traveler" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Viaje
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;
