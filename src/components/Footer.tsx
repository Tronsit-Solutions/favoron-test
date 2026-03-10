import { Mail, MessageCircle, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Favoron Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Favoron</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Conectamos compradores y viajeros para hacer tus compras internacionales más fáciles y económicas.
            </p>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <div className="space-y-3">
              <a 
                href="mailto:info@unfavoron.com"
                className="flex items-center gap-2 text-gray-300 hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@unfavoron.com</span>
              </a>
              <a 
                href="https://wa.me/50230616015"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-success transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">+502 30616015</span>
              </a>
            </div>
          </div>

          {/* Síguenos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Síguenos</h4>
            <div className="space-y-3">
              <a 
                href="https://instagram.com/favoron_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-300 hover:text-pink-400 transition-colors"
              >
                <Instagram className="h-4 w-4" />
                <span className="text-sm">@favoron_</span>
              </a>
            </div>
          </div>

          {/* Enlaces útiles */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Enlaces útiles</h4>
            <div className="space-y-3">
              <Link 
                to="/terminos-y-condiciones"
                className="block text-gray-300 hover:text-primary transition-colors text-sm"
              >
                Términos y Condiciones
              </Link>
              <Link 
                to="/regulacion-aduanera"
                className="block text-gray-300 hover:text-primary transition-colors text-sm"
              >
                Regulación Aduanera
              </Link>
              <Link 
                to="/aviso-legal"
                className="block text-gray-300 hover:text-primary transition-colors text-sm"
              >
                Aviso Legal
              </Link>
              <Link 
                to="/trabaja-con-nosotros"
                className="block text-gray-300 hover:text-primary transition-colors text-sm"
              >
                Trabaja con nosotros
              </Link>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="text-center space-y-2">
            <p className="text-gray-300 text-sm">
              © {currentYear} Favoron. Todos los derechos reservados.
            </p>
            <p className="text-gray-400 text-xs">
              Favorón es una marca operada por Ingenierías Reunidas, Sociedad Anónima.
            </p>
            <p className="text-gray-400 text-xs">
              © 2025 Ingenierías Reunidas, S.A. – Guatemala
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;