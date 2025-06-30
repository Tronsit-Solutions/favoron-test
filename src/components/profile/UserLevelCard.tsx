
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface UserLevelCardProps {
  userLevel: any;
}

const UserLevelCard = ({ userLevel }: UserLevelCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Tu Nivel: {userLevel.level}</span>
        </CardTitle>
        <CardDescription>{userLevel.next}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso al siguiente nivel</span>
            <span>{Math.round(userLevel.progress)}%</span>
          </div>
          <Progress value={userLevel.progress} className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserLevelCard;
