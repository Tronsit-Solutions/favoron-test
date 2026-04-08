
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plane, Plus } from "lucide-react";

interface QuickActionsProps {
  onShowPackageForm: () => void;
  onShowTripForm: () => void;
}

const QuickActions = ({ onShowPackageForm, onShowTripForm }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 mobile-content">
      <Card className="sm:hover:shadow-lg transition-shadow cursor-pointer touch-manipulation" onClick={onShowPackageForm}>
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <CardTitle className="text-sm sm:text-xl flex items-center gap-2">
              Solicitar Favorón
            </CardTitle>
          </div>
          <CardDescription className="text-sm hidden sm:block">
            ¿Necesitas algo del extranjero? Pide un Favorón
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <Button variant="shopper" className="w-full text-xs sm:text-sm" size="sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nueva Solicitud</span>
            <span className="sm:hidden">Nuevo Pedido</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="sm:hover:shadow-lg transition-shadow cursor-pointer touch-manipulation" onClick={onShowTripForm}>
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Plane className="h-4 w-4 sm:h-6 sm:w-6 text-traveler flex-shrink-0" />
            <CardTitle className="text-sm sm:text-xl flex items-center gap-2">
              Registrar Viaje
            </CardTitle>
          </div>
          <CardDescription className="text-sm hidden sm:block">
            ¿Viajas? Ayuda a otros y gana dinero
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <Button variant="traveler" className="w-full text-xs sm:text-sm" size="sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Nuevo Viaje
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;
