
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Plane, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";

interface DashboardHeaderProps {
  user: any;
  onShowProfile: () => void;
  onLogout: () => void;
  onShowUserManagement?: () => void;
}

const DashboardHeader = ({ user, onShowProfile, onLogout, onShowUserManagement }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
            alt="Favorón Logo" 
            className="h-6 sm:h-8 w-auto"
          />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <NotificationDropdown userId={user.id} userRole={user.role} />
          
          {user.role === 'admin' && onShowUserManagement && (
            <>
              <Button variant="outline" size="sm" onClick={onShowUserManagement} className="hidden sm:flex">
                <Users className="h-4 w-4 mr-2" />
                Gestión de Usuarios
              </Button>
              <Button variant="outline" size="sm" onClick={onShowUserManagement} className="sm:hidden">
                <Users className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-1 sm:space-x-2">
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                  <AvatarFallback className="text-xs">
                    {user?.name?.[0] || user?.firstName?.[0] || user?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm">Mi Perfil</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">
                  {user?.name || `${user?.firstName || user?.first_name || ''} ${user?.lastName || user?.last_name || ''}`.trim() || 'Usuario'}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onShowProfile}>
                <User className="h-4 w-4 mr-2" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
