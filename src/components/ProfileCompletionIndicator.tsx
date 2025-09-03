import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, UserCheck } from "lucide-react";

interface ProfileCompletionIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const ProfileCompletionIndicator = ({ 
  className = "", 
  showDetails = true 
}: ProfileCompletionIndicatorProps) => {
  const { isComplete, completionPercentage, missingFields } = useProfileCompletion();

  if (isComplete) {
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

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium">Completa tu perfil</span>
        </div>
        <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
      </div>
      
      <Progress value={completionPercentage} className="h-2" />
      
      {showDetails && missingFields.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Faltan: {missingFields.join(', ')}
        </p>
      )}
    </div>
  );
};

export default ProfileCompletionIndicator;