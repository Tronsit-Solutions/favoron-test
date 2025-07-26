import NavBar from "@/components/NavBar";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, FileText, Shield } from "lucide-react";

const CustomsRegulation = () => {
  const navigate = useNavigate();

  const openAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <NavBar onOpenAuth={openAuth} />
      
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Regulación Aduanera
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Información importante sobre normas aduaneras para viajeros y compradores
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  Es responsabilidad de cada usuario conocer y cumplir con las regulaciones aduaneras 
                  correspondientes tanto en el país de origen como en el país de destino. 
                  Favorón facilita la conexión entre viajeros y compradores, pero no se hace responsable 
                  del cumplimiento de las normativas aduaneras.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-green-500" />
                  Para Viajeros
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-2 text-gray-700">
                  <li>• Verificar los límites de franquicia aduanera en su país de destino</li>
                  <li>• Declarar todos los productos adquiridos en el extranjero</li>
                  <li>• Conservar todas las facturas y comprobantes de compra</li>
                  <li>• Revisar la lista de productos prohibidos o restringidos</li>
                  <li>• Consultar sobre productos que requieren permisos especiales</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-purple-500" />
                  Para Compradores
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-2 text-gray-700">
                  <li>• Informarse sobre las restricciones de importación en su país</li>
                  <li>• Verificar si el producto requiere licencias especiales</li>
                  <li>• Estar preparado para pagar impuestos aduaneros si corresponde</li>
                  <li>• Proporcionar información precisa sobre el contenido del paquete</li>
                  <li>• Revisar las regulaciones sobre productos electrónicos, alimentos, medicamentos, etc.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-red-500" />
                  Productos Comúnmente Restringidos
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Generalmente Prohibidos:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Sustancias controladas</li>
                      <li>• Armas y municiones</li>
                      <li>• Productos falsificados</li>
                      <li>• Materiales peligrosos</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Requieren Permisos:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Medicamentos</li>
                      <li>• Productos orgánicos</li>
                      <li>• Electrónicos de alto valor</li>
                      <li>• Productos agrícolas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-blue-900 font-medium mb-2">
                    ⚠️ Aviso Importante
                  </p>
                  <p className="text-blue-800 text-sm">
                    Esta información es general y puede cambiar. Siempre consulte con las autoridades 
                    aduaneras oficiales para obtener información actualizada y específica para su situación.
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

export default CustomsRegulation;