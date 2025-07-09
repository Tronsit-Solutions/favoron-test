
import { Button } from "@/components/ui/button";
import { Plane, LogIn } from "lucide-react";

interface NavBarProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const NavBar = ({ onOpenAuth }: NavBarProps) => {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-logo rounded-xl flex items-center justify-center">
            <Plane className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bricolage font-extrabold text-logo">Favorón</h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
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
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
