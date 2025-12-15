import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Building, Globe, Mail } from "lucide-react";

const AvisoLegal = () => {
  const navigate = useNavigate();
  const openAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <NavBar onOpenAuth={openAuth} />
      
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Scale className="h-32 w-32 text-gray-400" />
            </div>
            
            <div className="relative">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <Scale className="h-8 w-8" />
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Aviso Legal
                </span>
              </h1>
              
              <p className="text-xl text-gray-600">
                Información legal y corporativa
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Building className="h-6 w-6 text-indigo-500" />
                  Información de la Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Favorón es una marca comercial operada por Ingenierías Reunidas, Sociedad Anónima.
                </p>
                
                <div className="grid gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Razón social</p>
                      <p className="text-gray-600">Ingenierías Reunidas, S.A.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">País</p>
                      <p className="text-gray-600">Guatemala</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Sitio web</p>
                      <a 
                        href="https://favoron.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        https://favoron.app
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Correo de contacto</p>
                      <a 
                        href="mailto:info@favoron.app" 
                        className="text-indigo-600 hover:underline"
                      >
                        info@favoron.app
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AvisoLegal;
