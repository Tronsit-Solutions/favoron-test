import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CreditCard, Package2, CalendarIcon } from "lucide-react";
import { Package } from "@/types";
import QuoteCountdown from "../QuoteCountdown";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ShopperPackagePriorityActionsProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: 'user' | 'admin') => void;
  onRefresh?: () => void;
  onDeletePackage?: (pkg: Package) => void;
  onRequestRequote?: (pkg: Package) => void;
  onShowTimeline?: (packageId: string) => void;
}

const ShopperPackagePriorityActions = ({
  pkg,
  onQuote,
  onRefresh,
  onDeletePackage,
  onRequestRequote,
  onShowTimeline
}: ShopperPackagePriorityActionsProps) => {
  const { toast } = useToast();
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [newDeadline, setNewDeadline] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const isDeadlineExpired = new Date(pkg.delivery_deadline) < new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const handleRescheduleDeadline = async () => {
    if (!newDeadline) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({ delivery_deadline: newDeadline.toISOString() })
        .eq('id', pkg.id);
      if (error) throw error;
      toast({ title: "Fecha actualizada", description: "La nueva fecha límite fue guardada exitosamente." });
      setShowRescheduleDialog(false);
      setNewDeadline(undefined);
      onRefresh?.();
    } catch (err) {
      console.error('Error updating deadline:', err);
      toast({ title: "Error", description: "No se pudo actualizar la fecha límite.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuoteExpire = () => {
    toast({
      title: "⏰ Cotización expirada",
      description: "Esta cotización ha expirado. Puedes solicitar una nueva al viajero.",
      variant: "destructive"
    });
    onRefresh?.();
  };

  // Debug logging to see why countdown might not appear
  console.log('🕒 QuoteCountdown Debug:', {
    packageId: pkg.id,
    status: pkg.status,
    quote_expires_at: pkg.quote_expires_at,
    hasQuoteExpiresAt: !!pkg.quote_expires_at,
    isQuoteExpired: pkg.quote_expires_at ? new Date(pkg.quote_expires_at) <= new Date() : 'N/A',
    wants_requote: pkg.wants_requote
  });

  const isQuoteExpired = !!(pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date());

  // Define advanced states where timer and re-quote options should never appear
  const advancedStates = [
    'pending_purchase', 
    'purchase_confirmed', 
    'in_transit', 
    'pending_office_confirmation',
    'delivered_to_office',
    'ready_for_pickup', 
    'ready_for_delivery', 
    'delivered', 
    'completed',
    'received_by_traveler'
  ];

  // Nuevo: acción directa para solicitar re-cotización
  const handleRequestRequoteClick = async () => {
    console.log('🔁 Requesting re-quote for package:', pkg.id);
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({ status: 'approved', wants_requote: true })
        .eq('id', pkg.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      console.log('✅ Re-quote requested. Updated package:', data);
      toast({
        title: "Solicitud enviada",
        description: "Tu pedido volvió a 'aprobado' y se solicitará una nueva cotización.",
      });

      // Notificar al padre si necesita reaccionar
      onRequestRequote?.(pkg);
      // Refrescar datos
      onRefresh?.();
    } catch (err: any) {
      console.error('❌ Error requesting re-quote:', err);
      toast({
        title: "Error",
        description: "No se pudo solicitar la re-cotización. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getActionConfig = () => {
    switch (pkg.status) {
      case 'quote_sent':
        return {
          icon: Clock,
          title: isQuoteExpired ? "Cotización expirada" : "¡Tienes una cotización pendiente!",
          description: isQuoteExpired 
            ? "Esta cotización expiró. El viajero debe enviar una nueva cotización." 
            : "Revisa y responde la cotización del viajero.",
          button: isQuoteExpired ? null : {
            text: "Ver y Responder Cotización",
            onClick: () => onQuote(pkg, 'user')
          }
        };
      case 'quote_expired':
        return {
          icon: Clock,
          title: "⏰ Cotización expirada",
          description: "La cotización para este paquete ha expirado. Puedes contactar al viajero para solicitar una nueva.",
          button: null
        };
      case 'matched':
        return {
          icon: Package2,
          title: "👥 Asignado a viajero",
          description: "Tu paquete fue asignado a un viajero. Pronto recibirás una cotización.",
          button: null
        };
      case 'approved':
        if (isDeadlineExpired) {
          return {
            icon: Clock,
            title: "⚠️ Fecha límite vencida",
            description: "No logramos encontrar un viajero disponible antes de tu fecha límite. Puedes reprogramar una nueva fecha para seguir buscando.",
            button: {
              text: "Reprogramar fecha límite",
              onClick: () => setShowRescheduleDialog(true)
            }
          };
        }
        return {
          icon: Clock,
          title: "✅ Pedido aprobado",
          description: "Tu pedido fue aprobado y está pendiente de asignarse a un viajero disponible.",
          button: null
        };
      case 'quote_accepted':
        if (isQuoteExpired) {
          return {
            icon: Clock,
            title: "⏰ Cotización expirada",
            description: "Esta cotización expiró antes de completar el pago. Solicita una nueva cotización.",
            button: null
          };
        }
        return {
          icon: CreditCard,
          title: "¡Cotización aceptada!",
          description: "Tu cotización fue aceptada. Ahora debes realizar el pago para recibir la información de envío.",
          button: null
        };
      case 'payment_pending':
        if (isQuoteExpired) {
          return {
            icon: Clock,
            title: "⏰ Cotización expirada",
            description: "Esta cotización expiró antes de completar el pago. Solicita una nueva cotización.",
            button: null
          };
        }
        return {
          icon: CreditCard,
          title: "💰 Realizar Pago",
          description: "Transfiere el pago a la cuenta de Favorón S.A. y sube tu comprobante abajo.",
          button: null
        };
      case 'payment_pending_approval':
        return {
          icon: Clock,
          title: "⏳ Verificando pago",
          description: "Tu comprobante de pago está siendo verificado. Te notificaremos cuando sea aprobado.",
          button: null
        };
      case 'pending_purchase':
        return {
          icon: Package2,
          title: "¡Pago confirmado! 🛒 Tu turno de comprar",
          description: "Tu pago fue aprobado. Procede con la compra del artículo y adjunta el recibo junto con los datos de envío.",
          button: null
        };
      case 'purchase_confirmed':
        return {
          icon: Package2,
          title: "✅ Compra confirmada",
          description: "El viajero confirmó la compra. El producto está siendo enviado a su dirección.",
          button: null
        };
      case 'in_transit':
        return {
          icon: Package2,
          title: "📦 Producto en camino al viajero",
          description: "El shopper ha realizado la compra y va en camino a la dirección del viajero.",
          button: null
        };
      case 'pending_office_confirmation':
        return {
          icon: Clock,
          title: "📦 Esperando confirmación",
          description: "El viajero entregó el paquete en oficina. Esperando confirmación de recepción.",
          button: null
        };
      case 'delivered_to_office':
        return {
          icon: Package2,
          title: "📦 Entregado en oficina",
          description: "Tu paquete fue entregado y confirmado en la oficina de Favorón. Está listo para recoger o entregar.",
          button: null
        };
      case 'ready_for_pickup':
        return {
          icon: Package2,
          title: "✅ Listo para recoger",
          description: "Tu paquete está en la oficina de Favorón, listo para ser recogido.",
          button: null
        };
      case 'ready_for_delivery':
        return {
          icon: Package2,
          title: "🚛 Listo para entrega",
          description: "Tu paquete está en la oficina de Favorón, listo para ser entregado a domicilio.",
          button: null
        };
      case 'delivered':
        return {
          icon: Package2,
          title: "🎉 Entregado",
          description: "¡Tu paquete ha sido entregado exitosamente!",
          button: null
        };
      case 'completed':
        return {
          icon: Package2,
          title: "✅ Completado",
          description: "¡Solicitud completada exitosamente!",
          button: null
        };
      default:
        return {
          icon: Package2,
          title: "📦 Estado del paquete",
          description: "Revisa el estado actual de tu solicitud.",
          button: null
        };
    }
  };

  // Si el usuario ya pidió re-cotización y el pedido está aprobado, mostrar mensaje específico
  if (pkg.wants_requote && pkg.status === 'approved') {
    return (
      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <h4 className="font-medium text-emerald-900 dark:text-emerald-100">
                ✅ Re-cotización solicitada
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Tu pedido está nuevamente aprobado y pendiente de asignarse a un viajero disponible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = getActionConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <>
    <div className="space-y-4">
      <div 
        className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg cursor-pointer hover:from-primary/10 hover:to-primary/15 transition-colors"
        onClick={() => onShowTimeline?.(pkg.id)}
        title="Haz clic para ver el estado del paquete"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm font-medium text-primary">{config.title}</p>
            <p className="text-xs text-muted-foreground">
              {config.description}
              {pkg.status === 'quote_accepted' && (
                <span className="block mt-1 text-emerald-600 dark:text-emerald-400">
                  Una vez realizado el pago, se compartirá la dirección del viajero para el envío.
                </span>
              )}
            </p>
            {config.button && (
              <Button 
                size="sm"
                onClick={(e) => { e.stopPropagation(); config.button!.onClick(); }}
                className="mt-3"
              >
                {config.button.text}
              </Button>
            )}
            {/* Only show re-quote options for early states, not advanced processing states */}
            {(isQuoteExpired || pkg.status === 'quote_expired') && !advancedStates.includes(pkg.status) && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={handleRequestRequoteClick}>
                  Solicitar re-cotización
                </Button>
                {onDeletePackage && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.')) {
                        onDeletePackage(pkg);
                      }
                    }}
                  >
                    Eliminar pedido
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Countdown for active quotes - only while shopper is deciding */}
      {['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status) && 
       pkg.quote_expires_at && 
       !isQuoteExpired && (
        <div className="mb-4">
          <QuoteCountdown 
            expiresAt={pkg.quote_expires_at} 
            onExpire={handleQuoteExpire}
            compact={true}
          />
        </div>
      )}
    </div>

    {/* Reschedule deadline dialog */}
    <AlertDialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reprogramar fecha límite</AlertDialogTitle>
          <AlertDialogDescription>
            Selecciona una nueva fecha límite para tu pedido. Solo se permiten fechas futuras.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center py-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !newDeadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newDeadline ? format(newDeadline, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={newDeadline}
                onSelect={setNewDeadline}
                disabled={(date) => date < tomorrow}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button onClick={handleRescheduleDeadline} disabled={!newDeadline || isSaving}>
            {isSaving ? "Guardando..." : "Guardar nueva fecha"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ShopperPackagePriorityActions;
