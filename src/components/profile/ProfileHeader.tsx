
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit2, X, User } from "lucide-react";

interface ProfileHeaderProps {
  user: any;
  userLevel: any;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}

const ProfileHeader = ({ user, userLevel, isEditing, onEdit, onCancel }: ProfileHeaderProps) => {
  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 self-center sm:self-auto">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="Foto de perfil" />
              ) : (
                <AvatarFallback className="text-xl sm:text-2xl">
                  {user.firstName?.[0] || user.lastName?.[0] ? (
                    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                  ) : (
                    <User className="h-6 w-6 sm:h-8 sm:w-8" />
                  )}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl sm:text-2xl">{user.name}</CardTitle>
              <CardDescription className="mt-1">
                {user.username ? `@${user.username}` : 'Sin nombre de usuario'}
              </CardDescription>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 mt-2">
                <Badge className={`${userLevel.color} text-white text-center`}>
                  {userLevel.level}
                </Badge>
                <Badge variant="outline" className="text-center">
                  Miembro desde {new Date(user.joinedAt).getFullYear()}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant={isEditing ? "destructive" : "outline"}
            onClick={isEditing ? onCancel : onEdit}
            className="w-full sm:w-auto"
            size="sm"
          >
            {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
            {isEditing ? "Cancelar" : "Editar Perfil"}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export default ProfileHeader;
