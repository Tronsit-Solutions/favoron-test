
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit2, User, Star } from "lucide-react";
import EditProfileModal from "./EditProfileModal";

interface ProfileHeaderProps {
  user: any;
  userLevel: any;
  onUpdateUser: (userData: any) => void;
  onCardClick?: () => void;
}

const ProfileHeader = ({ user, userLevel, onUpdateUser, onCardClick }: ProfileHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Card className={onCardClick ? "cursor-pointer transition-colors" : ""} onClick={onCardClick}>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 self-center sm:self-auto">
                {user.avatarUrl || user.avatar_url ? (
                  <AvatarImage src={user.avatarUrl || user.avatar_url} alt="Foto de perfil" />
                ) : (
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {user.firstName?.[0] || user.first_name?.[0] || user.lastName?.[0] || user.last_name?.[0] ? (
                      `${user.firstName?.[0] || user.first_name?.[0] || ''}${user.lastName?.[0] || user.last_name?.[0] || ''}`
                    ) : (
                      <User className="h-6 w-6 sm:h-8 sm:w-8" />
                    )}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl">
                  {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Sin nombre'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {user.username ? `@${user.username}` : 'Sin nombre de usuario'}
                </CardDescription>
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 mt-2">
                  {userLevel.isPrime ? (
                    <Badge className="bg-purple-600 text-white text-center">
                      <Star className="h-3 w-3 mr-1" />
                      {userLevel.level}
                    </Badge>
                  ) : (
                    <Badge className={`${userLevel.color} text-white text-center`}>
                      {userLevel.level}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-center">
                    Miembro desde {new Date(user.joinedAt || user.created_at).getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </CardHeader>
      </Card>

      <EditProfileModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateUser={onUpdateUser}
      />
    </>
  );
};

export default ProfileHeader;
