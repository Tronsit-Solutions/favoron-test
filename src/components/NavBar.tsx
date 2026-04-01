
import { Button } from "@/components/ui/button";
import { Plane, LogIn, ArrowLeft, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavBarProps {
  onOpenAuth: (mode: "login" | "register") => void;
  showBackToDashboard?: boolean;
  onBackToDashboard?: () => void;
  isAuthenticated?: boolean;
  onSignOut?: () => void;
  user?: any;
  loading?: boolean;
}

const NavBar = ({ onOpenAuth, showBackToDashboard, onBackToDashboard, isAuthenticated, onSignOut, user, loading }: NavBarProps) => {
  console.log('🔍 NavBar Debug:', {
    isAuthenticated,
    hasUser: !!user,
    loading,
    showBackToDashboard
  });
  return (
    <nav className="bg-white border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
            alt="Favorón" 
            width="120"
            height="40"
            className="h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {showBackToDashboard && onBackToDashboard ? (
            <Button 
              variant="outline" 
              onClick={onBackToDashboard}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
          ) : isAuthenticated && !loading ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-border"
                >
                  <Avatar className="h-5 w-5 mr-2">
                    {user?.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt="Foto de perfil" />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="hidden sm:inline">Mi Cuenta</span>
                  <User className="h-4 w-4 sm:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg z-50">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user?.email || 'Usuario'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    Ir al Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : loading ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block h-8 w-28 bg-muted animate-pulse rounded-md" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            </div>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenAuth("login")}
                size="sm"
                className="hidden sm:flex border-border"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onOpenAuth("login")}
                size="sm"
                className="sm:hidden"
              >
                <LogIn className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => onOpenAuth("register")}
                size="sm"
              >
                <span className="hidden sm:inline">Registrarse</span>
                <span className="sm:hidden">Registro</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
