import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, Plane, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal = ({ isOpen, onClose }: TermsAndConditionsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Términos y Condiciones - Favorón
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Términos Generales de Uso */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  📘 Términos Generales de Uso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Al usar Favorón, aceptas estos términos. Si no estás de acuerdo, no uses el servicio.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">¿Qué es Favorón?</h4>
                    <p className="text-sm text-gray-700">Es una plataforma que conecta a personas que quieren enviar cosas (shoppers) con personas que viajan (viajeros) y pueden llevar esos paquetes en su equipaje.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">¿Quién puede usar Favorón?</h4>
                    <p className="text-sm text-gray-700">Cualquier persona mayor de edad que proporcione información real y cumpla con las leyes del país de origen y destino.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Datos personales</h4>
                    <p className="text-sm text-gray-700">Usamos tus datos solo para coordinar entregas. Nunca los compartimos con terceros sin tu permiso.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Buen trato</h4>
                    <p className="text-sm text-gray-700">Esperamos respeto y buena comunicación entre usuarios. Si alguien rompe las reglas, Favorón puede suspender su cuenta.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Pagos</h4>
                    <p className="text-sm text-gray-700">El shopper paga a Favorón. Una vez el viajero entrega el paquete, Favorón transfiere el pago al viajero.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Cambios</h4>
                    <p className="text-sm text-gray-700">Podemos modificar estos términos en cualquier momento. Si lo hacemos, te avisaremos.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Riesgos</h4>
                    <p className="text-sm text-gray-700">Aunque hacemos todo lo posible para que todo salga bien, Favorón es una plataforma colaborativa y pueden surgir imprevistos. Consulta nuestras garantías más abajo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Términos para Shoppers */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-500" />
                  📦 Términos para Shoppers (quienes hacen pedidos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
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
                  <Plane className="h-5 w-5 text-purple-500" />
                  ✈️ Términos para Viajeros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
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
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  ⚖️ Limitaciones de Responsabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>Favorón actúa solo como intermediario entre shoppers y viajeros.</li>
                  <li>No somos responsables por paquetes no entregados a tiempo al viajero.</li>
                  <li>No garantizamos el éxito de todos los envíos, pero ofrecemos garantías si se siguen nuestros procesos.</li>
                  <li>No asumimos responsabilidad por problemas causados por terceros como aerolíneas, aduanas o servicios de mensajería.</li>
                  <li>La garantía aplica solo si se respetan nuestras políticas, incluyendo el envío y entrega autorizados.</li>
                  <li>El contenido del paquete es responsabilidad exclusiva del shopper y viajero.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditionsModal;