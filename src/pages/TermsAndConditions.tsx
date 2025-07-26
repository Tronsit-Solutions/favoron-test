import NavBar from "@/components/NavBar";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, Shield, Users } from "lucide-react";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  const openAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <NavBar onOpenAuth={openAuth} />
      
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Scale className="h-32 w-32 text-gray-400" />
            </div>
            
            <div className="relative">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="h-px bg-gradient-to-r from-green-500 to-transparent w-16"></div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Términos y Condiciones
                </span>
              </h1>
              
              <div className="max-w-3xl mx-auto">
                <p className="text-xl sm:text-2xl text-gray-600 font-medium mb-3">
                  Marco legal y condiciones de uso
                </p>
                <p className="text-lg text-gray-500">
                  Todo lo que necesitas saber sobre el uso de la plataforma Favorón
                </p>
              </div>
              
              {/* Decorative elements */}
              <div className="flex justify-center mt-6 gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:gap-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                  1. Aceptación de Términos
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Al utilizar los servicios de Favorón, usted acepta estos términos y condiciones en su totalidad. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-green-500" />
                  2. Descripción del Servicio
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Favorón es una plataforma que conecta viajeros con compradores para facilitar el envío 
                  de paquetes desde el extranjero. Nuestro servicio incluye:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Conexión entre viajeros y compradores</li>
                  <li>• Sistema de cotizaciones y pagos</li>
                  <li>• Seguimiento de paquetes y entregas</li>
                  <li>• Sistema de calificaciones y confianza</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-purple-500" />
                  3. Responsabilidades del Usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Viajeros:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Cumplir con las regulaciones aduaneras</li>
                      <li>• Entregar los paquetes en tiempo y forma</li>
                      <li>• Mantener la integridad de los productos</li>
                      <li>• Comunicar cualquier inconveniente</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Compradores:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Proporcionar información precisa</li>
                      <li>• Realizar pagos en tiempo acordado</li>
                      <li>• Cumplir con las especificaciones</li>
                      <li>• Estar disponible para la entrega</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Scale className="h-6 w-6 text-amber-500" />
                  4. Limitación de Responsabilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Favorón actúa únicamente como intermediario entre viajeros y compradores. No nos hacemos responsables por:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Pérdida o daño de paquetes durante el transporte</li>
                  <li>• Incumplimiento de regulaciones aduaneras</li>
                  <li>• Disputas entre usuarios</li>
                  <li>• Demoras en entregas debido a factores externos</li>
                  <li>• Calidad o autenticidad de los productos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-red-500" />
                  5. Política de Pagos y Reembolsos
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-2 text-gray-700">
                  <li>• Los pagos se procesan a través de métodos seguros</li>
                  <li>• Los reembolsos están sujetos a términos específicos</li>
                  <li>• Favorón se reserva el derecho de retener pagos en caso de disputas</li>
                  <li>• Las comisiones de la plataforma no son reembolsables</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-indigo-500" />
                  6. Privacidad y Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Protegemos la privacidad de nuestros usuarios de acuerdo con nuestra Política de Privacidad. 
                  Al usar nuestros servicios, usted consiente el procesamiento de sus datos personales 
                  según se describe en dicha política.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-gray-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-gray-500" />
                  7. Modificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Las modificaciones entrarán en vigor inmediatamente después de su publicación. 
                  Es responsabilidad del usuario revisar periódicamente estos términos.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-blue-900 font-medium mb-2">
                    📞 Contacto
                  </p>
                  <p className="text-blue-800 text-sm">
                    Para consultas sobre estos términos y condiciones, puede contactarnos a través 
                    de los canales oficiales de Favorón.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;