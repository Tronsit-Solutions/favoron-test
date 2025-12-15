import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageCircle, Package, Plane, Shield, Users } from "lucide-react";
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
            {/* 1. Uso General de la Plataforma */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  📘 1. Uso General de la Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>Información verídica:</strong> Todos los usuarios deben crear una cuenta con información personal verídica.</li>
                  <li><strong>Solo envíos personales:</strong> Favorón solo permite envíos personales y no comerciales.</li>
                  <li><strong>Papel de intermediario de pagos:</strong> Favorón actúa como intermediario de pagos: cuando el shopper realiza un pago, Favorón recibe el dinero en nombre del viajero. Solo el monto correspondiente al servicio de Favorón constituye un ingreso propio de Favorón. El resto se transfiere al viajero.</li>
                  <li><strong>IVA:</strong> En consecuencia, Favorón solo cobrará IVA sobre la comisión que le corresponde por facilitar el servicio, y no sobre el monto total pagado por el shopper.</li>
                  <li><strong>Cumplimiento legal:</strong> Es responsabilidad del usuario cumplir con las leyes aduaneras y normativas locales (incluyendo la regulación CAUCA).</li>
                  <li><strong>Prohibición de evasión del sistema:</strong> No está permitido realizar acuerdos por fuera de la plataforma para evitar el pago de la comisión de Favorón. Si se detecta este comportamiento, Favorón podrá suspender o bloquear la cuenta del usuario involucrado.</li>
                  <li><strong>Derecho de rechazo:</strong> Favorón se reserva el derecho de rechazar usuarios, viajes o pedidos que no cumplan con las políticas internas.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 2. Para Shoppers */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-500" />
                  📦 2. Para Shoppers (quienes piden productos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>Solo compras online:</strong> Solo se aceptan productos comprados en tiendas online reconocidas (ej. Amazon, Zara, Apple). No se permiten artículos prohibidos ni sin número de seguimiento.</li>
                  <li><strong>Confirmación y seguimiento:</strong> El shopper debe enviar el comprobante de compra y número de seguimiento una vez realizada la compra.</li>
                  <li><strong>Tiempos de entrega:</strong> Las fechas son estimadas. No se garantizan entregas exactas, pero Favorón facilitará el proceso.</li>
                  <li><strong>Entrega segura:</strong> Los paquetes deben enviarse a la oficina de Favorón o a un lugar autorizado previamente acordado.</li>
                  <li><strong>Costes adicionales:</strong> Todo impuesto, tributo o gasto aduanero deberá ser cubierto por el shopper. Si el viajero incurre en estos pagos, el costo será trasladado al shopper.</li>
                  <li><strong>Retrasos en la entrega:</strong> Cada pedido tiene una fecha límite de llegada pactada. Si el paquete llega más tarde a la dirección del viajero, Favorón no se hace responsable por daños, pérdidas, vencimientos o inconvenientes derivados. Si esto ocurre, Favorón podrá ayudar a recuperarlo, pero pueden aplicarse cargos por gestión, recuperación o nuevo envío.</li>
                  <li><strong>Cobertura por pérdida o robo:</strong></li>
                    <ul className="ml-4 space-y-1 text-xs text-gray-600">
                      <li>• Si el paquete es robado por el viajero, Favorón reembolsa el 100% del valor (una vez validado el caso).</li>
                      <li>• Si la aerolínea pierde la maleta, se reembolsa el valor del paquete, pero no el costo del favorón.</li>
                    </ul>
                  <li><strong>Garantía limitada:</strong> Solo aplica si el viajero confirma que recibió el paquete. No cubre casos en los que el shopper nunca realizó la compra.</li>
                  <li><strong>Cancelaciones y reembolsos:</strong></li>
                    <ul className="ml-4 space-y-1 text-xs text-gray-600">
                      <li>• Si el pedido no llega o se cancela antes de 72 horas de la fecha de salida, se devuelve el 50% de la cotización.</li>
                      <li>• Si el paquete difiere considerablemente de la descripción proporcionada, Favorón podrá ajustar la cotización.</li>
                    </ul>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Para Viajeros */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Plane className="h-5 w-5 text-purple-500" />
                  ✈️ 3. Para Viajeros (quienes traen paquetes)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>Cumplimiento legal:</strong> El viajero es responsable de cumplir con todas las leyes aduaneras y normativas vigentes del país de salida y destino.</li>
                  <li><strong>Requisitos para traer paquetes:</strong> Solo se deben aceptar productos de tiendas online reconocidas. El paquete debe entregarse en la oficina de Favorón, salvo que se acuerde otra ubicación.</li>
                  <li><strong>Recepción del paquete:</strong> El viajero puede recibir los paquetes en una dirección de su elección (hotel, Airbnb, casa). Si hay costos asociados, deben incluirse en la cotización.</li>
                  <li><strong>Responsabilidad:</strong> El viajero debe entregar el paquete en buen estado. En caso de daño o pérdida por negligencia, será responsable.</li>
                  <li><strong>Deducción por daños:</strong> Si el paquete llega dañado por culpa del viajero, se podrá descontar el importe correspondiente de la propina (tip).</li>
                  <li><strong>Prohibiciones:</strong> No se aceptan paquetes con dinero en efectivo, artículos prohibidos, sin tracking o ilegales.</li>
                  <li><strong>Sanciones internas por incumplimiento grave:</strong> Si un viajero comete una falta grave como el robo de un paquete, Favorón podrá restringir su acceso a la plataforma y conservar su información en una lista interna de personas no autorizadas, con el fin de proteger a otros usuarios. Esta medida será confidencial y se gestionará conforme a las leyes de protección de datos aplicables.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Limitaciones de Responsabilidad */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-amber-500" />
                  ⚖️ 4. Limitaciones de Responsabilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>Papel de intermediario:</strong> Favorón no es una empresa de transporte ni courier. Solo actúa como intermediario.</li>
                  <li><strong>Problemas ajenos:</strong> No somos responsables por retrasos o problemas ajenos (aerolíneas, aduanas, etc.), aunque ayudaremos a resolverlos.</li>
                  <li><strong>Retrasos y perjuicios:</strong> Si un paquete llega tarde al viajero, Favorón no se hace responsable por pérdidas, vencimientos o perjuicios derivados.</li>
                  <li><strong>Responsabilidad limitada:</strong> La responsabilidad de Favorón se limita al valor declarado y comprobable del producto.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Notificaciones por WhatsApp */}
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-teal-500" />
                  📲 5. Notificaciones por WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">
                  Al usar Favorón, aceptas recibir notificaciones automáticas por WhatsApp relacionadas con:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Estado de pedidos</li>
                  <li>• Confirmaciones</li>
                  <li>• Recordatorios</li>
                  <li>• Soporte operativo</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  Estas notificaciones son enviadas desde números oficiales operados por Ingenierías Reunidas, S.A.
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditionsModal;