import NavBar from "@/components/NavBar";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Scale, Shield, Users, Package, Plane, AlertTriangle, CheckCircle } from "lucide-react";

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
            {/* Términos Generales de Uso */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-500" />
                  📘 Términos Generales de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Al usar Favorón, aceptas estos términos. Si no estás de acuerdo, no uses el servicio.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">¿Qué es Favorón?</h4>
                    <p className="text-gray-700">Es una plataforma que conecta a personas que quieren enviar cosas (shoppers) con personas que viajan (viajeros) y pueden llevar esos paquetes en su equipaje.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">¿Quién puede usar Favorón?</h4>
                    <p className="text-gray-700">Cualquier persona mayor de edad que proporcione información real y cumpla con las leyes del país de origen y destino.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Datos personales</h4>
                    <p className="text-gray-700">Usamos tus datos solo para coordinar entregas. Nunca los compartimos con terceros sin tu permiso.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Buen trato</h4>
                    <p className="text-gray-700">Esperamos respeto y buena comunicación entre usuarios. Si alguien rompe las reglas, Favorón puede suspender su cuenta.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Pagos</h4>
                    <p className="text-gray-700">El shopper paga a Favorón. Una vez el viajero entrega el paquete, Favorón transfiere el pago al viajero.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cambios</h4>
                    <p className="text-gray-700">Podemos modificar estos términos en cualquier momento. Si lo hacemos, te avisaremos.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Riesgos</h4>
                    <p className="text-gray-700">Aunque hacemos todo lo posible para que todo salga bien, Favorón es una plataforma colaborativa y pueden surgir imprevistos. Consulta nuestras garantías más abajo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Términos para Shoppers */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-green-500" />
                  📦 Términos para Shoppers (quienes hacen pedidos)
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Tiempos de entrega estimados:</strong> Pueden variar. No garantizamos fechas exactas, pero facilitamos la entrega.</li>
                  <li><strong>Garantía por robo:</strong> Si un viajero roba el paquete, Favorón reembolsa el 100% del valor, una vez validado el caso.</li>
                  <li><strong>Pérdida de equipaje:</strong> Si la aerolínea pierde el equipaje del viajero, Favorón reembolsa el valor del paquete y el costo del envío.</li>
                  <li><strong>Retrasos en la entrega al viajero:</strong> Si el paquete no llega a tiempo al viajero antes de su viaje, el shopper asume ese riesgo.</li>
                  <li><strong>Impuestos y tributos:</strong> Si el viajero debe pagar impuestos o gastos de aduana, ese costo se traslada al shopper.</li>
                  <li><strong>Autenticidad de la compra:</strong> Solo se aceptan compras en tiendas online reconocidas. No se aceptan artículos sin número de seguimiento ni productos prohibidos.</li>
                  <li><strong>Entrega segura:</strong> Los paquetes deben ser enviados a la oficina de Favorón o al lugar autorizado.</li>
                  <li><strong>Verificación del paquete:</strong> La garantía aplica solo si el viajero confirma que recibió el paquete.</li>
                  <li><strong>Responsabilidad legal:</strong> El shopper debe respetar las regulaciones aduaneras, incluyendo el límite de USD 500 por paquete según CAUCA.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Términos para Viajeros */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Plane className="h-6 w-6 text-purple-500" />
                  ✈️ Términos para Viajeros
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Verificación de identidad:</strong> Todos los viajeros deben verificar su identidad.</li>
                  <li><strong>Recepción del paquete:</strong> El viajero debe confirmar que recibió el paquete. Si no lo recibe, Favorón no lo cubre.</li>
                  <li><strong>Responsabilidad durante el viaje:</strong> El viajero debe cuidar el paquete. Si se pierde por negligencia, deberá reembolsar su valor.</li>
                  <li><strong>Entrega en destino:</strong> El viajero debe entregar el paquete personalmente en la oficina de Favorón o punto acordado.</li>
                  <li><strong>Contenido del paquete:</strong> Está prohibido transportar artículos ilegales, peligrosos o no declarados correctamente.</li>
                  <li><strong>Declaración en aduanas:</strong> El viajero es responsable de cualquier declaración necesaria. Favorón puede dar apoyo, pero no se hace responsable.</li>
                  <li><strong>Gastos extra:</strong> Si el hotel cobra por recibir el paquete, ese costo debe incluirse en la cotización del viajero al shopper.</li>
                  <li><strong>Pérdida de equipaje:</strong> Si la aerolínea pierde el equipaje, Favorón se hace cargo del reembolso al shopper. El viajero no será penalizado si esto se demuestra.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Limitaciones de Responsabilidad */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  ⚖️ Limitaciones de Responsabilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="space-y-3 text-gray-700">
                  <li>Favorón actúa solo como intermediario entre shoppers y viajeros.</li>
                  <li>No somos responsables por paquetes no entregados a tiempo al viajero.</li>
                  <li>No garantizamos el éxito de todos los envíos, pero ofrecemos garantías si se siguen nuestros procesos.</li>
                  <li>No asumimos responsabilidad por problemas causados por terceros como aerolíneas, aduanas o servicios de mensajería.</li>
                  <li>La garantía aplica solo si se respetan nuestras políticas, incluyendo el envío y entrega autorizados.</li>
                  <li>El contenido del paquete es responsabilidad exclusiva del shopper y viajero.</li>
                </ul>
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