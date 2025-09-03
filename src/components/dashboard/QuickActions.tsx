
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plane, Plus, Lock } from "lucide-react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import ProfileCompletionGuard from "@/components/ProfileCompletionGuard";

interface QuickActionsProps {
  onShowPackageForm: () => void;
  onShowTripForm: () => void;
}

const QuickActions = ({ onShowPackageForm, onShowTripForm }: QuickActionsProps) => {
  const { isComplete } = useProfileCompletion();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mobile-content">
      <ProfileCompletionGuard
        onAction={onShowPackageForm}
        title="Completa tu perfil para solicitar paquetes"
        description="Necesitamos tu número de WhatsApp para que los viajeros puedan contactarte."
      >
        <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${!isComplete ? 'opacity-75' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                Solicitar Paquete
                {!isComplete && <Lock className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              {!isComplete 
                ? "Completa tu perfil para solicitar paquetes"
                : "¿Necesitas algo del extranjero? Crea una solicitud"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="shopper" className="w-full" disabled={!isComplete}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva Solicitud</span>
              <span className="sm:hidden">Nuevo Pedido</span>
            </Button>
          </CardContent>
        </Card>
      </ProfileCompletionGuard>

      <ProfileCompletionGuard
        onAction={onShowTripForm}
        title="Completa tu perfil para registrar viajes"
        description="Necesitamos tu número de WhatsApp para que los shoppers puedan contactarte."
      >
        <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${!isComplete ? 'opacity-75' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-traveler" />
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                Registrar Viaje
                {!isComplete && <Lock className="h-4 w-4 text-muted-foreground" />}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              {!isComplete 
                ? "Completa tu perfil para registrar viajes"
                : "¿Viajas a Guatemala? Ayuda a otros y gana dinero"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="traveler" className="w-full" disabled={!isComplete}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          </CardContent>
        </Card>
      </ProfileCompletionGuard>
    </div>
  );
};

export default QuickActions;
