import { useState, useEffect, useRef, memo } from "react";
import { useGlobalCountdown } from "@/hooks/useGlobalCountdown";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, Package, ExternalLink, Calendar, DollarSign, CheckCircle, XCircle, FileText, Receipt, Truck, Home, MapPin, Camera, CheckCircle2, Edit2, Save, X, Star, Ban, Clock, Globe, Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { inferCountryFromCity } from '@/lib/cities';
import { normalizeProductUrl } from '@/lib/validators';
import { normalizeConfirmations } from '@/utils/confirmationHelpers';

// Country/city options (same as PackageRequestForm)
// Online purchases: foreign stores only (no Guatemala)
const onlinePurchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Panamá', label: 'Panamá' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Honduras', label: 'Honduras' },
  { value: 'China', label: 'China' },
  { value: 'Otro', label: 'Otro' }
];

// Personal packages: can originate from Guatemala
const personalPackageOrigins = [
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Panamá', label: 'Panamá' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'Honduras', label: 'Honduras' },
  { value: 'China', label: 'China' },
  { value: 'Otro', label: 'Otro' }
];

const destinationCountries = [
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro país' }
];

const citiesByCountry: Record<string, string[]> = {
  'Guatemala': [
    'Cualquier ciudad', 'Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla',
    'Cobán', 'Huehuetenango', 'Mazatenango', 'Puerto Barrios',
    'Retalhuleu', 'Zacapa', 'Petén/Flores', 'Otra ciudad'
  ],
  'Estados Unidos': [
    'Cualquier ciudad', 'Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago',
    'San Francisco', 'Dallas', 'Atlanta', 'Phoenix',
    'Las Vegas', 'Orlando', 'Washington D.C.', 'Otra ciudad'
  ],
  'España': [
    'Cualquier ciudad', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga',
    'Bilbao', 'Zaragoza', 'Granada', 'Palma de Mallorca',
    'San Sebastián', 'Otra ciudad'
  ],
  'México': [
    'Cualquier ciudad', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún',
    'Tijuana', 'Puebla', 'León', 'Mérida', 'Querétaro',
    'Toluca', 'Otra ciudad'
  ],
  'Otro': ['Cualquier ciudad', 'Otra ciudad']
};
import AdminProductCancellationModal from "./AdminProductCancellationModal";
import { canCancelProduct } from "@/lib/refundCalculations";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import PaymentReceiptViewer from "./PaymentReceiptViewer";
import PurchaseConfirmationViewer from "./PurchaseConfirmationViewer";
import TrackingInfoViewer from "./TrackingInfoViewer";
import FavoronPaymentReceiptViewer from "./FavoronPaymentReceiptViewer";
import FavoronPaymentReceiptUpload from "./FavoronPaymentReceiptUpload";
import PaymentReceiptUpload from "@/components/dashboard/shopper/PaymentReceiptUpload";
import PurchaseConfirmationUpload from "@/components/PurchaseConfirmationUpload";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import RejectionReasonDisplay from "./RejectionReasonDisplay";
import RejectionReasonModal from "./RejectionReasonModal";
import { useModalState } from "@/contexts/ModalStateContext";
import { useAuth } from "@/hooks/useAuth";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { parseStorageRef } from "@/lib/storageUrls";
import { usePackageDetails } from "@/hooks/usePackageDetails";
import { QuoteRecalculator } from "./QuoteRecalculator";
import QuoteEditModal from "./QuoteEditModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneDisplay } from "@/lib/phoneUtils";
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";

// Mini-component for live countdown on each assignment
const AssignmentCountdown = memo(({ expiresAt }: { expiresAt: string }) => {
  const { hours, minutes, seconds, isExpired } = useGlobalCountdown(expiresAt);
  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
        <Clock className="h-3.5 w-3.5" />
        <span>Expirado</span>
      </div>
    );
  }
  const isUrgent = hours < 2;
  return (
    <div className={`flex items-center gap-2 text-xs mt-1 ${isUrgent ? 'text-destructive' : 'text-amber-600'}`}>
      <Clock className="h-3.5 w-3.5" />
      <span className="font-mono">
        ⏱ {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
      </span>
    </div>
  );
});
AssignmentCountdown.displayName = 'AssignmentCountdown';

// Mini-component for quote expiration countdown
const QuoteExpirationCountdown = memo(({ expiresAt }: { expiresAt: string }) => {
  const { hours, minutes, seconds, isExpired } = useGlobalCountdown(expiresAt);
  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive/70 mt-1">
        <Clock className="h-3.5 w-3.5" />
        <span>Cotización expirada</span>
      </div>
    );
  }
  const isUrgent = hours < 2;
  return (
    <div className={`flex items-center gap-2 text-xs mt-1 ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
      <Clock className="h-3.5 w-3.5" />
      <span className="font-mono">
        💬 {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
      </span>
    </div>
  );
});
QuoteExpirationCountdown.displayName = 'QuoteExpirationCountdown';

// Component to display a single product photo with signed URL resolution
const ProductPhoto = ({ photo, idx, productId, productDescription, onImageClick }: { 
  photo: string | { bucket: string; filePath: string; previewUrl?: string };
  idx: number; 
  productId: number; 
  productDescription: string;
  onImageClick: (url: string, title: string, filename: string) => void;
}) => {
  // Support both plain URLs and storage refs { bucket, filePath }
  const isObj = typeof photo === 'object' && photo !== null && 'bucket' in photo && 'filePath' in photo;
  const rawInput = isObj ? `${(photo as { bucket: string; filePath: string }).bucket}/${(photo as { bucket: string; filePath: string }).filePath}` : (photo as string);
  const { url: resolvedPhotoUrl, loading } = useSignedUrl(rawInput);
  
  if (loading) {
    return (
      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 animate-pulse">
        <div className="w-full h-full flex items-center justify-center">
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }
  
  if (!resolvedPhotoUrl) {
    return (
      <div className="relative aspect-square rounded-lg overflow-hidden border border-red-200 bg-red-50">
        <div className="w-full h-full flex items-center justify-center text-xs text-red-600">
          Error al cargar
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => onImageClick(
        resolvedPhotoUrl,
        `Foto ${idx + 1} - ${productDescription}`,
        `producto_${productId}_foto_${idx + 1}`
      )}
    >
      <img 
        src={resolvedPhotoUrl} 
        alt={`Foto ${idx + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
        Foto {idx + 1}
      </div>
    </div>
  );
};
interface PackageDetailModalProps {
  modalId: string;
  trips: any[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onUpdatePackage?: (id: string, updates: any) => void;
}

const PackageDetailModal = ({ modalId, trips, onApprove, onReject, onUpdatePackage }: PackageDetailModalProps) => {
  const { isModalOpen, closeModal, getModalData } = useModalState();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { getServiceFeeRate, getDeliveryFee, rates } = usePlatformFeesContext();
  const pkgLight = getModalData(modalId); // Lightweight data from list
  const isOpen = isModalOpen(modalId);
  
  // Load heavy fields on-demand when modal opens
  const { details: heavyDetails, loading: loadingDetails, refetch: refetchPackageDetails } = usePackageDetails(isOpen ? pkgLight?.id : null);
  
  // Merge light and heavy data
  const pkg = pkgLight && heavyDetails ? { ...pkgLight, ...heavyDetails } : pkgLight;
  
  // Extract request type from products_data JSONB field
  const packageRequestType = Array.isArray(pkg?.products_data) 
    ? (pkg?.products_data[0] as any)?.requestType 
    : 'online';
  
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{url: string, title: string, filename: string} | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [inlineNotesEdit, setInlineNotesEdit] = useState(false);
  const [inlineNotesValue, setInlineNotesValue] = useState('');
const [editForm, setEditForm] = useState({
    purchase_origin: '',
    package_destination: '',
    additional_notes: ''
  });
  const [selectedDestinationCountry, setSelectedDestinationCountry] = useState<string>('');
  const [editProducts, setEditProducts] = useState<Array<{
    itemDescription: string;
    estimatedPrice: string;
    quantity: string;
    itemLink: string;
    additionalNotes?: string;
    adminAssignedTip?: number;
    requestType?: string;
    weight?: string;
    instructions?: string;
    needsOriginalPackaging?: boolean;
    [key: string]: any;
  }>>([]);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [loadingPaymentOrder, setLoadingPaymentOrder] = useState(false);
  const [adminCancellationModal, setAdminCancellationModal] = useState<{
    isOpen: boolean;
    product: any;
    productIndex: number;
  } | null>(null);
  
  // State for admin product confirmation modal
  const [adminConfirmProductModal, setAdminConfirmProductModal] = useState<{
    isOpen: boolean;
    product: any;
    productIndex: number;
  } | null>(null);
  
  // State for quote edit modal
  const [quoteEditModalOpen, setQuoteEditModalOpen] = useState(false);
  
  // State for admin photo upload
  const [uploadingPhotoForProduct, setUploadingPhotoForProduct] = useState<number | null>(null);
  const adminPhotoInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoProductIndex, setPendingPhotoProductIndex] = useState<number | null>(null);
  
  // State for rejection history profiles
  const [rejectionProfiles, setRejectionProfiles] = useState<Record<string, any>>({});
  const [loadingRejectionProfiles, setLoadingRejectionProfiles] = useState(false);

  // State for multi-traveler assignments
  const [packageAssignments, setPackageAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Resolve traveler confirmation photo (handles storage paths and signed URLs)
  // Must call this hook before any early returns to follow Rules of Hooks
  const rawTravelerPhoto = pkg?.traveler_confirmation?.photo || pkg?.traveler_confirmation?.photoUrl;
  const { url: resolvedTravelerPhotoUrl } = useSignedUrl(rawTravelerPhoto);

  // Initialize edit form when package data changes
  useEffect(() => {
    if (pkg) {
      // Initialize products for editing
      if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
        setEditProducts(pkg.products_data.map((p: any) => ({
          ...p, // Preserve all existing fields
          itemDescription: p.itemDescription || '',
          estimatedPrice: p.estimatedPrice?.toString() || '0',
          quantity: (p.quantity ?? '1').toString(), // Use ?? to preserve falsy values
          itemLink: p.itemLink || '',
          additionalNotes: p.additionalNotes || '',
          weight: p.weight || ''
        })));
      } else {
        // Single product (legacy format)
        setEditProducts([{
          itemDescription: pkg.item_description || '',
          estimatedPrice: pkg.estimated_price?.toString() || '0',
          quantity: '1',
          itemLink: pkg.item_link || '',
          additionalNotes: pkg.additional_notes || '',
          adminAssignedTip: pkg.admin_assigned_tip || 0
        }]);
      }
      
      // General package fields
      setEditForm({
        purchase_origin: pkg.purchase_origin || '',
        package_destination: pkg.package_destination || '',
        additional_notes: pkg.additional_notes || ''
      });
      
      // Determine destination country from package_destination
      const destination = pkg.package_destination || '';
      let foundCountry = '';
      for (const [country, cities] of Object.entries(citiesByCountry)) {
        if (cities.includes(destination)) {
          foundCountry = country;
          break;
        }
      }
      // If not found in cities, check if it's a country name itself
      if (!foundCountry && destinationCountries.some(c => c.value === destination || c.label === destination)) {
        foundCountry = destination;
      }
      setSelectedDestinationCountry(foundCountry);
    }
  }, [pkg?.id, pkg?.products_data]); // Depend on stable values

  // Load payment order for Favoron payment receipt
  useEffect(() => {
    const loadPaymentOrder = async () => {
      if (!pkg?.matched_trip_id || !isOpen) return;

      setLoadingPaymentOrder(true);
      try {
        const { data, error } = await supabase
          .from('payment_orders')
          .select('*')
          .eq('trip_id', pkg.matched_trip_id)
          .maybeSingle();

        if (error) {
          console.error('Error loading payment order:', error);
        } else {
          setPaymentOrder(data);
        }
      } catch (error) {
        console.error('Exception loading payment order:', error);
      } finally {
        setLoadingPaymentOrder(false);
      }
    };

    loadPaymentOrder();
  }, [pkg?.matched_trip_id, isOpen]);

  // Load multi-traveler assignments when no matchedTrip
  useEffect(() => {
    const loadAssignments = async () => {
      if (!isOpen || !pkg?.id) {
        setPackageAssignments([]);
        return;
      }
      
      setLoadingAssignments(true);
      try {
        const { data: assignments, error } = await supabase
          .from('package_assignments')
          .select('id, package_id, trip_id, status, quote, admin_assigned_tip, traveler_address, matched_trip_dates, products_data, created_at')
          .eq('package_id', pkg.id)
          .not('status', 'eq', 'rejected');

        if (error) throw error;
        if (!assignments || assignments.length === 0) {
          setPackageAssignments([]);
          setLoadingAssignments(false);
          return;
        }

        // Fetch trip + profile info for each assignment
        const tripIds = [...new Set(assignments.map(a => a.trip_id))];
        const { data: tripsData } = await supabase
          .from('trips')
          .select('id, from_city, from_country, to_city, to_country, arrival_date, delivery_date, first_day_packages, last_day_packages, user_id')
          .in('id', tripIds);

        const travelerIds = [...new Set((tripsData || []).map(t => t.user_id))];
        let profilesData: any[] = [];
        if (travelerIds.length > 0) {
          const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, username, email, phone_number, country_code')
            .in('id', travelerIds);
          profilesData = data || [];
        }

        // Build enriched assignments
        const enriched = assignments.map(a => {
          const trip = (tripsData || []).find(t => t.id === a.trip_id);
          const profile = trip ? profilesData.find(p => p.id === trip.user_id) : null;
          return { ...a, trip, profile };
        });

        setPackageAssignments(enriched);
      } catch (err) {
        console.warn('Error loading package assignments:', err);
        setPackageAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    };

    loadAssignments();
  }, [isOpen, pkg?.id]);

  // Load profiles for rejection history
  useEffect(() => {
    const loadRejectionProfiles = async () => {
      if (!isOpen || !pkg) return;
      
      // Collect all traveler IDs from rejection history
      const travelerIds = new Set<string>();
      
      // From admin_actions_log
      if (pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log)) {
        pkg.admin_actions_log.forEach((log: any) => {
          if (log.action_type === 'traveler_rejection') {
            const travelerId = log.additional_data?.previous_traveler_id || log.admin_id;
            if (travelerId) travelerIds.add(travelerId);
          }
        });
      }
      
      // From current traveler_rejection
      const currentRejectorId = (pkg.traveler_rejection as any)?.previous_traveler_id || 
                                (pkg.traveler_rejection as any)?.rejected_by;
      if (currentRejectorId) travelerIds.add(currentRejectorId);
      
      // From quote_rejection rejected_traveler
      const quoteRejectionTravelerId = (pkg.quote_rejection as any)?.rejected_traveler?.traveler_id;
      if (quoteRejectionTravelerId) travelerIds.add(quoteRejectionTravelerId);
      
      if (travelerIds.size === 0) return;
      
      setLoadingRejectionProfiles(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code')
          .in('id', Array.from(travelerIds));
        
        if (error) {
          console.error('Error loading rejection profiles:', error);
        } else if (data) {
          const profileMap: Record<string, any> = {};
          data.forEach(profile => {
            profileMap[profile.id] = profile;
          });
          setRejectionProfiles(profileMap);
        }
      } catch (error) {
        console.error('Exception loading rejection profiles:', error);
      } finally {
        setLoadingRejectionProfiles(false);
      }
    };
    
    loadRejectionProfiles();
  }, [pkg?.id, pkg?.admin_actions_log, pkg?.traveler_rejection, isOpen]);

  // Security: Only allow admin access
  if (!user || userRole?.role !== 'admin') {
    console.warn('🔒 Unauthorized access to PackageDetailModal:', { 
      userId: user?.id, 
      role: userRole?.role 
    });
    return null;
  }

  console.log('PackageDetailModal render:', { pkg, trips, isOpen, modalId, loadingDetails });
  console.log('🛒 Shopper profile data:', pkg?.profiles);
  console.log('📦 Products data:', pkg?.products_data);

  if (!pkg) {
    console.log('No package provided to PackageDetailModal');
    return null;
  }
  
  // Show loading state while fetching heavy details
  if (loadingDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Cargando detalles del paquete...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Safe date formatting function
  const formatSafeDate = (dateValue: any): string => {
    if (!dateValue) return 'No especificada';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-GT');
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Error en fecha';
    }
  };

  const formatSafeDateTime = (dateValue: any): string => {
    if (!dateValue) return 'No especificada';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return `${date.toLocaleDateString('es-GT')} a las ${date.toLocaleTimeString('es-GT')}`;
    } catch (error) {
      console.error('Error formatting datetime:', error, dateValue);
      return 'Error en fecha';
    }
  };

  // Handle approve action with modal closure
  const handleApprove = async (id: string) => {
    await onApprove(id);
    closeModal(modalId);
  };

  // Handle reject action with reason
  const handleReject = (reason: string) => {
    onReject(pkg.id, reason);
    closeModal(modalId);
  };

  // Open rejection modal
  const handleRejectClick = () => {
    setRejectionModalOpen(true);
  };

  // Handle delete payment receipt
  const handleDeletePaymentReceipt = async () => {
    try {
      // 1. Delete file from storage if exists
      if (pkg.payment_receipt?.filePath) {
        const { error: storageError } = await supabase.storage
          .from('payment-receipts')
          .remove([pkg.payment_receipt.filePath]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }
      
      // 2. Update database - clear the field
      const { error: dbError } = await supabase
        .from('packages')
        .update({ payment_receipt: null })
        .eq('id', pkg.id);
      
      if (dbError) throw dbError;
      
      toast({
        title: "Comprobante eliminado",
        description: "El comprobante de pago ha sido eliminado exitosamente",
      });
      
      // 3. Refresh modal data
      closeModal(modalId);
      
    } catch (error: any) {
      console.error('Error deleting payment receipt:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el comprobante de pago",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle delete purchase confirmation
  const handleDeletePurchaseConfirmation = async () => {
    try {
      // 1. Delete all files from storage (handle both single object and array)
      const { normalizeConfirmations } = await import('@/utils/confirmationHelpers');
      const confirmations = normalizeConfirmations(pkg.purchase_confirmation);
      
      for (const confirmation of confirmations) {
        if (confirmation.filePath) {
          const buckets = ['purchase-confirmations', 'payment-receipts'];
          for (const bucket of buckets) {
            const { error: storageError } = await supabase.storage
              .from(bucket)
              .remove([confirmation.filePath]);
            if (!storageError) {
              console.log(`File deleted from bucket: ${bucket}`, confirmation.filePath);
              break;
            }
          }
        }
      }
      
      // 2. Update database - clear the field
      const { error: dbError } = await supabase
        .from('packages')
        .update({ purchase_confirmation: null })
        .eq('id', pkg.id);
      
      if (dbError) throw dbError;
      
      toast({
        title: "Comprobantes eliminados",
        description: `Se eliminaron ${confirmations.length} comprobante(s) de compra`,
      });
      
      // 3. Refresh modal data
      closeModal(modalId);
      
    } catch (error: any) {
      console.error('Error deleting purchase confirmation:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el comprobante de compra",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Handle delete Favoron payment receipt
  const handleDeleteFavoronReceipt = async () => {
    try {
      // 1. Delete file from storage if exists
      if (paymentOrder?.receipt_url) {
        const { error: storageError } = await supabase.storage
          .from('payment-receipts')
          .remove([paymentOrder.receipt_url]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }
      }
      
      // 2. Update database - clear the receipt fields
      const { error: dbError } = await supabase
        .from('payment_orders')
        .update({ 
          receipt_url: null,
          receipt_filename: null
        })
        .eq('id', paymentOrder.id);
      
      if (dbError) throw dbError;
      
      toast({
        title: "Comprobante eliminado",
        description: "El comprobante de pago de Favorón ha sido eliminado exitosamente",
      });
      
      // 3. Refresh payment order data
      setPaymentOrder({ ...paymentOrder, receipt_url: null, receipt_filename: null });
      
    } catch (error: any) {
      console.error('Error deleting Favoron receipt:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el comprobante de pago",
        variant: "destructive",
      });
    }
  };

  // Handle admin confirming product as received (for multi-product orders)
  const handleAdminConfirmProduct = async (productIndex: number) => {
    if (!pkg?.products_data) return;
    
    try {
      // Clone products_data
      const updatedProducts = [...(pkg.products_data as any[])];
      
      // Update specific product
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        receivedByTraveler: true,
        receivedAt: new Date().toISOString(),
        receivedPhoto: null, // Photo optional for admin
        confirmedByAdmin: true // Mark that it was confirmed by admin
      };
      
      // Check if ALL products are confirmed (excluding cancelled)
      const allConfirmed = updatedProducts.every((p: any) => p.receivedByTraveler || p.cancelled);
      
      // Prepare updates
      const updates: any = { products_data: updatedProducts };
      
      if (allConfirmed) {
        updates.status = 'received_by_traveler';
        updates.traveler_confirmation = {
          confirmedAt: new Date().toISOString(),
          allProductsConfirmed: true,
          confirmedByAdmin: true
        };
      }
      
      // Update in DB
      const { error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', pkg.id);
      
      if (error) throw error;
      
      const remainingCount = updatedProducts.filter((p: any) => !p.receivedByTraveler && !p.cancelled).length;
      
      toast({
        title: allConfirmed ? "¡Todos los productos confirmados!" : "Producto confirmado",
        description: allConfirmed 
          ? "Todos los productos han sido marcados como recibidos"
          : `Quedan ${remainingCount} producto(s) por confirmar`
      });
      
      // Close modal and refresh
      setAdminConfirmProductModal(null);
      closeModal(modalId);
      
    } catch (error: any) {
      console.error('Error confirming product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar el producto",
        variant: "destructive"
      });
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (editMode) {
      // Reset to original data when canceling
      if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
        setEditProducts(pkg.products_data.map((p: any) => ({
          ...p,
          itemDescription: p.itemDescription || '',
          estimatedPrice: p.estimatedPrice?.toString() || '0',
          quantity: (p.quantity ?? '1').toString(), // Use ?? to preserve falsy values
          itemLink: p.itemLink || '',
          additionalNotes: p.additionalNotes || '',
          weight: p.weight || ''
        })));
      } else {
        setEditProducts([{
          itemDescription: pkg.item_description || '',
          estimatedPrice: pkg.estimated_price?.toString() || '0',
          quantity: '1',
          itemLink: pkg.item_link || '',
          additionalNotes: pkg.additional_notes || '',
          adminAssignedTip: pkg.admin_assigned_tip || 0
        }]);
      }
      
      setEditForm({
        purchase_origin: pkg.purchase_origin || '',
        package_destination: pkg.package_destination || '',
        additional_notes: pkg.additional_notes || ''
      });
    }
    setEditMode(!editMode);
  };
  
  // Handle individual product field changes
  const handleProductChange = (index: number, field: string, value: string | boolean) => {
    setEditProducts(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (onUpdatePackage) {
      // Normalize products to save
      const normalizedProducts = editProducts.map(product => ({
        ...product, // Preserve fields not being edited (adminAssignedTip, requestType, etc.)
        itemDescription: product.itemDescription?.trim() || '',
        estimatedPrice: product.estimatedPrice?.toString() || '0',
        quantity: product.quantity?.toString() || '1',
        itemLink: product.itemLink?.trim() || null,
        additionalNotes: product.additionalNotes?.trim() || null,
        weight: product.weight?.trim() || null
      }));

      // Calculate total price from individual products
      const totalPrice = normalizedProducts.reduce((sum, p) => 
        sum + ((parseFloat(p.estimatedPrice) || 0) * (parseInt(p.quantity) || 1)), 0
      );
      
      // Generate auto description for package
      const autoDescription = normalizedProducts.length > 1
        ? `Pedido de ${normalizedProducts.length} productos: ${normalizedProducts.map(p => p.itemDescription?.substring(0, 30)).join(', ')}`
        : normalizedProducts[0]?.itemDescription || '';

      const updates = {
        products_data: normalizedProducts,
        item_description: autoDescription,
        item_link: normalizedProducts[0]?.itemLink || null, // First link for legacy field
        estimated_price: totalPrice,
        purchase_origin: editForm.purchase_origin,
        package_destination: editForm.package_destination,
        package_destination_country: selectedDestinationCountry || inferCountryFromCity(editForm.package_destination) || null,
        additional_notes: editForm.additional_notes?.trim() || null
      };
      
      onUpdatePackage(pkg.id, updates);
      refetchPackageDetails();
    }
    setEditMode(false);
  };

  // Handle inline notes save (quick edit without full modal edit mode)
  const handleSaveInlineNotes = async () => {
    if (onUpdatePackage) {
      const updates = {
        additional_notes: inlineNotesValue?.trim() || null
      };
      onUpdatePackage(pkg.id, updates);
      toast({
        title: "Notas guardadas",
        description: "Las notas adicionales se han actualizado correctamente."
      });
    }
    setInlineNotesEdit(false);
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Centralized rejection reason translation function
  const translateRejectionReason = (reason: any): string => {
    if (!reason) return 'Razón no especificada';
    
    const reasonText = typeof reason === 'string' ? reason : reason?.value;
    if (!reasonText) return 'Razón no especificada';
    
    // First check if it's a known enum key from constants
    const REJECTION_REASONS = {
      no_longer_want: 'Ya no quiero el paquete',
      too_expensive: 'La cotización fue muy cara',
      wrong_delivery_time: 'El tiempo de entrega no es el que quería',
      other: 'Otra razón'
    };
    
    if (REJECTION_REASONS[reasonText as keyof typeof REJECTION_REASONS]) {
      return REJECTION_REASONS[reasonText as keyof typeof REJECTION_REASONS];
    }
    
    // Then translate common English rejection reasons
    const translations: Record<string, string> = {
      'Product not available': 'Producto no disponible',
      'Price too high': 'Precio muy alto',
      'Delivery time too long': 'Tiempo de entrega muy largo',
      'Cannot deliver to location': 'No se puede entregar en esa ubicación',
      'Product restrictions': 'Restricciones del producto',
      'Size/weight limitations': 'Limitaciones de tamaño/peso',
      'Other': 'Otro',
      'Item unavailable': 'Artículo no disponible',
      'Too expensive': 'Muy caro',
      'Wrong size': 'Tamaño incorrecto',
      'Wrong color': 'Color incorrecto',
      'Shipping restrictions': 'Restricciones de envío',
      'Quality issues': 'Problemas de calidad',
      'Changed mind': 'Cambié de opinión'
    };
    
    return translations[reasonText] || reasonText;
  };

  // Get traveler information from trips_with_user data passed via trips prop
  const matchedTrip = trips?.find(trip => trip.id === pkg.matched_trip_id) || null;

  console.log('Matched trip found:', matchedTrip);
  console.log('📅 Delivery date from trips:', matchedTrip?.delivery_date);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente de Aprobación', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Emparejado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_rejected': { label: 'Cotización rechazada', variant: 'destructive' as const },
      'payment_pending': { label: 'Pago pendiente', variant: 'secondary' as const },
      'payment_pending_approval': { label: 'Pago pendiente de aprobación', variant: 'warning' as const },
      'pending_purchase': { label: 'Pago confirmado', variant: 'success' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered_to_office': { label: 'Entregado en oficina', variant: 'default' as const },
      'out_for_delivery': { label: 'En reparto', variant: 'default' as const },
      'received_by_traveler': { label: 'Recibido por viajero', variant: 'default' as const },
      'completed': { label: 'Completado', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Check which documents exist
  const hasPaymentReceipt = pkg.payment_receipt && (pkg.payment_receipt.receipt_url || pkg.payment_receipt.filePath);
  const confirmations = normalizeConfirmations(pkg.purchase_confirmation);
  const hasPurchaseConfirmation = confirmations.length > 0;
  const hasTrackingInfo = pkg.tracking_info && (pkg.tracking_info.tracking_number || pkg.tracking_info.trackingNumber);
  const hasTravelerConfirmation = pkg.traveler_confirmation && (pkg.traveler_confirmation.confirmedAt || pkg.traveler_confirmation.confirmed_at);
  
  // Allow admin uploads based on package status
  const canUploadPaymentReceipt = !hasPaymentReceipt && !['cancelled', 'rejected'].includes(pkg.status);
  const canUploadPurchaseConfirmation = pkg.status === 'pending_purchase';
  
  const hasAnyDocuments = hasPaymentReceipt || hasPurchaseConfirmation || hasTrackingInfo;
  
  // Enhanced product information processing
  const getDetailedProductInfo = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      return pkg.products_data.map((product: any, index: number) => ({
        id: index + 1,
        index,
        description: product.itemDescription || 'Sin descripción',
        price: parseFloat(product.estimatedPrice || '0'),
        quantity: parseInt(product.quantity || '1'),
        link: product.itemLink,
        instructions: product.instructions || null,
        requestType: product.requestType || 'online',
        productPhotos: product.productPhotos || [],
        packageWeight: product.weight || null,
        adminTip: product.adminAssignedTip ? parseFloat(product.adminAssignedTip) : 0,
        subtotal: parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1'),
        cancelled: product.cancelled || false,
        receivedByTraveler: product.receivedByTraveler || false,
        receivedAt: product.receivedAt || null,
        receivedPhoto: product.receivedPhoto || null,
        confirmedByAdmin: product.confirmedByAdmin || false,
        rawProduct: product
      }));
    } else {
      // Legacy single product format
      return [{
        id: 1,
        index: 0,
        description: pkg.item_description || 'Sin descripción',
        price: parseFloat(pkg.estimated_price?.toString() || '0'),
        quantity: 1,
        link: pkg.item_link,
        adminTip: pkg.admin_assigned_tip ? parseFloat(pkg.admin_assigned_tip.toString()) : 0,
        subtotal: parseFloat(pkg.estimated_price?.toString() || '0'),
        cancelled: false,
        receivedByTraveler: false,
        receivedAt: null,
        receivedPhoto: null,
        confirmedByAdmin: false,
        rawProduct: null
      }];
    }
  };

  // Calculate active product count for cancellation validation
  const activeProductCount = pkg.products_data && Array.isArray(pkg.products_data) 
    ? pkg.products_data.filter((p: any) => !p.cancelled).length 
    : 1;

  const detailedProducts = getDetailedProductInfo();
  const totalOrderValue = detailedProducts.reduce((sum, product) => sum + product.subtotal, 0);
  const totalAdminTips = detailedProducts.filter(product => !product.cancelled).reduce((sum, product) => sum + product.adminTip, 0);

  // Handle admin adding a photo to a personal product
  const handleAdminAddPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || pendingPhotoProductIndex === null) {
      event.target.value = '';
      return;
    }

    const productIndex = pendingPhotoProductIndex;
    setPendingPhotoProductIndex(null);

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato no válido", description: "Solo JPG, PNG o WebP", variant: "destructive" });
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "Máximo 5MB", variant: "destructive" });
      event.target.value = '';
      return;
    }

    setUploadingPhotoForProduct(productIndex);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${pkg.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(filePath, file);

      if (uploadError) throw new Error(`Error al subir: ${uploadError.message}`);

      const storageRef = `product-photos/${filePath}`;

      // Update products_data
      const currentProducts = Array.isArray(pkg.products_data) ? [...pkg.products_data] : [];
      if (currentProducts[productIndex]) {
        const updatedProduct = { ...currentProducts[productIndex] as any };
        const existingPhotos = Array.isArray(updatedProduct.productPhotos) ? [...updatedProduct.productPhotos] : [];
        existingPhotos.push(storageRef);
        updatedProduct.productPhotos = existingPhotos;
        currentProducts[productIndex] = updatedProduct;

        if (onUpdatePackage) {
          await onUpdatePackage(pkg.id, { products_data: currentProducts });
          // Refetch to show updated photos
          await refetchPackageDetails();
        }

        toast({ title: "Foto agregada", description: "La foto se subió exitosamente" });
      }
    } catch (error: any) {
      console.error('Error uploading admin photo:', error);
      toast({ title: "Error al subir foto", description: error.message || "Intenta de nuevo", variant: "destructive" });
    } finally {
      setUploadingPhotoForProduct(null);
      event.target.value = '';
    }
  };

  // Handle admin deleting a photo from a personal product
  const handleAdminDeletePhoto = async (productIndex: number, photoIndex: number) => {
    try {
      const currentProducts = Array.isArray(pkg.products_data) ? [...pkg.products_data] : [];
      if (!currentProducts[productIndex]) return;

      const updatedProduct = { ...currentProducts[productIndex] as any };
      const existingPhotos = Array.isArray(updatedProduct.productPhotos) ? [...updatedProduct.productPhotos] : [];
      const photoRef = existingPhotos[photoIndex];

      // Delete from storage
      if (photoRef) {
        const parsed = parseStorageRef(typeof photoRef === 'string' ? photoRef : `${photoRef.bucket}/${photoRef.filePath}`);
        if (parsed) {
          await supabase.storage.from(parsed.bucket).remove([parsed.filePath]);
        }
      }

      // Remove from array
      existingPhotos.splice(photoIndex, 1);
      updatedProduct.productPhotos = existingPhotos;
      currentProducts[productIndex] = updatedProduct;

      if (onUpdatePackage) {
        await onUpdatePackage(pkg.id, { products_data: currentProducts });
        await refetchPackageDetails();
      }

      toast({ title: "Foto eliminada", description: "La foto se eliminó exitosamente" });
    } catch (error: any) {
      console.error('Error deleting admin photo:', error);
      toast({ title: "Error al eliminar foto", description: error.message || "Intenta de nuevo", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => closeModal(modalId)}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Hidden file input for admin photo upload */}
        <input
          type="file"
          ref={adminPhotoInputRef}
          onChange={handleAdminAddPhoto}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
        />
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Detalles de Solicitud #{pkg.id}</span>
            </div>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <>
                  <Button onClick={handleSaveChanges} size="sm" className="text-xs">
                    <Save className="h-3 w-3 mr-1" />
                    Guardar
                  </Button>
                  <Button onClick={handleEditToggle} variant="outline" size="sm" className="text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditToggle} variant="outline" size="sm" className="text-xs">
                  <Edit2 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Información completa de la solicitud y del usuario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Estado actual:</span>
            {getStatusBadge(pkg.status)}
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shopper Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="h-4 w-4" />
                  <span>🛒 Información del Shopper</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Nombre</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        {pkg.profiles ? `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim() || pkg.profiles.username || 'Sin nombre' : 'Sin información'}
                        {pkg.profiles && (pkg.profiles.trust_level === 'prime' || (pkg.profiles.prime_expires_at && new Date(pkg.profiles.prime_expires_at) > new Date())) && (
                          <span title="Usuario Prime">
                            <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Usuario</p>
                      <p className="text-sm text-muted-foreground">
                        @{pkg.profiles?.username || 'Sin usuario'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.email || 'Sin email registrado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Teléfono</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.profiles?.phone_number
                          ? (pkg.profiles?.country_code 
                              ? formatPhoneDisplay(pkg.profiles.country_code, pkg.profiles.phone_number)
                              : pkg.profiles.phone_number)
                          : 'Sin teléfono registrado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Usuario ID</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Traveler Information */}
            {matchedTrip && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-4 w-4" />
                    <span>✈️ Información del Viajero</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-4">
                     <div className="flex items-center space-x-2">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Nombre</p>
                         <p className="text-sm text-muted-foreground">
                           {matchedTrip ? `${matchedTrip.first_name || ''} ${matchedTrip.last_name || ''}`.trim() || matchedTrip.username || 'Sin nombre' : 'Sin información'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Usuario</p>
                         <p className="text-sm text-muted-foreground">
                           @{matchedTrip?.username || 'Sin usuario'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <Mail className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Email</p>
                         <p className="text-sm text-muted-foreground">
                           {matchedTrip?.email || 'Sin email registrado'}
                         </p>
                       </div>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <div>
                         <p className="text-sm font-medium">Teléfono</p>
                         <p className="text-sm text-muted-foreground">
                           {matchedTrip?.phone_number || 'Sin teléfono registrado'}
                         </p>
                       </div>
                     </div>
                     
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Usuario ID</p>
                          <p className="text-sm text-muted-foreground">
                            {matchedTrip?.user_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Trip ID</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {pkg.matched_trip_id || 'Sin viaje asignado'}
                          </p>
                        </div>
                      </div>

                       <Accordion type="single" collapsible className="border border-blue-200 rounded-lg">
                        <AccordionItem value="trip-info" className="border-none">
                          <AccordionTrigger className="px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-t-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-blue-800">📍 Información del Viaje</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3">
                            <div className="text-sm text-blue-700 space-y-1">
                               <p><strong>Ruta:</strong> {matchedTrip?.from_city} → {matchedTrip?.to_city}</p>
                               <p><strong>Llegada:</strong> {formatSafeDate(matchedTrip?.arrival_date)}</p>
                                <p><strong>Entrega:</strong> {formatSafeDate(matchedTrip?.delivery_date)}</p>
                              <p><strong>Primer día paquetes:</strong> {formatSafeDate(matchedTrip?.first_day_packages)}</p>
                              <p><strong>Último día paquetes:</strong> {formatSafeDate(matchedTrip?.last_day_packages)}</p>
                              
                              {matchedTrip?.package_receiving_address && (
                                <div className="mt-2 pt-2 border-t border-blue-300">
                                  <p className="font-medium">Dirección de recepción:</p>
                                  <div className="space-y-1 text-sm">
                                    {matchedTrip.package_receiving_address.recipientName && (
                                      <p><strong>Destinatario:</strong> {matchedTrip.package_receiving_address.recipientName}</p>
                                    )}
                                    <div className="space-y-1">
                                      {matchedTrip.package_receiving_address.streetAddress && (
                                        <p><strong>Dirección 1:</strong> {matchedTrip.package_receiving_address.streetAddress}</p>
                                      )}
                                      {matchedTrip.package_receiving_address.streetAddress2 && (
                                        <p><strong>Dirección 2:</strong> {matchedTrip.package_receiving_address.streetAddress2}</p>
                                      )}
                                      {matchedTrip.package_receiving_address.cityArea && (
                                        <p><strong>Ciudad/Estado:</strong> {matchedTrip.package_receiving_address.cityArea}</p>
                                      )}
                                      {matchedTrip.package_receiving_address.postalCode && (
                                        <p><strong>Código postal:</strong> {matchedTrip.package_receiving_address.postalCode}</p>
                                      )}
                                    </div>
                                    {matchedTrip.package_receiving_address.accommodationType && matchedTrip.package_receiving_address.hotelAirbnbName && (
                                      <p><strong>{matchedTrip.package_receiving_address.accommodationType}:</strong> {matchedTrip.package_receiving_address.hotelAirbnbName}</p>
                                    )}
                                    {matchedTrip.package_receiving_address.contactNumber && (
                                      <p><strong>Contacto:</strong> {matchedTrip.package_receiving_address.contactNumber}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multi-Traveler Assignments - when no single matchedTrip but assignments exist */}
            {!matchedTrip && packageAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <User className="h-4 w-4" />
                    <span>✈️ Viajeros Asignados ({packageAssignments.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Paquete asignado a múltiples viajeros candidatos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingAssignments ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {packageAssignments.map((assignment) => {
                        const profile = assignment.profile;
                        const trip = assignment.trip;
                        const assignmentStatusMap: Record<string, { label: string; variant: string }> = {
                          bid_pending: { label: 'Esperando cotización', variant: 'secondary' },
                          bid_submitted: { label: 'Cotización enviada', variant: 'default' },
                          bid_won: { label: 'Ganador', variant: 'success' },
                          bid_lost: { label: 'No seleccionado', variant: 'destructive' },
                          bid_expired: { label: '⏰ Expirada', variant: 'warning' },
                          bid_cancelled: { label: 'Cancelada', variant: 'secondary' },
                          // Legacy statuses
                          pending: { label: 'Esperando cotización', variant: 'secondary' },
                          quote_sent: { label: 'Cotización enviada', variant: 'default' },
                          quote_accepted: { label: 'Cotización aceptada', variant: 'success' },
                          rejected: { label: 'Rechazado', variant: 'destructive' },
                        };
                        const statusInfo = assignmentStatusMap[assignment.status] || { label: assignment.status, variant: 'secondary' };

                        return (
                          <div key={assignment.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Sin nombre' : 'Cargando...'}
                                </span>
                                {profile?.username && (
                                  <span className="text-xs text-muted-foreground">@{profile.username}</span>
                                )}
                              </div>
                              <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                            </div>

                            {profile?.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{profile.email}</span>
                              </div>
                            )}

                            {profile?.phone_number && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{formatPhoneDisplay(profile.phone_number, profile.country_code)}</span>
                              </div>
                            )}

                            {trip && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Globe className="h-3.5 w-3.5" />
                                <span>
                                  {trip.from_city} → {trip.to_city}
                                  {' · '}
                                  {new Date(trip.first_day_packages).toLocaleDateString('es-GT')} - {new Date(trip.last_day_packages).toLocaleDateString('es-GT')}
                                </span>
                              </div>
                            )}

                            {assignment.admin_assigned_tip != null && assignment.admin_assigned_tip > 0 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span>Propina: Q{assignment.admin_assigned_tip}</span>
                              </div>
                            )}

                            {['bid_pending', 'bid_submitted'].includes(assignment.status) && assignment.expires_at && (
                              <AssignmentCountdown expiresAt={assignment.expires_at} />
                            )}

                            {assignment.status === 'bid_submitted' && assignment.quote_expires_at && (
                              <QuoteExpirationCountdown expiresAt={assignment.quote_expires_at} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Last Known Traveler - when no active match but history exists */}
            {!matchedTrip && (() => {
              // Try to get last traveler info from quote_rejection, traveler_rejection, or admin_actions_log
              const quoteRejection = pkg.quote_rejection as any;
              const travelerRejection = pkg.traveler_rejection as any;
              
              // Get traveler data from quote_rejection
              const rejectedTraveler = quoteRejection?.rejected_traveler;
              
              // Get traveler ID from various sources
              const lastTravelerId = rejectedTraveler?.traveler_id || 
                travelerRejection?.previous_traveler_id || 
                travelerRejection?.rejected_by ||
                (() => {
                  // Fallback: check admin_actions_log for last assignment
                  if (pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log)) {
                    const logs = [...(pkg.admin_actions_log as any[])].reverse();
                    for (const log of logs) {
                      const tid = log.additional_data?.previous_traveler_id;
                      if (tid) return tid;
                    }
                  }
                  return null;
                })();
              
              if (!rejectedTraveler && !lastTravelerId) return null;
              
              const profile = lastTravelerId ? rejectionProfiles[lastTravelerId] : null;
              const travelerName = profile 
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username
                : rejectedTraveler?.traveler_name || 'Desconocido';
              
              return (
                <Card className="border-dashed border-warning/50 bg-warning/5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <User className="h-4 w-4" />
                        <span>Último Viajero Asignado</span>
                      </CardTitle>
                      <Badge variant="warning" className="text-xs">Desasignado</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Nombre</p>
                          <p className="text-sm text-muted-foreground">{travelerName}</p>
                        </div>
                      </div>
                      
                      {profile?.username && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Usuario</p>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile?.phone_number && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Teléfono</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.country_code 
                                ? formatPhoneDisplay(profile.country_code, profile.phone_number)
                                : profile.phone_number}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {rejectedTraveler && (
                        <div className="bg-muted/30 rounded-lg p-3 text-sm space-y-1">
                          <p><strong>Ruta:</strong> {rejectedTraveler.from_city} → {rejectedTraveler.to_city}</p>
                          <p><strong>Llegada:</strong> {formatSafeDate(rejectedTraveler.arrival_date)}</p>
                          <p><strong>Entrega:</strong> {formatSafeDate(rejectedTraveler.delivery_date)}</p>
                        </div>
                      )}
                      
                      {lastTravelerId && (
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Usuario ID</p>
                            <p className="text-sm text-muted-foreground font-mono text-xs">{lastTravelerId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Enhanced Package Information with Detailed Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Package className="h-4 w-4" />
                <span>Detalles del Pedido</span>
                {!editMode && <Badge variant="outline">{detailedProducts.length} producto{detailedProducts.length !== 1 ? 's' : ''}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Traveler Rejection Info - Show when traveler rejected the assignment */}
              {pkg.traveler_rejection && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-orange-900 mb-1">Viajero Rechazó la Asignación</h4>
                        
                        {/* Traveler Name - usando perfil cargado directamente */}
                        {(() => {
                          const rejectorId = (pkg.traveler_rejection as any)?.previous_traveler_id || 
                                            (pkg.traveler_rejection as any)?.rejected_by;
                          const profile = rejectionProfiles[rejectorId];
                          
                          if (profile) {
                            return (
                              <div className="mb-2 flex items-center space-x-2">
                                <User className="h-4 w-4 text-orange-700" />
                                <p className="text-sm font-medium text-orange-900">
                                  Viajero: {profile.first_name} {profile.last_name}
                                  <span className="text-orange-600 ml-1">(@{profile.username})</span>
                                </p>
                              </div>
                            );
                          } else if (rejectorId) {
                            return (
                              <div className="mb-2 flex items-center space-x-2">
                                <User className="h-4 w-4 text-orange-700" />
                                <p className="text-sm text-orange-700">
                                  ID del viajero: {rejectorId.substring(0, 8)}...
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        <p className="text-sm text-orange-800">
                          <span className="font-medium">Motivo: </span>
                          {translateRejectionReason((pkg.traveler_rejection as any)?.reason || (pkg.traveler_rejection as any)?.rejection_reason)}
                        </p>
                        
                        {/* Tip previo ofrecido */}
                        {(pkg.traveler_rejection as any)?.previous_admin_assigned_tip != null && (
                          <div className="mt-2 bg-orange-100 border border-orange-300 rounded-md p-2">
                            <p className="text-sm text-orange-900 flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="font-medium">Tip ofrecido:</span> Q{Number((pkg.traveler_rejection as any).previous_admin_assigned_tip).toFixed(2)}
                            </p>
                            {(pkg.traveler_rejection as any)?.previous_products_tips && Array.isArray((pkg.traveler_rejection as any).previous_products_tips) && (
                              <div className="mt-1 space-y-0.5">
                                {(pkg.traveler_rejection as any).previous_products_tips.map((pt: any, i: number) => (
                                  <p key={i} className="text-xs text-orange-700 pl-5">
                                    {pt.itemDescription}: Q{pt.adminAssignedTip}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {(pkg.traveler_rejection as any)?.additional_comments && (
                        <div className="bg-orange-100 rounded-md p-3">
                          <p className="text-xs font-medium text-orange-900 mb-1">Comentarios del viajero:</p>
                          <p className="text-xs text-orange-800">
                            {(pkg.traveler_rejection as any).additional_comments}
                          </p>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-orange-300">
                        <p className="text-xs text-orange-700">
                          Rechazado el {formatSafeDateTime((pkg.traveler_rejection as any)?.rejected_at || pkg.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historial completo de rechazos */}
              {pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log) && (() => {
                const rejections = pkg.admin_actions_log.filter(
                  (log: any) => log.action_type === 'traveler_rejection'
                );
                
                if (rejections.length <= 1) return null; // Solo mostrar si hay mas de 1 rechazo
                
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                    <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Historial de Rechazos ({rejections.length} viajeros)
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {rejections.map((log: any, idx: number) => {
                        const travelerId = log.additional_data?.previous_traveler_id || log.admin_id;
                        const profile = rejectionProfiles[travelerId];
                        
                        return (
                          <div key={idx} className="bg-white/70 rounded p-2 text-sm border border-amber-100">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-amber-900">
                                {profile 
                                  ? `${profile.first_name} ${profile.last_name} (@${profile.username})`
                                  : `Viajero ${travelerId?.substring(0, 8)}...`
                                }
                              </span>
                              <span className="text-xs text-amber-600">
                                {formatSafeDateTime(log.timestamp)}
                              </span>
                            </div>
                            {log.additional_data?.rejection_reason && (
                              <p className="text-xs text-amber-700 mt-1">
                                Motivo: {translateRejectionReason(log.additional_data.rejection_reason)}
                              </p>
                            )}
                            {log.additional_data?.previous_admin_assigned_tip != null && (
                              <p className="text-xs text-amber-700 mt-0.5">
                                💰 Tip ofrecido: Q{Number(log.additional_data.previous_admin_assigned_tip).toFixed(2)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              
              {/* Quote Rejection Info - Show when quote was rejected */}
              {pkg.quote_rejection && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Cotización Rechazada por el Shopper</h4>
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Motivo: </span>
                          {translateRejectionReason((pkg.quote_rejection as any)?.reason)}
                        </p>
                      </div>
                      
                      {(pkg.quote_rejection as any)?.additional_notes && (
                        <div className="bg-red-100 rounded-md p-3">
                          <p className="text-xs font-medium text-red-900 mb-1">Comentarios adicionales:</p>
                          <p className="text-xs text-red-800">
                            {(pkg.quote_rejection as any).additional_notes}
                          </p>
                        </div>
                      )}
                      
                      {/* Rejected Traveler Info */}
                      {(pkg.quote_rejection as any)?.rejected_traveler && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                          <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Viajero rechazado: {(pkg.quote_rejection as any).rejected_traveler.traveler_name}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-yellow-700">
                            <span>
                              📍 {(pkg.quote_rejection as any).rejected_traveler.from_city} → {(pkg.quote_rejection as any).rejected_traveler.to_city}
                            </span>
                            <span>
                              📅 Llegada: {formatSafeDate((pkg.quote_rejection as any).rejected_traveler.arrival_date)}
                            </span>
                            <span>
                              🚚 Entrega: {formatSafeDate((pkg.quote_rejection as any).rejected_traveler.delivery_date)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-red-300">
                        <div className="flex items-center space-x-2">
                          {(pkg.quote_rejection as any)?.wants_requote ? (
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                              ✓ Solicita nueva cotización
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                              No solicita nueva cotización
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-red-700">
                          Rechazado el {formatSafeDateTime((pkg.quote_rejection as any)?.rejected_at || pkg.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editMode ? (
                /* Edit Mode - Individual Product Editor */
                <div className="space-y-4">
                  {/* General package fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        País de compra (Origen)
                      </label>
                      <Select
                        value={editForm.purchase_origin}
                        onValueChange={(value) => handleFormChange('purchase_origin', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecciona país de origen" />
                        </SelectTrigger>
                        <SelectContent>
                          {(packageRequestType === 'personal' ? personalPackageOrigins : onlinePurchaseOrigins).map((origin) => (
                            <SelectItem key={origin.value} value={origin.value}>
                              {origin.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Destino del paquete
                      </label>
                      <Select
                        value={selectedDestinationCountry}
                        onValueChange={(value) => {
                          setSelectedDestinationCountry(value);
                          // Reset city when country changes
                          handleFormChange('package_destination', '');
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona país de destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinationCountries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedDestinationCountry && (
                        <Select
                          value={editForm.package_destination}
                          onValueChange={(value) => handleFormChange('package_destination', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona ciudad" />
                          </SelectTrigger>
                          <SelectContent>
                            {citiesByCountry[selectedDestinationCountry]?.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* Individual products editor */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Editar Productos ({editProducts.length})
                    </h4>
                    
                    {editProducts.map((product, idx) => (
                      <Card key={idx} className="border-l-4 border-l-primary bg-muted/10">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary">Producto #{idx + 1}</Badge>
                            <div className="flex items-center gap-1">
                              <label className="text-xs text-muted-foreground">Tip:</label>
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">Q</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={product.adminAssignedTip || ''}
                                  onChange={(e) => handleProductChange(idx, 'adminAssignedTip', e.target.value)}
                                  placeholder="0"
                                  className="h-7 pl-6 text-xs font-mono text-right"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Product description */}
                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Descripción del producto
                              </label>
                              <Textarea
                                value={product.itemDescription}
                                onChange={(e) => handleProductChange(idx, 'itemDescription', e.target.value)}
                                placeholder="Describe el producto..."
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            
                            {/* Price and Quantity */}
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                Precio estimado (USD)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={product.estimatedPrice}
                                onChange={(e) => handleProductChange(idx, 'estimatedPrice', e.target.value)}
                                placeholder="0.00"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                Cantidad
                              </label>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => handleProductChange(idx, 'quantity', e.target.value)}
                                placeholder="1"
                                className="mt-1"
                              />
                            </div>
                            
                            {/* Product link */}
                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Link del producto
                              </label>
                              <Input
                                type="url"
                                value={product.itemLink}
                                onChange={(e) => handleProductChange(idx, 'itemLink', e.target.value)}
                                placeholder="https://ejemplo.com/producto"
                                className="mt-1"
                              />
                            </div>
                            
                            {/* Additional notes */}
                            <div className="md:col-span-2">
                              <label className="text-xs font-medium text-muted-foreground">
                                Notas adicionales (opcional)
                              </label>
                              <Input
                                value={product.additionalNotes || ''}
                                onChange={(e) => handleProductChange(idx, 'additionalNotes', e.target.value)}
                                placeholder="Notas especiales para este producto..."
                                className="mt-1"
                              />
                            </div>
                            
                            {/* Instructions field for personal orders */}
                            {(product.requestType === 'personal' || product.instructions) && (
                              <div className="md:col-span-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                  Instrucciones para pedido personal
                                </label>
                                <Textarea
                                  value={product.instructions || ''}
                                  onChange={(e) => handleProductChange(idx, 'instructions', e.target.value)}
                                  placeholder="Instrucciones especiales para el viajero..."
                                  className="mt-1"
                                  rows={3}
                                />
                              </div>
                            )}
                            
                            {/* Weight field if exists */}
                            {product.weight !== undefined && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground">
                                  Peso (lbs)
                                </label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={product.weight || ''}
                                  onChange={(e) => handleProductChange(idx, 'weight', e.target.value)}
                                  placeholder="0.0"
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Empaque Original */}
                          <div className="md:col-span-2">
                            <div className="flex items-center space-x-2 pt-2 border-t border-muted/40 mt-2">
                              <Checkbox
                                id={`packaging-${idx}`}
                                checked={product.needsOriginalPackaging || false}
                                onCheckedChange={(checked) => 
                                  handleProductChange(idx, 'needsOriginalPackaging', checked === true)
                                }
                              />
                              <label 
                                htmlFor={`packaging-${idx}`} 
                                className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                              >
                                📦 Conservar empaque/caja original
                              </label>
                            </div>
                          </div>
                          
                          {/* Subtotal */}
                          <div className="pt-2 border-t flex justify-end">
                            <p className="text-sm">
                              Subtotal: <span className="font-bold text-primary">
                                ${((parseFloat(product.estimatedPrice) || 0) * (parseInt(product.quantity) || 1)).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Total calculated */}
                  <div className="bg-primary/10 rounded-lg p-3 flex justify-between items-center">
                    <span className="font-medium">Total estimado del pedido:</span>
                    <span className="text-lg font-bold text-primary">
                      ${editProducts.reduce((sum, p) => 
                        sum + ((parseFloat(p.estimatedPrice) || 0) * (parseInt(p.quantity) || 1)), 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
              /* View Mode - Product Details */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Productos Solicitados:</h4>
                    {/* Progress indicator for multi-product orders */}
                    {detailedProducts.length > 1 && ['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'].includes(pkg.status) && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">
                        <Package className="h-3 w-3 mr-1" />
                        {detailedProducts.filter(p => p.receivedByTraveler && !p.cancelled).length}/{detailedProducts.filter(p => !p.cancelled).length} recibidos
                      </Badge>
                    )}
                  </div>
                  {detailedProducts.map((product) => {
                    const cancellationCheck = canCancelProduct(
                      product.rawProduct || product,
                      pkg.status,
                      activeProductCount,
                      true // isAdmin = true
                    );
                    
                    // Check if product reception status should be shown
                    const showReceptionStatus = ['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'].includes(pkg.status);
                    
                    return (
                    <Card 
                      key={product.id} 
                      className={`border-l-4 ${product.cancelled 
                        ? 'border-l-destructive/50 bg-destructive/5 opacity-70' 
                        : 'border-l-primary/30 bg-muted/20'}`}
                    >
                      <CardContent className="p-2">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                Producto #{product.id}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Cantidad: {product.quantity}
                              </Badge>
                              {product.cancelled && (
                                <Badge variant="destructive" className="text-xs">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Cancelado
                                </Badge>
                              )}
                              {/* Enhanced reception status badges */}
                              {showReceptionStatus && !product.cancelled && (
                                product.receivedByTraveler ? (
                                  <Badge variant="default" className="text-xs bg-green-600 dark:bg-green-700">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {product.confirmedByAdmin ? 'Confirmado por Admin' : 'Recibido'}
                                    {product.receivedAt && (
                                      <span className="ml-1 opacity-80">
                                        - {new Date(product.receivedAt).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pendiente
                                  </Badge>
                                )
                              )}
                            </div>
                            <h5 className={`font-medium text-sm ${product.cancelled ? 'line-through text-muted-foreground' : ''}`}>
                              {product.description}
                            </h5>
                          </div>
                          <div className="text-right ml-3 flex flex-col items-end gap-1">
                            <p className={`text-base font-bold ${product.cancelled ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                              ${product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">c/u</p>
                            {/* Confirm receipt button for admin - only when in_transit and not confirmed */}
                            {!product.cancelled && 
                             !product.receivedByTraveler && 
                             ['in_transit', 'received_by_traveler'].includes(pkg.status) && 
                             detailedProducts.filter(p => !p.cancelled).length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950 h-7 text-xs mt-1"
                                onClick={() => setAdminConfirmProductModal({
                                  isOpen: true,
                                  product: product.rawProduct || product,
                                  productIndex: product.index
                                })}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Confirmar recepción
                              </Button>
                            )}
                            {/* Cancel button for multi-product orders */}
                            {!product.cancelled && detailedProducts.length > 1 && cancellationCheck.canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 h-7 text-xs mt-1"
                                onClick={() => setAdminCancellationModal({
                                  isOpen: true,
                                  product: product.rawProduct || product,
                                  productIndex: product.index
                                })}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-1 text-xs">
                          <div>
                            <p className="font-medium text-muted-foreground">Precio Unitario</p>
                            <p className={`font-medium ${product.cancelled ? 'line-through' : ''}`}>${product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Cantidad</p>
                            <p className="font-medium">{product.quantity} unidad{product.quantity !== 1 ? 'es' : ''}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Subtotal</p>
                            <p className={`font-bold ${product.cancelled ? 'line-through text-muted-foreground' : 'text-primary'}`}>
                              ${product.subtotal.toFixed(2)}
                            </p>
                          </div>
                          {product.adminTip > 0 && (
                            <div>
                              <p className="font-medium text-muted-foreground">Tip Asignado</p>
                              <p className={`font-bold ${product.cancelled ? 'line-through text-muted-foreground' : 'text-green-600'}`}>
                                Q{product.adminTip.toFixed(2)}
                                {product.cancelled && <span className="ml-1 text-destructive no-underline">(no aplica)</span>}
                              </p>
                            </div>
                          )}
                          {(() => {
                            const normalizedLink = normalizeProductUrl(product.link);
                            return normalizedLink && (
                              <div>
                                <p className="font-medium text-muted-foreground">Link</p>
                                <a 
                                  href={normalizedLink}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-primary hover:underline text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  <span>Ver producto</span>
                                </a>
                              </div>
                            );
                          })()}
                          {product.requestType === 'personal' && product.packageWeight && (
                            <div>
                              <p className="font-medium text-muted-foreground">Peso (kg)</p>
                              <p className="font-medium text-xs">{product.packageWeight}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Indicador de empaque original */}
                        <div className={`mt-2 text-xs flex items-center gap-1 ${
                          product.rawProduct?.needsOriginalPackaging 
                            ? 'text-amber-600' 
                            : 'text-muted-foreground'
                        }`}>
                          📦 {product.rawProduct?.needsOriginalPackaging ? 'Conservar empaque original' : 'No requiere empaque original'}
                        </div>
                        
                        {/* Show instructions for personal orders */}
                        {product.requestType === 'personal' && product.instructions && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium text-muted-foreground text-xs mb-1">Instrucciones:</p>
                            <p className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                              {product.instructions}
                            </p>
                          </div>
                        )}
                        
                        {/* Show photos for personal orders + admin upload */}
                        {product.requestType === 'personal' && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium text-muted-foreground text-xs mb-2">Fotos del producto:</p>
                            {product.productPhotos && product.productPhotos.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-2">
                                {product.productPhotos.map((photo: string, idx: number) => (
                                  <div key={idx} className="relative group">
                                    <ProductPhoto
                                      photo={photo}
                                      idx={idx}
                                      productId={product.id}
                                      productDescription={product.description}
                                      onImageClick={(url, title, filename) => {
                                        setSelectedImage({ url, title, filename });
                                        setImageViewerOpen(true);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="absolute top-1 right-1 z-10 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shadow-md"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdminDeletePhoto(product.index, idx);
                                      }}
                                      title="Eliminar foto"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Admin add photo button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs h-7"
                              disabled={uploadingPhotoForProduct === product.index}
                              onClick={() => {
                                setPendingPhotoProductIndex(product.index);
                                adminPhotoInputRef.current?.click();
                              }}
                            >
                              {uploadingPhotoForProduct === product.index ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  Agregar Foto
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Traveler Reception Photo - shown when product was confirmed received */}
                        {product.receivedByTraveler && product.receivedPhoto && (
                          <div className="mt-2 pt-2 border-t border-green-200 bg-green-50/50 rounded-b-lg -mx-3 -mb-3 px-3 pb-3">
                            <p className="font-medium text-green-700 text-xs mb-2 flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Foto de recepción del viajero:
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              <ProductPhoto
                                photo={product.receivedPhoto}
                                idx={0}
                                productId={product.id}
                                productDescription={`Recepción: ${product.description}`}
                                onImageClick={(url, title, filename) => {
                                  setSelectedImage({ url, title, filename });
                                  setImageViewerOpen(true);
                                }}
                              />
                            </div>
                            {product.receivedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Confirmado el {new Date(product.receivedAt).toLocaleDateString('es-GT', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )})}
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-3">
                <h4 className="font-medium text-sm mb-2">Resumen del Pedido:</h4>
                <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Total Productos</p>
                      <p className="text-base font-bold">{detailedProducts.reduce((sum, p) => sum + p.quantity, 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Valor Total</p>
                      <p className="text-base font-bold text-primary">${totalOrderValue.toFixed(2)}</p>
                    </div>
                    {totalAdminTips > 0 && (
                      <div className="text-center">
                        <p className="font-medium text-muted-foreground">Tips Asignados</p>
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-base font-bold text-green-600">Q{totalAdminTips.toFixed(2)}</p>
                          {pkg.quote && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuoteEditModalOpen(true)}
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                              title="Editar tip"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Método de Entrega</p>
                      <p className="text-xs font-medium">
                        {pkg.delivery_method === 'delivery' ? "Envío a domicilio" : "Recoger en oficina"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">Fecha Límite</p>
                      <p className="text-xs font-medium">
                        {formatSafeDate(pkg.delivery_deadline)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Additional Notes from Shopper - with inline edit capability */}
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <h5 className="font-medium text-xs text-muted-foreground mb-2 flex items-center gap-2">
                      Notas Adicionales del Shopper:
                      {!editMode && !inlineNotesEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 w-5 p-0" 
                          onClick={() => {
                            setInlineNotesValue(pkg.additional_notes || '');
                            setInlineNotesEdit(true);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </h5>
                    
                    {/* Full edit mode - uses editForm */}
                    {editMode ? (
                      <Textarea
                        value={editForm.additional_notes}
                        onChange={(e) => handleFormChange('additional_notes', e.target.value)}
                        placeholder="Notas adicionales del shopper..."
                        className="text-xs"
                        rows={3}
                      />
                    ) : inlineNotesEdit ? (
                      /* Inline edit mode - independent quick edit */
                      <div className="space-y-2">
                        <Textarea
                          value={inlineNotesValue}
                          onChange={(e) => setInlineNotesValue(e.target.value)}
                          placeholder="Notas adicionales del shopper..."
                          className="text-xs"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveInlineNotes} className="text-xs">
                            <Save className="h-3 w-3 mr-1" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setInlineNotesEdit(false)} className="text-xs">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Read-only view */
                      <p className="text-xs text-foreground bg-muted/30 p-2 rounded">
                        {pkg.additional_notes || 'Sin notas adicionales'}
                      </p>
                    )}
                  </div>

                  {/* Internal Notes for Favoron Team */}
                  {pkg.internal_notes && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <h5 className="font-medium text-xs text-amber-700 mb-2">Notas Internas (solo para Favorón):</h5>
                      <p className="text-xs text-foreground bg-amber-50 p-2 rounded border border-amber-200">{pkg.internal_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmed Delivery Address */}
              {pkg.confirmed_delivery_address && pkg.delivery_method === 'delivery' && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-base text-foreground">Dirección de Entrega Confirmada</h4>
              </div>

              {/* Additional Notes from Shopper */}
              {pkg.additional_notes && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                    Notas Adicionales del Shopper:
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{pkg.additional_notes}</p>
                </div>
              )}
                  
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/15 rounded-full mt-0.5 flex-shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                          <p className="font-semibold text-foreground text-sm leading-relaxed">
                            {pkg.confirmed_delivery_address.streetAddress}
                          </p>
                          <p className="text-muted-foreground text-sm mt-1">
                            {pkg.confirmed_delivery_address.cityArea}
                          </p>
                        </div>
                        
                        {pkg.confirmed_delivery_address.hotelAirbnbName && (
                          <div className="bg-secondary/50 rounded-lg p-3 border border-secondary/20">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              <p className="font-medium text-secondary-foreground text-sm">
                                {pkg.confirmed_delivery_address.hotelAirbnbName}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-background/80 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <p className="font-medium text-foreground text-sm">
                              {pkg.confirmed_delivery_address.contactNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Solicitud creada el {formatSafeDateTime(pkg.created_at)}
              </div>
            </CardContent>
          </Card>

          {/* Quote Information */}
          {pkg.quote && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <DollarSign className="h-4 w-4" />
                    <span>Cotización Enviada al Shopper</span>
                  </CardTitle>
                  <CardDescription>
                    Detalles de la cotización que recibió el cliente
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuoteEditModalOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <QuoteRecalculator pkg={pkg} onRecalculated={() => window.location.reload()} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Propina del Viajero</p>
                      <p className="text-sm text-muted-foreground">Q{pkg.quote.price || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        Service Fee ({(() => {
                          const tip = parseFloat(pkg.quote.price || '0');
                          const fee = parseFloat(pkg.quote.serviceFee || '0');
                          return tip > 0 ? Math.round((fee / tip) * 100) : 0;
                        })()}%)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Q{parseFloat(pkg.quote.serviceFee || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Delivery Fee</p>
                      <p className="text-sm text-muted-foreground">Q{(() => {
                        // Use stored deliveryFee if available
                        if (pkg.quote.deliveryFee !== undefined && pkg.quote.deliveryFee !== null) {
                          return parseFloat(pkg.quote.deliveryFee).toFixed(2);
                        }
                        // Fallback: calculate using context
                        const cityArea = (pkg.confirmed_delivery_address as any)?.cityArea || pkg.package_destination;
                        return getDeliveryFee(pkg.delivery_method || 'pickup', pkg.profiles?.trust_level, cityArea).toFixed(2);
                      })()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Total a Pagar</p>
                      <p className="text-lg font-bold text-primary">Q{(() => {
                        // Use saved totalPrice if available
                        if (pkg.quote.totalPrice) {
                          return parseFloat(pkg.quote.totalPrice).toFixed(2);
                        }
                        
                        // Fallback: calculate from quote fields using context rates
                        const tip = parseFloat(pkg.quote.price || '0');
                        const serviceFee = parseFloat(pkg.quote.serviceFee || String(tip * getServiceFeeRate(pkg.profiles?.trust_level)));
                        const deliveryFee = parseFloat(pkg.quote.deliveryFee || '0');
                        
                        return (tip + serviceFee + deliveryFee).toFixed(2);
                      })()}</p>
                    </div>
                  </div>

                  {/* Discount display */}
                  {pkg.quote.discountCode && parseFloat(pkg.quote.discountAmount || '0') > 0 && (
                    <div className="col-span-full border-t pt-3 mt-1">
                      <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-green-800">🎉 Descuento aplicado:</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">{pkg.quote.discountCode}</Badge>
                        </div>
                        <span className="text-sm font-bold text-green-700">-Q{parseFloat(pkg.quote.discountAmount).toFixed(2)}</span>
                      </div>
                      {pkg.quote.finalTotalPrice && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium">Total Final (con descuento):</span>
                          <span className="text-lg font-bold text-primary">Q{parseFloat(pkg.quote.finalTotalPrice).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {pkg.quote.message && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Mensaje del Viajero:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {pkg.quote.message}
                    </p>
                  </div>
                )}

                {pkg.quote_expires_at && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-1">Expiración de la Cotización:</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSafeDateTime(pkg.quote_expires_at)}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">Estado de la Cotización:</p>
                  <p className="text-blue-700">
                    {pkg.status === 'quote_sent' && 'Enviada - Esperando respuesta del shopper'}
                    {pkg.status === 'payment_pending' && 'Aceptada - Pago pendiente'}
                    {pkg.status === 'pending_purchase' && 'Pagada - Compra pendiente'}
                    {pkg.status === 'quote_rejected' && 'Rechazada por el shopper'}
                    {pkg.status === 'quote_expired' && 'Expirada'}
                    {!['quote_sent', 'payment_pending', 'pending_purchase', 'quote_rejected', 'quote_expired'].includes(pkg.status) && 'Cotización enviada'}
                  </p>
                </div>

                {/* Shopper Quote Rejection Details */}
                {(pkg.status === 'quote_rejected' && pkg.quote_rejection) && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm font-medium text-red-800">Motivo del Rechazo por Shopper:</p>
                      </div>
                      <p className="text-sm text-red-700 mb-2">
                        {translateRejectionReason((pkg.quote_rejection as any)?.reason)}
                      </p>
                      
                      {(pkg.quote_rejection as any)?.additional_notes && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-800 mb-1">Comentarios adicionales:</p>
                          <p className="text-xs text-red-700 bg-red-100 p-2 rounded">
                            {(pkg.quote_rejection as any).additional_notes}
                          </p>
                        </div>
                      )}
                      
                      {(pkg.quote_rejection as any)?.wants_requote && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="h-1.5 w-1.5 bg-orange-500 rounded-full"></div>
                          <p className="text-xs text-orange-700 font-medium">
                            ⚠️ El shopper solicita nueva cotización
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Package Reception Confirmation */}
          {hasTravelerConfirmation && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>✅ Paquete Recibido por el Viajero</span>
                </CardTitle>
                <CardDescription className="text-green-700">
                  El viajero ha confirmado la recepción del paquete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Confirmado el {formatSafeDateTime(pkg.traveler_confirmation.confirmed_at || pkg.traveler_confirmation.confirmedAt)}
                    </span>
                  </div>
                </div>
                
                {(pkg.traveler_confirmation.photo || pkg.traveler_confirmation.photoUrl) && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Foto de confirmación:</span>
                    </div>
                    <div className="relative">
                      <img 
                        src={resolvedTravelerPhotoUrl || rawTravelerPhoto} 
                        alt="Confirmación de recepción"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-green-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onError={(e) => {
                          console.error('Error loading confirmation photo:', e);
                          console.error('Photo URL:', rawTravelerPhoto);
                          e.currentTarget.style.display = 'none';
                        }}
                        onClick={() => {
                          setSelectedImage({
                            url: rawTravelerPhoto,
                            title: "Confirmación de recepción",
                            filename: `confirmacion_${pkg.id}_${new Date().toISOString().split('T')[0]}.jpg`
                          });
                          setImageViewerOpen(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-4 w-4" />
                <span>Documentos</span>
                <Badge variant="outline" className="ml-2">Admin</Badge>
              </CardTitle>
              <CardDescription>
                Documentos relacionados con este paquete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Payment Receipt Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Comprobante de Pago
                </h4>
                
                {hasPaymentReceipt ? (
                  <PaymentReceiptViewer 
                    paymentReceipt={pkg.payment_receipt}
                    packageId={pkg.id}
                    className="w-full"
                    onDelete={handleDeletePaymentReceipt}
                  />
                ) : canUploadPaymentReceipt ? (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-3">
                      ℹ️ Como admin, puedes subir el comprobante en nombre del shopper
                    </p>
                    <PaymentReceiptUpload 
                      pkg={pkg}
                      onUploadComplete={async (updatedPkg) => {
                        // Refresh package data
                        if (onUpdatePackage) {
                          const { data: refreshedPkg } = await supabase
                            .from('packages')
                            .select('*')
                            .eq('id', pkg.id)
                            .single();
                          
                          if (refreshedPkg) {
                            onUpdatePackage(pkg.id, refreshedPkg);
                          }
                        }
                        closeModal(modalId);
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin comprobante de pago
                  </p>
                )}
              </div>
              
              {/* Purchase Confirmation Section */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Comprobante de Compra
                </h4>
                
                {hasPurchaseConfirmation ? (
                  <div className="space-y-2">
                    {confirmations.map((conf, index) => (
                      <PurchaseConfirmationViewer 
                        key={index}
                        purchaseConfirmation={conf}
                        packageId={pkg.id}
                        className="w-full"
                        onDelete={handleDeletePurchaseConfirmation}
                      />
                    ))}
                  </div>
                ) : canUploadPurchaseConfirmation ? (
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4">
                    <p className="text-xs text-blue-600 mb-3">
                      ℹ️ Como admin, puedes subir la confirmación de compra (mismo comportamiento que usuario)
                    </p>
                    <PurchaseConfirmationUpload 
                      packageId={pkg.id}
                      onUpload={async (confirmationData) => {
                        try {
                          // Same behavior as user upload: save to purchase_confirmation and change status to in_transit
                          const { error } = await supabase
                            .from('packages')
                            .update({ 
                              purchase_confirmation: confirmationData,
                              status: 'in_transit' // Changed from 'purchased' to match user upload behavior
                            })
                            .eq('id', pkg.id);
                            
                          if (error) throw error;
                          
                          toast({
                            title: "Comprobante subido exitosamente",
                            description: "El comprobante de compra ha sido registrado"
                          });
                          
                          closeModal(modalId);
                          
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: "No se pudo guardar el comprobante",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin comprobante de compra
                  </p>
                )}
              </div>
              
              {/* Tracking Info (mantener como está) */}
              {hasTrackingInfo && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Información de Seguimiento
                  </h4>
                  <TrackingInfoViewer 
                    trackingInfo={pkg.tracking_info}
                    className="w-full"
                  />
                </div>
              )}

              {/* Office Delivery Information */}
              {pkg.office_delivery && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Información de Entrega en Oficina
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    {pkg.office_delivery.traveler_declaration && (
                      <div>
                        <p className="text-sm font-medium text-blue-800">Declaración del Viajero:</p>
                        <p className="text-sm text-blue-700">
                          Confirmado el {formatSafeDateTime(pkg.office_delivery.traveler_declaration.delivered_at)}
                        </p>
                        {pkg.office_delivery.traveler_declaration.notes && (
                          <p className="text-sm text-blue-700 mt-1">
                            <strong>Notas:</strong> {pkg.office_delivery.traveler_declaration.notes}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {pkg.office_delivery.admin_confirmation && (
                      <div>
                        <p className="text-sm font-medium text-green-800">Confirmación Administrativa:</p>
                        <p className="text-sm text-green-700">
                          Confirmado el {formatSafeDateTime(pkg.office_delivery.admin_confirmation.confirmed_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Favoron Payment Receipt Section */}
              {pkg.matched_trip_id && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Comprobante de Pago del Favorón
                  </h4>
                  
                  {loadingPaymentOrder ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm">Cargando información de pago...</span>
                    </div>
                  ) : paymentOrder ? (
                    paymentOrder.receipt_url ? (
                      <FavoronPaymentReceiptViewer 
                        receiptUrl={paymentOrder.receipt_url}
                        receiptFilename={paymentOrder.receipt_filename}
                        paymentOrderId={paymentOrder.id}
                        amount={paymentOrder.amount}
                        className="w-full"
                        onDelete={handleDeleteFavoronReceipt}
                      />
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Sin comprobante de pago de Favorón
                        </p>
                        <div className="border-2 border-dashed border-purple-300 rounded-lg p-4">
                          <p className="text-xs text-purple-600 mb-3">
                            ℹ️ Como admin, puedes subir el comprobante de pago realizado por Favorón al viajero
                          </p>
                          <FavoronPaymentReceiptUpload 
                            paymentOrderId={paymentOrder.id}
                            onUploadComplete={() => {
                              // Reload payment order
                              supabase
                                .from('payment_orders')
                                .select('*')
                                .eq('id', paymentOrder.id)
                                .single()
                                .then(({ data }) => {
                                  if (data) setPaymentOrder(data);
                                });
                            }}
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No hay orden de pago asociada con este viaje
                    </p>
                  )}
                </div>
              )}

              {/* Rejection Reason */}
              {(() => {
                const reason = (pkg?.quote_rejection as any)?.reason 
                  || (pkg?.admin_rejection as any)?.reason 
                  || (typeof pkg?.rejection_reason === 'string' 
                      ? pkg.rejection_reason 
                      : (pkg?.rejection_reason as any)?.value);
                if (!reason) return null;
                const wantsRequote = (pkg?.quote_rejection as any)?.wants_requote 
                  ?? (pkg as any)?.wants_requote 
                  ?? (pkg?.rejection_reason as any)?.wantsRequote;
                const additionalComments = (pkg?.quote_rejection as any)?.additional_notes 
                  ?? (pkg as any)?.additional_notes 
                  ?? (pkg?.rejection_reason as any)?.additionalComments;
                return (
                  <div className="space-y-3 pt-4 border-t">
                    <RejectionReasonDisplay 
                      rejectionReason={reason}
                      wantsRequote={wantsRequote}
                      additionalComments={additionalComments}
                    />
                  </div>
                );
              })()}

            </CardContent>
          </Card>

          {/* Action Buttons */}
          {pkg.status === 'pending_approval' && (
            <div className="flex space-x-2 pt-4 border-t">
              <Button 
                onClick={() => handleApprove(pkg.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar Solicitud
              </Button>
               <Button 
                variant="destructive"
                onClick={handleRejectClick}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Solicitud
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal
          isOpen={imageViewerOpen}
          onClose={() => {
            setImageViewerOpen(false);
            setSelectedImage(null);
          }}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
          filename={selectedImage.filename}
         />
      )}
      
      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        onConfirm={handleReject}
        type="package"
        itemName={pkg?.item_description || 'Solicitud'}
      />
      
      {/* Admin Product Cancellation Modal */}
      {adminCancellationModal && pkg.products_data && (
        <AdminProductCancellationModal
          isOpen={adminCancellationModal.isOpen}
          onClose={() => setAdminCancellationModal(null)}
          product={adminCancellationModal.product}
          productIndex={adminCancellationModal.productIndex}
          packageId={pkg.id}
          shopperId={pkg.user_id}
          packageStatus={pkg.status}
          quote={pkg.quote}
          allProducts={pkg.products_data}
          onCancellationComplete={() => {
            setAdminCancellationModal(null);
            closeModal(modalId);
          }}
        />
      )}
      
      {/* Admin Product Confirmation Modal */}
      {adminConfirmProductModal?.isOpen && (
        <Dialog 
          open={adminConfirmProductModal.isOpen} 
          onOpenChange={() => setAdminConfirmProductModal(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Confirmar producto recibido
              </DialogTitle>
              <DialogDescription>
                Marcar este producto como recibido por el viajero
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Product info */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium">{adminConfirmProductModal.product?.itemDescription}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad: {adminConfirmProductModal.product?.quantity || 1}
                </p>
              </div>
              
              {/* Note */}
              <p className="text-sm text-muted-foreground">
                La foto es opcional para confirmaciones hechas por admin. Esta acción quedará registrada en el sistema.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdminConfirmProductModal(null)}>
                Cancelar
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAdminConfirmProduct(adminConfirmProductModal.productIndex)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar recepción
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quote Edit Modal */}
      {pkg?.quote && (
        <QuoteEditModal
          isOpen={quoteEditModalOpen}
          onClose={() => setQuoteEditModalOpen(false)}
          packageData={{
            id: pkg.id,
            quote: pkg.quote,
            matched_trip_id: pkg.matched_trip_id,
            profiles: pkg.profiles,
            delivery_method: pkg.delivery_method,
            confirmed_delivery_address: pkg.confirmed_delivery_address,
            package_destination: pkg.package_destination,
            user_id: pkg.user_id,
          }}
          tripUserId={matchedTrip?.user_id}
          onSuccess={() => {
            refetchPackageDetails();
            toast({
              title: "Cotización actualizada",
              description: "Los datos se han refrescado correctamente"
            });
          }}
        />
      )}
    </Dialog>
  );
};

export default PackageDetailModal;
