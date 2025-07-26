
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
    <nav className="relative bg-white/80 backdrop-blur-md border-b border-gray-100">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30"></div>
      
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
        {/* Logo - Simplified */}
        <Link to="/" className="flex items-center group">
          <img 
            src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" 
            alt="Favorón" 
            className="h-10 w-auto transform group-hover:scale-105 transition-transform duration-200"
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
  );
};

export default NavBar;
