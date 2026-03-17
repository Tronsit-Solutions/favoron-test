
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateQuoteForAdminStatusChange } from "@/utils/adminQuoteGeneration";
import { createNormalizedQuote } from "@/lib/quoteHelpers";
import { 
  Settings, 
  FileText, 
  Upload, 
  RefreshCcw, 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  User,
  Phone,
  ExternalLink,
  Save,
  X,
  CheckCircle,
  Package,
  DollarSign,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronDown,
  Truck,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";
import ProductTipAssignmentModal from "./ProductTipAssignmentModal";
import IncidentReasonModal from "./IncidentReasonModal";
import IncidentTimeline from "./IncidentTimeline";
import PackageProductDisplay from "@/components/dashboard/PackageProductDisplay";
import { useModalState } from "@/contexts/ModalStateContext";
import { formatDateUTC } from "@/lib/formatters";
import { sendWhatsAppNotification } from '@/lib/whatsappNotifications';

interface AdminActionsModalProps {
  modalId: string;
  trips: any[];
  onRefresh?: () => void | Promise<void>;
}

const AdminActionsModal = ({ modalId, trips, onRefresh }: AdminActionsModalProps) => {
  const { isModalOpen, closeModal, getModalData } = useModalState();
  const pkg = getModalData(modalId);
  const isOpen = isModalOpen(modalId);
  
  const [activeTab, setActiveTab] = useState("status");
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [internalNote, setInternalNote] = useState(pkg?.internal_notes || "");
  const [selectedTripId, setSelectedTripId] = useState(pkg?.matched_trip_id || "");
  const [adminNotes, setAdminNotes] = useState("");
  const [showProductTipModal, setShowProductTipModal] = useState(false);
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set());
  const [incidentModalAction, setIncidentModalAction] = useState<'mark' | 'resolve' | 'reopen' | null>(null);
  const [showIncidentTimeline, setShowIncidentTimeline] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { createPaymentOrder } = usePaymentOrders();
  const { getStatusBadge } = useStatusHelpers();
  const { fees } = usePlatformFeesContext();

  // Security: Only allow admin access
  if (!user || userRole?.role !== 'admin') {
    console.warn('🔒 Unauthorized access to AdminActionsModal:', { 
      userId: user?.id, 
      role: userRole?.role 
    });
    return null;
  }

  if (!pkg) return null;

  // Filter trips to exclude those with past arrival dates and only include approved/active
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const availableTrips = trips.filter(trip => {
    const isValidStatus = ['approved', 'active'].includes(trip.status);
    const isNotExpired = new Date(trip.arrival_date) >= today;
    return isValidStatus && isNotExpired;
  });
  
  // Check if package has multiple products
  const hasMultipleProducts = pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 1;
  
  // Debug: Log the raw data
  console.log('📦 Package data debug:', {
    id: pkg.id,
    products_data: pkg.products_data,
    item_description: pkg.item_description,
    estimated_price: pkg.estimated_price,
    item_link: pkg.item_link
  });
  
  // Properly construct products array with correct field names
  const products = pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0 
    ? pkg.products_data.map((product: any) => ({
        itemDescription: product.itemDescription || '',
        estimatedPrice: product.estimatedPrice?.toString() || '0',
        itemLink: product.itemLink || pkg.item_link || '',
        quantity: product.quantity ?? '1', // Use ?? to preserve '0' or other falsy values
        adminAssignedTip: product.adminAssignedTip || 0
      }))
    : [{
        itemDescription: pkg.item_description,
        estimatedPrice: pkg.estimated_price?.toString() || '0',
        itemLink: pkg.item_link,
        quantity: '1' // Legacy packages don't have quantity info
      }];

  const statusOptions = [
    { value: 'pending_approval', label: 'Pendiente de Aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'matched', label: 'Emparejado' },
    { value: 'quote_sent', label: 'Cotización Enviada' },
    { value: 'quote_accepted', label: 'Cotización Aceptada' },
    { value: 'awaiting_payment', label: 'Esperando Pago' },
    { value: 'pending_purchase', label: 'Pago Confirmado' },
    { value: 'in_transit', label: 'En Tránsito' },
    { value: 'received_by_traveler', label: 'Recibido por Viajero' },
    { value: 'pending_office_confirmation', label: 'Esperando Confirmación Oficina' },
    { value: 'delivered_to_office', label: 'Entregado en Oficina' },
    { value: 'ready_for_pickup', label: 'Listo para Recoger' },
    { value: 'ready_for_delivery', label: 'Listo para Envío' },
    { value: 'out_for_delivery', label: 'En Reparto' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const logAction = async (actionType: string, description: string, additionalData?: any) => {
    if (user) {
      await supabase.rpc('log_admin_action', {
        _package_id: pkg.id,
        _admin_id: user.id,
        _action_type: actionType,
        _action_description: description,
        _additional_data: additionalData
      });
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast({
        title: "Error",
        description: "Selecciona un nuevo estado",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let updateData: any = { status: newStatus };

      // Special handling for status change from "matched" to "quote_sent"
      if (pkg.status === 'matched' && newStatus === 'quote_sent') {
        console.log('🔄 Admin changing status from matched to quote_sent, generating quote...');
        
        // Unified flow: always write to package_assignments
        console.log('⚡ Writing quotes to package_assignments...');
        
        // Fetch all pending assignments for this package
        const { data: assignments, error: assignErr } = await supabase
          .from('package_assignments')
          .select('*')
          .eq('package_id', pkg.id)
          .in('status', ['bid_pending', 'bid_submitted']);
        
        if (assignErr) throw assignErr;
        if (!assignments || assignments.length === 0) {
          throw new Error('No hay asignaciones activas para este paquete.');
        }
        
        // Generate and save quote for each pending assignment
        const pendingAssignments = assignments.filter(a => a.status === 'bid_pending');
        if (pendingAssignments.length === 0) {
          throw new Error('No hay asignaciones pendientes. Todos los viajeros ya tienen cotización.');
        }
        
        for (const assignment of pendingAssignments) {
          const tipToUse = assignment.admin_assigned_tip || pkg.admin_assigned_tip;
          
          const quoteData = await generateQuoteForAdminStatusChange({
            packageId: pkg.id,
            currentPackage: { ...pkg, admin_assigned_tip: tipToUse },
            trips: trips,
            adminAssignedTip: tipToUse,
            overrideTripId: assignment.trip_id,
            rates: {
              standard: fees?.service_fee_rate_standard ?? 0.50,
              prime: fees?.service_fee_rate_prime ?? 0.25
            },
            fees: fees ? {
              delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
              delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
              delivery_fee_outside_city: fees.delivery_fee_outside_city,
              prime_delivery_discount: fees.prime_delivery_discount,
            } : undefined,
            destinationCountry: pkg.package_destination_country
          });
          
          const { error: updateAssignErr } = await supabase
            .from('package_assignments')
            .update({
              status: 'bid_submitted',
              quote: quoteData.quote as any,
              traveler_address: quoteData.traveler_address as any,
              matched_trip_dates: quoteData.matched_trip_dates as any,
              quote_expires_at: quoteData.quote_expires_at,
              updated_at: new Date().toISOString()
            })
            .eq('id', assignment.id);
          
          if (updateAssignErr) {
            console.error(`❌ Error updating assignment ${assignment.id}:`, updateAssignErr);
            throw updateAssignErr;
          }
          
          console.log(`✅ Assignment ${assignment.id} updated with quote`);
        }
        
        // Do NOT change the package status — it stays 'matched'
        await logAction('status_changed', `Cotización(es) enviada(s) a ${pendingAssignments.length} viajero(s)`);
        
        // Send WhatsApp notification to shopper
        if (pkg.user_id) {
          const firstQuoteData = await generateQuoteForAdminStatusChange({
            packageId: pkg.id,
            currentPackage: pkg,
            trips: trips,
            adminAssignedTip: pendingAssignments[0].admin_assigned_tip || pkg.admin_assigned_tip,
            overrideTripId: pendingAssignments[0].trip_id,
            rates: {
              standard: fees?.service_fee_rate_standard ?? 0.50,
              prime: fees?.service_fee_rate_prime ?? 0.25
            },
            fees: fees ? {
              delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
              delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
              delivery_fee_outside_city: fees.delivery_fee_outside_city,
              prime_delivery_discount: fees.prime_delivery_discount,
            } : undefined,
            destinationCountry: pkg.package_destination_country
          });
          
          const quoteTotal = firstQuoteData.quote?.totalPrice || 0;
          const productName = pkg.products_data?.[0]?.itemDescription || pkg.item_description || 'Tu pedido';
          
          sendWhatsAppNotification({
            userId: pkg.user_id,
            templateId: 'quote_received_v2',
            variables: {
              "2": `${Number(quoteTotal).toFixed(2)}`,
              "3": productName.substring(0, 50)
            }
          });
        }
        
        toast({
          title: "Cotizaciones enviadas",
          description: `Se enviaron cotizaciones a ${pendingAssignments.length} viajero(s). El paquete se mantiene en estado 'matched' hasta que el shopper elija.`
        });
        
        await onRefresh?.();
        closeModal(modalId);
        return;
      }

      // Guard: When admin moves to payment_pending, recalculate delivery fee if quote exists
      if (newStatus === 'payment_pending' && pkg.quote && pkg.status !== 'matched') {
        const currentQuote = pkg.quote as any;
        const basePrice = parseFloat(currentQuote.price || '0');
        const cityArea = (pkg.confirmed_delivery_address as any)?.cityArea;
        
        if (basePrice > 0) {
          const recalculatedQuote = createNormalizedQuote(
            basePrice,
            pkg.delivery_method || 'pickup',
            currentQuote.trustLevel || 'basic',
            currentQuote.message || '',
            true,
            cityArea || pkg.package_destination,
            fees ? { standard: fees.service_fee_rate_standard, prime: fees.service_fee_rate_prime } : undefined,
            fees ? {
              delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
              delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
              delivery_fee_outside_city: fees.delivery_fee_outside_city,
              prime_delivery_discount: fees.prime_delivery_discount,
            } : undefined,
            pkg.package_destination_country
          );
          
          // Preserve discount data if present
          const finalQuote: any = { ...recalculatedQuote };
          if (currentQuote.discountCode) {
            finalQuote.discountCode = currentQuote.discountCode;
            finalQuote.discountCodeId = currentQuote.discountCodeId;
            finalQuote.discountAmount = currentQuote.discountAmount;
            finalQuote.originalTotalPrice = recalculatedQuote.totalPrice;
            finalQuote.finalTotalPrice = recalculatedQuote.totalPrice - (currentQuote.discountAmount || 0);
          }
          
          console.log('🔧 Admin→payment_pending: recalculated delivery fee', {
            oldFee: currentQuote.deliveryFee,
            newFee: recalculatedQuote.deliveryFee,
            cityArea,
          });
          
          updateData.quote = finalQuote;
        }
      }

      const { error } = await supabase
        .from('packages')
        .update(updateData)
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction('status_changed', `Estado cambiado de ${pkg.status} a ${newStatus}`);
      
      // 📱 Enviar notificación WhatsApp cuando admin cambia a quote_sent (single-assignment only)
      if (newStatus === 'quote_sent' && pkg.user_id && updateData.quote) {
        const quoteTotal = updateData.quote.totalPrice || 0;
        const productName = pkg.products_data?.[0]?.itemDescription || pkg.item_description || 'Tu pedido';
        
        sendWhatsAppNotification({
          userId: pkg.user_id,
          templateId: 'quote_received_v2',
          variables: {
            "2": `${quoteTotal.toFixed(2)}`,
            "3": productName.substring(0, 50)
          }
        });
      }
      
      toast({
        title: "Estado actualizado",
        description: `El estado se cambió a ${statusOptions.find(s => s.value === newStatus)?.label}${newStatus === 'quote_sent' ? ' y se generó la cotización automáticamente' : ''}`
      });

      await onRefresh?.();
      closeModal(modalId);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTripReassignment = async () => {
    if (!selectedTripId) {
      toast({
        title: "Error",
        description: "Selecciona un viaje",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Determinar tip correcto: usar admin_assigned_tip existente o calcular desde quote
      let adminAssignedTip = pkg?.admin_assigned_tip ? parseFloat(pkg.admin_assigned_tip.toString()) : undefined;
      
      // Fallback: si no hay admin_assigned_tip pero hay quote, calcular el tip real (sin comisión Favorón)
      if (!adminAssignedTip && pkg?.quote?.price) {
        const totalPaid = parseFloat(pkg.quote.price);
        adminAssignedTip = totalPaid / 1.15; // Revertir la comisión del 15%
      }

      // Determinar si el paquete ya está pagado (para no borrar recibos), pero SIEMPRE pasar a 'matched'
      const isPaid = pkg?.status && ['pending_purchase', 'purchase_confirmed', 'paid', 'shipped', 'in_transit', 'received_by_traveler', 'delivered', 'delivered_to_office'].includes(pkg.status);

      // Preparar actualización: mover a 'matched' para que el nuevo viajero ACEPTE; limpiar dirección y fechas
      const updatePayload: any = {
        matched_trip_id: selectedTripId,
        status: 'matched',
        traveler_address: null,
        matched_trip_dates: null,
        quote: null,
        // No limpiar purchase_confirmation y tracking_info para paquetes pagados
        ...(isPaid ? {} : { purchase_confirmation: null, tracking_info: null }),
        // Guardar tip asignado administrativamente si existe
        ...(adminAssignedTip ? { admin_assigned_tip: adminAssignedTip } : {}),
        matched_assignment_expires_at: null,
        quote_expires_at: null,
      };

      // Asegurar que en paquetes de un solo producto el tip quede también dentro de products_data
      if (adminAssignedTip !== undefined) {
        const isSingleProduct = Array.isArray(products) && products.length === 1;
        if (isSingleProduct) {
          const onlyProduct = { ...products[0], adminAssignedTip };
          updatePayload.products_data = [onlyProduct];
        }
      }

      const { error } = await supabase
        .from('packages')
        .update(updatePayload)
        .eq('id', pkg.id);

      if (error) throw error;

      const selectedTrip = availableTrips.find(t => t.id === selectedTripId);
      await logAction(
        'trip_reassigned',
        `Paquete reasignado al viaje ${selectedTrip?.from_city} → ${selectedTrip?.to_city}`,
        {
          new_trip_id: selectedTripId,
          requires_traveler_acceptance: true,
          admin_assigned_tip: adminAssignedTip ?? null,
        }
      );
      
      toast({
        title: "Reasignado correctamente",
        description: "El nuevo viajero tiene 24h para aceptar. El shopper verá instrucciones cuando el viajero acepte.",
      });

      await onRefresh?.();
      closeModal(modalId);
    } catch (error) {
      console.error('Error reassigning trip:', error);
      toast({
        title: "Error",
        description: "No se pudo reasignar el viaje",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate total value of packages for a specific trip
  const calculateTripPackagesTotal = (tripId: string) => {
    // Include all statuses from quote_sent onwards, excluding quote_expired and quote_rejected
    const validStatuses = ['quote_sent', 'payment_pending', 'paid', 'pending_purchase', 'in_transit', 'delivered_to_office', 'received_by_traveler', 'completed'];
    
    const tripPackages = pkg?.packages?.filter(pkg => 
      pkg.matched_trip_id === tripId && 
      validStatuses.includes(pkg.status)
    ) || [];

    return tripPackages.reduce((total, pkg) => {
      if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
        // Sum all products: quantity * estimatedPrice
        const productsTotal = pkg.products_data.reduce((productSum, product) => {
          const price = parseFloat(product.estimatedPrice || '0');
          const quantity = parseInt(product.quantity || '1');
          return productSum + (price * quantity);
        }, 0);
        return total + productsTotal;
      } else {
        // Fallback to estimated_price
        return total + parseFloat(pkg.estimated_price || '0');
      }
    }, 0);
  };

  const toggleTripExpansion = (tripId: string) => {
    const newExpanded = new Set(expandedTrips);
    if (newExpanded.has(tripId)) {
      newExpanded.delete(tripId);
    } else {
      newExpanded.add(tripId);
    }
    setExpandedTrips(newExpanded);
  };

  const handleTripSelection = (tripId: string) => {
    setSelectedTripId(tripId);
  };

  const handleSaveInternalNote = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('packages')
        .update({ internal_notes: internalNote })
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction('internal_note_added', 'Nota interna agregada/actualizada');
      
      toast({
        title: "Nota guardada",
        description: "La nota interna se guardó correctamente"
      });

      onRefresh?.();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la nota",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Incident management

  const handleIncidentAction = async (text: string) => {
    if (!incidentModalAction || !user) return;
    setIsLoading(true);
    try {
      // Fetch current incident_history from DB
      const { data: currentPkg } = await supabase
        .from('packages')
        .select('incident_history')
        .eq('id', pkg.id)
        .single();

      const currentHistory: any[] = (currentPkg?.incident_history as any[]) || [];

      const newEntry = {
        action: incidentModalAction === 'mark' ? 'marked' : incidentModalAction === 'resolve' ? 'resolved' : 'reopened',
        timestamp: new Date().toISOString(),
        admin_id: user.id,
        admin_name: `Admin`,
        ...(incidentModalAction === 'resolve' ? { resolution_notes: text } : { reason: text }),
      };

      const updatedHistory = [...currentHistory, newEntry];
      const newStatus = incidentModalAction === 'resolve' ? 'resolved' : 'active';
      const newFlag = incidentModalAction === 'resolve' ? true : true; // flag stays true in all cases

      const { error } = await supabase
        .from('packages')
        .update({
          incident_flag: newFlag,
          incident_status: newStatus,
          incident_history: updatedHistory,
        })
        .eq('id', pkg.id);

      if (error) throw error;

      const actionLabel = incidentModalAction === 'mark' ? 'incident_marked' : incidentModalAction === 'resolve' ? 'incident_resolved' : 'incident_reopened';
      const descLabel = incidentModalAction === 'mark' ? 'Incidencia marcada' : incidentModalAction === 'resolve' ? 'Incidencia resuelta' : 'Incidencia reabierta';

      await logAction(actionLabel, descLabel, { text });

      toast({
        title: descLabel,
        description: incidentModalAction === 'resolve' 
          ? 'La incidencia fue resuelta y queda registrada en el historial'
          : incidentModalAction === 'reopen'
          ? 'La incidencia fue reabierta'
          : 'Se registró la incidencia con la razón proporcionada',
      });

      await onRefresh?.();
      closeModal(modalId);
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la incidencia",
        variant: "destructive"
      });
      throw error; // Propagate to modal
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    console.log('🔍 WhatsApp open attempt:', {
      packageId: pkg.id,
      profileExists: !!pkg.profiles,
      phoneNumber: pkg.profiles?.phone_number,
      phoneType: typeof pkg.profiles?.phone_number,
      phoneLength: pkg.profiles?.phone_number?.length
    });
    
    if (pkg.profiles?.phone_number) {
      const phone = pkg.profiles.phone_number.replace(/[^\d]/g, '');
      const message = `Hola! Te contacto desde Favorón respecto a tu pedido #${(pkg?.id || '').slice(0, 8)}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleConfirmDelivery = async (action: 'confirm' | 'reject') => {
    setIsLoading(true);
    try {
      if (action === 'confirm') {
        // Confirmar entrega y crear payment order
        const travelerBankInfo = pkg.office_delivery?.traveler_declaration?.bank_info;
        const travelerDeclaration = pkg.office_delivery?.traveler_declaration;
        
        if (!travelerBankInfo || !travelerDeclaration) {
          throw new Error('Información bancaria o declaración del viajero no encontrada');
        }

        // Crear la confirmación del admin
        const adminConfirmation = {
          timestamp: new Date().toISOString(),
          admin_id: user?.id,
          notes: adminNotes,
          confirmed: true
        };

        // Actualizar el paquete con la confirmación del admin
        const updatedOfficeDelivery = {
          ...pkg.office_delivery,
          admin_confirmation: adminConfirmation,
          status: 'confirmed'
        };

        await supabase
          .from('packages')
          .update({
            status: 'delivered_to_office',
            office_delivery: updatedOfficeDelivery
          })
          .eq('id', pkg.id);

        // Crear orden de pago si hay quote
        if (pkg.quote?.price) {
          await createPaymentOrder({
            trip_id: pkg.matched_trip_id,
            traveler_id: travelerDeclaration.traveler_id,
            amount: parseFloat(pkg.quote.price),
            bank_account_holder: travelerBankInfo.bank_account_holder,
            bank_name: travelerBankInfo.bank_name,
            bank_account_type: travelerBankInfo.bank_account_type,
            bank_account_number: travelerBankInfo.bank_account_number,
            notes: `Entrega confirmada por admin. ${adminNotes}`.trim(),
            status: 'pending'
          });
        }

        await logAction('delivery_confirmed', 'Entrega confirmada por admin y orden de pago creada');

        toast({
          title: "Entrega confirmada",
          description: "La entrega se confirmó y se creó la orden de pago para el viajero",
        });

      } else {
        // Rechazar entrega - volver a in_transit
        const adminConfirmation = {
          timestamp: new Date().toISOString(),
          admin_id: user?.id,
          notes: adminNotes,
          confirmed: false
        };

        const updatedOfficeDelivery = {
          ...pkg.office_delivery,
          admin_confirmation: adminConfirmation,
          status: 'rejected'
        };

        await supabase
          .from('packages')
          .update({
            status: 'in_transit',
            office_delivery: updatedOfficeDelivery
          })
          .eq('id', pkg.id);

        await logAction('delivery_rejected', 'Entrega rechazada por admin');

        toast({
          title: "Entrega rechazada",
          description: "La entrega fue rechazada. El viajero puede volver a declarar entrega.",
          variant: "destructive"
        });
      }

      await onRefresh?.();
      closeModal(modalId);

    } catch (error) {
      console.error('Error processing delivery confirmation:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la confirmación de entrega",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductTipSave = async (productsWithTips: any[], totalTip: number) => {
    setIsLoading(true);
    try {
      // Ensure adminAssignedTip is always stored in products_data for consistency
      const normalizedProducts = productsWithTips.map(product => ({
        ...product,
        adminAssignedTip: product.adminAssignedTip || 0 // Ensure field exists even if 0
      }));

      // Update the package with the new products data including individual tips
      const { error } = await supabase
        .from('packages')
        .update({
          products_data: normalizedProducts,
          admin_assigned_tip: totalTip,
          status: 'matched' // Set to matched so traveler can accept
        })
        .eq('id', pkg.id);

      if (error) throw error;

      await logAction('product_tips_assigned', `Tips asignados por producto. Total: Q${totalTip.toFixed(2)}`);
      
      toast({
        title: "Tips asignados",
        description: `Se asignaron tips individuales por un total de Q${totalTip.toFixed(2)}`,
      });

      onRefresh?.();
      setShowProductTipModal(false);
    } catch (error) {
      console.error('Error saving product tips:', error);
      toast({
        title: "Error",
        description: "No se pudieron asignar los tips",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {incidentModalAction && (
        <IncidentReasonModal
          isOpen={!!incidentModalAction}
          onClose={() => setIncidentModalAction(null)}
          onConfirm={handleIncidentAction}
          action={incidentModalAction}
        />
      )}
      <ProductTipAssignmentModal
        key={pkg.id}
        isOpen={showProductTipModal}
        onClose={() => setShowProductTipModal(false)}
        onSave={handleProductTipSave}
        products={products}
        packageId={pkg.id}
      />
    <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Acciones Administrativas - #{(pkg?.id || '').slice(0, 8)}</span>
          </DialogTitle>
          <DialogDescription>
            Gestiona este pedido con herramientas administrativas
          </DialogDescription>
        </DialogHeader>

        {/* Package Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  {hasMultipleProducts 
                    ? `Pedido de ${products.length} productos`
                    : pkg.item_description
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {pkg.profiles ? `${pkg.profiles.first_name} ${pkg.profiles.last_name}` : `Usuario: ${(pkg?.user_id || '').slice(0, 8)}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {pkg.incident_flag && (
                  <Badge variant="destructive" className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Incidencia</span>
                  </Badge>
                )}
                {hasMultipleProducts && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Package className="h-3 w-3" />
                    <span>{products.length} productos</span>
                  </Badge>
                )}
                <Badge variant="outline">
                  ${hasMultipleProducts 
                    ? products.reduce((sum: number, p: any) => {
                        const price = parseFloat(p.estimatedPrice || '0');
                        const quantity = parseInt(p.quantity || '1');
                        return sum + (price * quantity);
                      }, 0).toFixed(2)
                    : pkg.estimated_price
                  }
                </Badge>
              </div>
            </div>
            
            {/* Quick tip assignment for multiple products */}
            {hasMultipleProducts && (
              <div className="mt-3 pt-3 border-t">
                <Button
                  onClick={() => setShowProductTipModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Asignar Tips por Producto</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* NEW: Product breakdown for admins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desglose de productos</CardTitle>
            <CardDescription>Detalle de cada producto solicitado</CardDescription>
          </CardHeader>
          <CardContent>
            <PackageProductDisplay products={products} />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${pkg.status === 'pending_office_confirmation' ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="reassign">Reasignar</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            {pkg.status === 'pending_office_confirmation' && (
              <TabsTrigger value="delivery">Confirmar Entrega</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCcw className="h-4 w-4" />
                  <span>Cambiar Estado Manualmente</span>
                </CardTitle>
                <CardDescription>
                  Actualiza el estado del pedido para resolver incidencias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Estado actual: {getStatusBadge(pkg.status)}</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecciona nuevo estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleStatusChange} 
                  disabled={isLoading || !newStatus}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Cambiar Estado
                </Button>

                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Gestión de Incidencia</p>
                  
                  {/* Show current incident status */}
                  {pkg.incident_flag && (
                    <div className={`flex items-center gap-2 p-2 rounded text-sm ${
                      pkg.incident_status === 'resolved' || (!pkg.incident_status && !pkg.incident_flag)
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {(pkg.incident_status === 'resolved') ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Incidencia resuelta</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          <span>Incidencia activa</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Action buttons based on current state */}
                  {!pkg.incident_flag ? (
                    <Button 
                      onClick={() => setIncidentModalAction('mark')}
                      variant="destructive"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Marcar como Incidencia
                    </Button>
                  ) : pkg.incident_status === 'resolved' ? (
                    <Button 
                      onClick={() => setIncidentModalAction('reopen')}
                      variant="outline"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reabrir Incidencia
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setIncidentModalAction('resolve')}
                      variant="default"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver Incidencia
                    </Button>
                  )}

                  {/* Show timeline toggle */}
                  {pkg.incident_history && (pkg.incident_history as any[]).length > 0 && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowIncidentTimeline(!showIncidentTimeline)}
                        className="w-full text-muted-foreground"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {showIncidentTimeline ? 'Ocultar historial' : `Ver historial (${(pkg.incident_history as any[]).length})`}
                      </Button>
                      {showIncidentTimeline && (
                        <div className="border rounded-lg p-3">
                          <IncidentTimeline history={pkg.incident_history as any[]} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reassign" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCcw className="h-4 w-4" />
                  <span>Reasignar a Otro Viaje</span>
                </CardTitle>
                <CardDescription>
                  Cambia el viaje asignado a este pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.matched_trip_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-800">Viaje actual asignado</p>
                    <p className="text-sm text-blue-700">ID: {pkg.matched_trip_id.slice(0, 8)}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="trip">Seleccionar nuevo viaje</Label>
                  {availableTrips.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      No hay viajes disponibles para reasignar
                    </p>
                  ) : (
                    <ScrollArea className="h-[400px] mt-2">
                      <div className="space-y-3">
                        {availableTrips.map(trip => (
                          <Card 
                            key={trip.id} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedTripId === trip.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleTripSelection(trip.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {/* Traveler Name */}
                                  <div className="flex items-center space-x-2 mb-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      Viajero #{(trip?.user_id || '').slice(0, 8)}
                                    </span>
                                  </div>

                                  {/* Trip Route */}
                                  <div className="flex items-center space-x-2 mb-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">
                                      {trip.from_city} → {trip.to_city}
                                    </span>
                                  </div>

                                  {/* Trip Dates */}
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Llegada: {formatDateUTC(trip.arrival_date)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Truck className="h-3 w-3" />
                                      <span>Entrega: {formatDateUTC(trip.delivery_date)}</span>
                                    </div>
                                  </div>

                                  {/* Trip Info */}
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      {trip.status === 'approved' ? 'Aprobado' : 'Activo'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      ID: {(trip?.id || '').slice(0, 8)}
                                    </Badge>
                                    {calculateTripPackagesTotal(trip.id) > 0 && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                        ${calculateTripPackagesTotal(trip.id).toFixed(2)} asignados
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Expand Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTripExpansion(trip.id);
                                  }}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                >
                                  {expandedTrips.has(trip.id) ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </div>

                              {/* Expandable Content */}
                              {expandedTrips.has(trip.id) && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <p className="font-medium text-muted-foreground mb-1">VIAJERO</p>
                                      <p className="text-sm">Viajero #{(trip?.user_id || '').slice(0, 8)}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium text-muted-foreground mb-1">MÉTODO</p>
                                      <p className="text-sm">
                                        {trip.delivery_method === 'pickup' ? 'Recoger' : 
                                         trip.delivery_method === 'delivery' ? 'Entregar' : 'No especificado'}
                                      </p>
                                    </div>
                                    {trip.receiving_window && (
                                      <div className="col-span-2">
                                        <p className="font-medium text-muted-foreground mb-1">VENTANA DE RECEPCIÓN</p>
                                        <div className="flex items-center space-x-1">
                                          <Package className="h-3 w-3 text-primary" />
                                          <span className="text-sm">
                                            {new Date(trip.receiving_window.start).toLocaleDateString('es-GT')} - {new Date(trip.receiving_window.end).toLocaleDateString('es-GT')}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <Button 
                  onClick={handleTripReassignment}
                  disabled={isLoading || !selectedTripId || availableTrips.length === 0}
                  className="w-full"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reasignar Viaje
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Notas Internas</span>
                </CardTitle>
                <CardDescription>
                  Agrega notas internas para seguimiento administrativo (no visibles para el usuario)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="internal-note">Nota interna</Label>
                  <Textarea
                    id="internal-note"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Agregar nota interna sobre este pedido..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleSaveInternalNote}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Nota
                </Button>

                {/* Action Log */}
                {pkg.admin_actions_log && pkg.admin_actions_log.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Historial de Acciones Administrativas</span>
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pkg.admin_actions_log.map((action: any, index: number) => (
                        <div key={index} className="text-xs bg-muted p-2 rounded">
                          <p className="font-medium">{action.description}</p>
                          <p className="text-muted-foreground">
                            {new Date(action.timestamp).toLocaleString('es-GT')} • 
                            Admin: {(action?.admin_id || '').slice(0, 8)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Información de Contacto</span>
                </CardTitle>
                <CardDescription>
                  Herramientas rápidas para contactar al cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.profiles && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pkg.profiles.first_name} {pkg.profiles.last_name}</p>
                        <p className="text-sm text-muted-foreground">{pkg.profiles.email}</p>
                        {pkg.profiles.phone_number && (
                          <p className="text-sm text-muted-foreground">{pkg.profiles.phone_number}</p>
                        )}
                      </div>
                    </div>

                    {pkg.profiles.phone_number && (
                      <Button 
                        onClick={openWhatsApp}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Abrir WhatsApp
                      </Button>
                    )}

                    <Button 
                      onClick={() => window.open(`mailto:${pkg.profiles.email}?subject=Favorón - Pedido #${(pkg?.id || '').slice(0, 8)}`, '_blank')}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Enviar Email
                    </Button>
                  </div>
                )}

                {pkg.item_link && (
                  <div className="pt-4 border-t">
                    <Label>Link del producto</Label>
                    <Button 
                      onClick={() => window.open(pkg.item_link, '_blank')}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Producto Original
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {pkg.status === 'pending_office_confirmation' && (
            <TabsContent value="delivery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirmar Recepción de Entrega</span>
                  </CardTitle>
                  <CardDescription>
                    El viajero declaró que entregó este paquete. Confirma o rechaza la recepción.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Información de la declaración del viajero */}
                  {pkg.office_delivery?.traveler_declaration && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Declaración del Viajero
                      </h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Método:</strong> {pkg.office_delivery.traveler_declaration.delivery_method === 'oficina' ? 'Oficina Favorón' : 'Mensajero'}</p>
                        <p><strong>Fecha:</strong> {new Date(pkg.office_delivery.traveler_declaration.timestamp).toLocaleString('es-GT')}</p>
                        {pkg.office_delivery.traveler_declaration.notes && (
                          <p><strong>Notas:</strong> {pkg.office_delivery.traveler_declaration.notes}</p>
                        )}
                        <p><strong>Pago a procesar:</strong> Q{pkg.quote?.price || '0.00'}</p>
                      </div>
                    </div>
                  )}

                  {/* Notas del admin */}
                  <div>
                    <Label htmlFor="admin-notes">Notas administrativas</Label>
                    <Textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Agregar notas sobre la confirmación/rechazo de la entrega..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleConfirmDelivery('reject')}
                      disabled={isLoading}
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rechazar Entrega
                    </Button>
                    <Button 
                      onClick={() => handleConfirmDelivery('confirm')}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? "Procesando..." : "Confirmar y Pagar"}
                    </Button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      <strong>Importante:</strong> Al confirmar, se creará automáticamente la orden de pago para el viajero 
                      y se acumulará en su cuenta para la próxima transferencia.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => closeModal(modalId)}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AdminActionsModal;
