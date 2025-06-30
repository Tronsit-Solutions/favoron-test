
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
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Favorón</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => onOpenAuth("login")}>
            <LogIn className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </Button>
          <Button onClick={() => onOpenAuth("register")}>
            Registrarse
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
