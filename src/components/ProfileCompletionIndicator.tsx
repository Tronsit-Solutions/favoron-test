import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, UserCheck, AlertCircle, Lock } from "lucide-react";

interface ProfileCompletionIndicatorProps {
  className?: string;
  showDetails?: boolean;
  variant?: 'default' | 'banner' | 'compact';
  onCompleteProfile?: () => void;
}

const ProfileCompletionIndicator = ({ 
  className = "", 
  showDetails = true,
  variant = 'default',
  onCompleteProfile
}: ProfileCompletionIndicatorProps) => {
  const { isComplete, completionPercentage, missingFields } = useProfileCompletion();

  if (isComplete) {
    if (variant === 'banner') {
      return null; // Banner variant doesn't show when complete
    }
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <UserCheck className="h-3 w-3 mr-1" />
          Perfil Completo
        </Badge>
      </div>
    );
  }

  // Banner variant - very prominent warning
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-lg shadow-lg border-l-4 border-red-600 ${className}`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-bold mb-2">
                ⚠️ Perfil Incompleto - No Puedes Usar la Plataforma
              </h3>
              <p className="text-sm opacity-90 mb-3">
                <strong>Tu cuenta está bloqueada:</strong> Necesitas completar tu información para solicitar paquetes y registrar viajes.
              </p>
              <div className="flex items-center space-x-2 mb-3">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Campos faltantes: {missingFields.join(', ')}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all duration-300" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs mt-1 block opacity-75">
                  {completionPercentage}% completado
                </span>
              </div>
              
              {onCompleteProfile && (
                <Button 
                  onClick={onCompleteProfile}
                  className="bg-white text-red-600 hover:bg-gray-50 font-semibold px-6 py-2 shadow-md"
                  size="sm"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Completar Perfil Ahora
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - for header or small spaces
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <Lock className="h-3 w-3 mr-1" />
          Perfil Incompleto
        </Badge>
      </div>
    );
  }

  // Default variant - improved version
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span className="font-medium text-amber-800">⚠️ Completa tu perfil para usar la plataforma</span>
        </div>
        <span className="text-sm font-medium text-amber-700">{completionPercentage}%</span>
      </div>
      
      <Progress value={completionPercentage} className="h-3" />
      
      {showDetails && missingFields.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-amber-700">
            <strong>Faltan:</strong> {missingFields.join(', ')}
          </p>
          {onCompleteProfile && (
            <Button 
              onClick={onCompleteProfile}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Completar Ahora
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionIndicator;