
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="Foto de perfil" />
              ) : (
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0] || user.lastName?.[0] ? (
                    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription>
                {user.username ? `@${user.username}` : 'Sin nombre de usuario'}
              </CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`${userLevel.color} text-white`}>
                  {userLevel.level}
                </Badge>
                <Badge variant="outline">
                  Miembro desde {new Date(user.joinedAt).getFullYear()}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant={isEditing ? "destructive" : "outline"}
            onClick={isEditing ? onCancel : onEdit}
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
