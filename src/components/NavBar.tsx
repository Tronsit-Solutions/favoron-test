
import { Button } from "@/components/ui/button";
import { Plane, LogIn, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface NavBarProps {
  onOpenAuth: (mode: "login" | "register") => void;
  showBackToDashboard?: boolean;
  onBackToDashboard?: () => void;
}

const NavBar = ({ onOpenAuth, showBackToDashboard, onBackToDashboard }: NavBarProps) => {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
              alt="Favorón Logo" 
              className="h-8 sm:h-10 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/regulacion-aduanera" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Regulación Aduanera
            </Link>
            <Link 
              to="/terminos-y-condiciones" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Términos y Condiciones
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
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
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenAuth("login")}
                size="sm"
                className="hidden sm:flex"
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
