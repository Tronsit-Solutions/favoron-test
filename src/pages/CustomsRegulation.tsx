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
          <div className="text-center mb-8 sm:mb-12 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Package className="h-32 w-32 text-gray-400" />
            </div>
            
            <div className="relative">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <Shield className="h-8 w-8" />
                </div>
                <div className="h-px bg-gradient-to-r from-blue-500 to-transparent w-16"></div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Regulación Aduanera
                </span>
              </h1>
              
              <div className="max-w-3xl mx-auto">
                <p className="text-xl sm:text-2xl text-gray-600 font-medium mb-3">
                  Tu guía completa para un comercio internacional seguro
                </p>
                <p className="text-lg text-gray-500">
                  Información esencial sobre normas aduaneras para viajeros y compradores
                </p>
              </div>
              
              {/* Decorative elements */}
              <div className="flex justify-center mt-6 gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:gap-8">
            {/* New Regulation Details Section */}
            <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  📜 Artículo 114 del CAUCA – Exención del pago de tributos para mercancías distintas del equipaje
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <div className="space-y-6">
                  <p className="text-gray-700 leading-relaxed font-medium">
                    El viajero podrá introducir con exención de tributos mercancías que traiga consigo, distintas del equipaje, cuyo valor total en aduana no sea superior a <span className="font-bold text-green-600">$500 USD</span>.
                  </p>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      ❓ ¿Qué significa "distintas del equipaje"?
                    </h4>
                    <p className="text-gray-700 mb-3">
                      Según el CAUCA, el equipaje incluye efectos personales, nuevos o usados, que un viajero pueda necesitar razonablemente para su uso durante el viaje, así como artículos vinculados a su actividad profesional.
                    </p>
                    <p className="text-gray-700">
                      🔸 Por tanto, <strong>"distintas del equipaje"</strong> se refiere a mercancías que no son para uso personal del viajero, sino que están destinadas a terceras personas o con fines comerciales —como los productos que transportan nuestros viajeros de Favorón para los shoppers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  📘 Artículo 582 del RECAUCA – Condiciones para gozar de la exención
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Para beneficiarse de esta exención, el viajero debe cumplir con las siguientes condiciones:
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✅</span>
                    <span>Que las mercancías, por su cantidad y clase, no sean para fines comerciales.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">⛔</span>
                    <span>Que no se trate de mercancías prohibidas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">🕒</span>
                    <span>Que haya permanecido al menos <strong>72 horas</strong> fuera del territorio aduanero.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">📌</span>
                    <span>Cumplir cualquier otra condición establecida por la legislación nacional.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                  ⚠️ Condiciones adicionales importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-2 text-gray-700">
                  <li>• Este beneficio puede utilizarse <strong>una vez cada seis meses</strong>.</li>
                  <li>• Es de carácter <strong>personal e intransferible</strong>.</li>
                  <li>• <strong>No es acumulativo</strong>.</li>
                  <li>• Se considera totalmente utilizado en un solo viaje, sin importar el monto usado.</li>
                  <li>• Tripulantes (conductores, pilotos, capitanes) solo pueden traer efectos personales libres de tributos.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-green-600" />
                  ✅ ¿Qué significa esto para Favorón?
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    Esta regulación permite que nuestros viajeros traigan productos hasta por <strong className="text-green-600">$500 USD</strong> sin pagar impuestos, siempre que cumplan con las condiciones mencionadas.
                  </p>
                  <p className="text-green-700 font-medium bg-white rounded-lg p-3 border border-green-200">
                    👉 Esto hace que el servicio de Favorón sea <strong>completamente legal, seguro y beneficioso</strong> para viajeros y shoppers.
                  </p>
                </div>
              </CardContent>
            </Card>

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