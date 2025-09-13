
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown, Sparkles } from "lucide-react";

interface UserLevelCardProps {
  userLevel: any;
}

const UserLevelCard = ({ userLevel }: UserLevelCardProps) => {
  const isPrime = userLevel.isPrime;
  const trustLevel = userLevel.trustLevel;

  return (
    <Card className={isPrime ? "border-purple-200 bg-gradient-to-br from-purple-50 to-white" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isPrime ? (
              <Crown className="h-5 w-5 text-purple-600" />
            ) : (
              <TrendingUp className="h-5 w-5" />
            )}
            <span>Tu Nivel: {userLevel.level}</span>
          </div>
          {isPrime && (
            <Badge className="bg-purple-600 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              Prime
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isPrime ? "¡Disfruta de todos los beneficios Prime!" : userLevel.next}
        </CardDescription>
        {trustLevel && trustLevel !== 'basic' && !isPrime && (
          <Badge variant="outline" className="w-fit">
            Confianza: {trustLevel === 'earned' ? 'Ganada' : trustLevel === 'verified' ? 'Verificada' : trustLevel}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {!isPrime && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso al siguiente nivel</span>
              <span>{Math.round(userLevel.progress)}%</span>
            </div>
            <Progress value={userLevel.progress} className="w-full" />
          </div>
        )}
        {isPrime && (
          <div className="space-y-2">
            <div className="text-sm text-purple-700">
              ✓ Menores comisiones en todas las transacciones
            </div>
            <div className="text-sm text-purple-700">
              ✓ Entrega gratuita con mensajería
            </div>
            <div className="text-sm text-purple-700">
              ✓ Soporte prioritario
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserLevelCard;
