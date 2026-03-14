import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Users, Home, Sparkles, Settings, Eye, UserCog, Package, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import type { ViewMode } from "@/hooks/useDashboardState";

interface DashboardHeaderProps {
  user: any;
  onShowProfile: () => void;
  onLogout: () => void;
  onShowUserManagement?: () => void;
  onGoHome?: () => void;
  onShowPrime?: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

const DashboardHeader = ({ user, onShowProfile, onLogout, onShowUserManagement, onGoHome, onShowPrime, viewMode, onViewModeChange }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const viewModeLabels: Record<ViewMode, { label: string; icon: React.ReactNode; description: string }> = {
    user: { label: 'Usuario', icon: <User className="h-4 w-4" />, description: 'Ver como usuario normal' },
    admin: { label: 'Admin', icon: <UserCog className="h-4 w-4" />, description: 'Panel de administración' },
    operations: { label: 'Operations', icon: <Package className="h-4 w-4" />, description: 'Panel de operaciones' },
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleHomeClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      navigate('/dashboard');
    }
  };


  const handlePrimeClick = () => {
    if (onShowPrime) {
      onShowPrime();
    }
  };

  const isPrimeUser = user?.trustLevel === 'prime' || user?.trust_level === 'prime';

  return (
    <header className="border-b bg-background sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="w-full px-4 py-3 sm:py-4 lg:px-8 xl:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
            alt="Favorón Logo" 
            className="h-6 sm:h-8 w-auto cursor-pointer"
            onClick={handleLogoClick}
          />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleHomeClick}
            className="flex items-center"
          >
            <Home className="h-4 w-4" />
          </Button>
          
          {/* Botón prominente para usuarios con rol admin u operations */}
          {(user.role === 'operations' || user.role === 'admin') && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/operations')}
              className="flex items-center bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              <Package className="h-4 w-4" />
            </Button>
          )}
          
          {/* Botón de WhatsApp para admins */}
          {user.role === 'admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/whatsapp')}
              className="flex items-center bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
          
          {/* Botón de Control Admin */}
          {user.role === 'admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin/control')}
              className="flex items-center bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          
          <NotificationDropdown userId={user.id} userRole={user.role} />
          
          {user.role === 'admin' && onShowUserManagement && (
            <Button variant="outline" size="sm" onClick={onShowUserManagement}>
              <Users className="h-4 w-4" />
            </Button>
          )}
          
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-1 sm:space-x-2">
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                  {user?.avatarUrl || user?.avatar_url ? (
                    <AvatarImage src={user?.avatarUrl || user?.avatar_url} alt="Foto de perfil" />
                  ) : (
                    <AvatarFallback className="text-xs">
                      {user?.name?.[0] || user?.firstName?.[0] || user?.first_name?.[0] || 'U'}
                    </AvatarFallback>
                  )}
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
              {user.role === 'admin' && onViewModeChange && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    Cambiar Vista
                  </DropdownMenuLabel>
                  {(Object.keys(viewModeLabels) as ViewMode[]).map((mode) => (
                    <DropdownMenuItem 
                      key={mode}
                      onClick={() => onViewModeChange(mode)}
                      className={viewMode === mode ? 'bg-accent' : ''}
                    >
                      {viewModeLabels[mode].icon}
                      <span className="ml-2">{viewModeLabels[mode].label}</span>
                      {viewMode === mode && (
                        <span className="ml-auto text-xs text-primary">●</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}
              {user.role === 'operations' && (
                <DropdownMenuItem onClick={() => navigate('/operations')}>
                  <Package className="h-4 w-4 mr-2" />
                  Panel de Operaciones
                </DropdownMenuItem>
              )}
              {user.role === 'admin' && (
                <DropdownMenuItem onClick={() => navigate('/admin/control')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Control Admin
                </DropdownMenuItem>
              )}
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
