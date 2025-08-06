import { Button } from "@/components/ui/button";
import { Plane, LogIn, ArrowLeft, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";

interface NavBarProps {
  onOpenAuth: (mode: "login" | "register") => void;
  showBackToDashboard?: boolean;
  onBackToDashboard?: () => void;
  isAuthenticated?: boolean;
  onSignOut?: () => void;
}

const NavBar = ({ onOpenAuth, showBackToDashboard, onBackToDashboard, isAuthenticated, onSignOut }: NavBarProps) => {
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

          {/* Action Buttons - Keeping the ones you like */}
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
              <>
                <Button 
                  onClick={() => window.location.href = '/'}
                  size="sm"
                  variant="outline"
                  className="shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Panel</span>
                </Button>
                <Button 
                  onClick={onSignOut}
                  size="sm"
                  variant="destructive"
                  className="shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                  <span className="sm:hidden">Salir</span>
                </Button>
              </>
            ) : (
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

      {/* Sub Navigation Bar - Made smaller on mobile */}
      <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="container mx-auto px-4 py-1 sm:py-2">
          <div className="flex items-center justify-center space-x-4 sm:space-x-8">
            <Link 
              to="/regulacion-aduanera" 
              className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-200"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <span>Regulación Aduanera</span>
            </Link>
            <div className="w-px h-3 sm:h-4 bg-gray-300"></div>
            <Link 
              to="/terminos-y-condiciones" 
              className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50/50 transition-all duration-200"
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <span>Términos y Condiciones</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;
