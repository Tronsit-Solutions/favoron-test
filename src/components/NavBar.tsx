

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
  user?: any; // Add user prop to show user info
}

const NavBar = ({ onOpenAuth, showBackToDashboard, onBackToDashboard, isAuthenticated, onSignOut, user }: NavBarProps) => {
  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="relative bg-white/80 backdrop-blur-md border-b border-gray-100">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
        
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          {/* Logo - Smaller on mobile */}
          <Link to="/" className="flex items-center group">
            <img 
              src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
              alt="Favorón" 
              className="h-8 sm:h-10 w-auto transform group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Action Buttons - Updated for authenticated state */}
          <div className="flex items-center space-x-3">
            {showBackToDashboard && onBackToDashboard ? (
              <Button 
                variant="outline" 
                onClick={onBackToDashboard}
                size="sm"
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            ) : isAuthenticated ? (
              // Show user menu when authenticated
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="shadow-sm hover:shadow-md transition-all duration-200 border-gray-200 hover:border-gray-300"
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
                <DropdownMenuContent align="end" className="w-48">
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
                    <Link to="/" className="w-full">
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
            ) : (
              // Show login/register buttons when not authenticated
              <>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenAuth("login")}
                  size="sm"
                  className="hidden sm:flex shadow-sm hover:shadow-md transition-all duration-200 border-gray-200 hover:border-gray-300"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenAuth("login")}
                  size="sm"
                  className="sm:hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <LogIn className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => onOpenAuth("register")}
                  size="sm"
                  className="shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <span className="hidden sm:inline">Registrarse</span>
                  <span className="sm:hidden">Registro</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Secondary Navigation - Clean and minimal */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center space-x-8">
            <Link 
              to="/regulacion-aduanera" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Regulación Aduanera
            </Link>
            <div className="w-px h-4 bg-border"></div>
            <Link 
              to="/terminos-y-condiciones" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;

