import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, ChevronDown, ChevronRight, User, Users, MapPin, Calendar, Package, Truck, DollarSign, Settings, Clock, MessageSquare, Star, XCircle, Phone, Globe, X, ExternalLink } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getHighResGoogleAvatar } from "@/lib/storageUrls";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { useState, useEffect, useRef } from "react";
import { getStatusLabel, formatFullName, formatDateUTC } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useModalState } from "@/contexts/ModalStateContext";
import ProductTipAssignmentModal from "./ProductTipAssignmentModal";
import { usePackageDetails } from "@/hooks/usePackageDetails";
import { useMemo } from "react";
import { normalizeProductUrl } from "@/lib/validators";

interface AdminMatchDialogProps {
  showMatchDialog: boolean;
  setShowMatchDialog: (show: boolean) => void;
  selectedPackage: any;
  matchingTrip: string;
  setMatchingTrip: (trip: string) => void;
  availableTrips: any[];
  packages: any[];
  onMatch: (adminTip?: number, productsWithTips?: any[], selectedTripIds?: string[]) => void;
}

const AdminMatchDialog = ({ 
  showMatchDialog, 
  setShowMatchDialog, 
  selectedPackage, 
  matchingTrip, 
  setMatchingTrip, 
  availableTrips,
  packages, 
  onMatch 
}: AdminMatchDialogProps) => {
  const { openModal, closeModal, isModalOpen, getModalData } = useModalState();
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [expandedTrips, setExpandedTrips] = useState<Set<number>>(new Set());
  const [packageExpanded, setPackageExpanded] = useState<boolean>(false);
  const [travelerProfiles, setTravelerProfiles] = useState<{[key: string]: any}>({});
  const [showTravelerInfo, setShowTravelerInfo] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<any>(null);
  const [travelerPackages, setTravelerPackages] = useState<any[]>([]);
  const [tripAssignments, setTripAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [adminTip, setAdminTip] = useState<string>('');
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [avatarViewerUrl, setAvatarViewerUrl] = useState('');

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Cache for traveler data per trip to avoid re-fetching
  const travelerDataCacheRef = useRef<Map<string, { travelerPackages: any[]; tripAssignments: any[]; selectedTraveler: any }>>(new Map());
  const handleAvatarClick = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return;
    setAvatarViewerUrl(avatarUrl);
    setAvatarViewerOpen(true);
  };
  const [showProductTipModal, setShowProductTipModal] = useState(false);
  const [assignedProductsWithTips, setAssignedProductsWithTips] = useState<any[]>([]);
  const [showAllTrips, setShowAllTrips] = useState(false);
  const [showOtherCities, setShowOtherCities] = useState(false);
  const [alreadyAssignedTripIds, setAlreadyAssignedTripIds] = useState<Set<string>>(new Set());
  const [tripAssignmentsMap, setTripAssignmentsMap] = useState<Record<string, { package_id: string; status: string }[]>>({});

  const MODAL_ID = 'admin-match-dialog';

  // Load heavy fields on-demand when dialog is open
  const { details: heavyDetails, loading: loadingDetails } = usePackageDetails(
    showMatchDialog && selectedPackage?.id ? selectedPackage.id : null
  );

  // Merge lightweight data with heavy fields
  const fullPackage = useMemo(() => {
    if (!selectedPackage) return null;
    return {
      ...selectedPackage,
      products_data: heavyDetails?.products_data || selectedPackage.products_data,
      payment_receipt: heavyDetails?.payment_receipt || selectedPackage.payment_receipt,
      purchase_confirmation: heavyDetails?.purchase_confirmation || selectedPackage.purchase_confirmation,
      tracking_info: heavyDetails?.tracking_info || selectedPackage.tracking_info,
      office_delivery: heavyDetails?.office_delivery || selectedPackage.office_delivery,
    };
  }, [selectedPackage, heavyDetails]);

  // Function to calculate package value
  const calculatePackageValue = (pkg: any): number => {
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      return pkg.products_data.reduce((productSum: number, product: any) => {
        const price = parseFloat(product.estimatedPrice || '0');
        const quantity = parseInt(product.quantity || '1');
        return productSum + (price * quantity);
      }, 0);
    }
    return parseFloat(pkg.estimated_price || '0');
  };

  // Memoized totals for all trips — O(packages) once instead of O(trips × packages) per render
  const tripTotalsMap = useMemo(() => {
    const pendingStatuses = ['matched', 'quote_sent', 'payment_pending', 'payment_pending_approval'];
    const confirmedStatuses = ['paid', 'pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
    
    const map: Record<string, { pendingTotal: number; confirmedTotal: number }> = {};
    
    // Index packages by matched_trip_id
    const pkgByTrip: Record<string, any[]> = {};
    const pkgById: Record<string, any> = {};
    for (const pkg of packages) {
      pkgById[pkg.id] = pkg;
      if (pkg.matched_trip_id) {
        if (!pkgByTrip[pkg.matched_trip_id]) pkgByTrip[pkg.matched_trip_id] = [];
        pkgByTrip[pkg.matched_trip_id].push(pkg);
      }
    }
    
    // Collect all relevant trip IDs
    const allTripIds = new Set([
      ...Object.keys(pkgByTrip),
      ...Object.keys(tripAssignmentsMap),
    ]);
    
    for (const tripId of allTripIds) {
      let pendingTotal = 0;
      let confirmedTotal = 0;
      
      const directPackages = pkgByTrip[tripId] || [];
      const directPackageIds = new Set(directPackages.map(pkg => pkg.id));
      
      // Build set of active assignment package IDs for this trip
      const activeAssignmentPkgIds = new Set(
        (tripAssignmentsMap[tripId] || []).map((a: any) => a.package_id)
      );
      
      for (const pkg of directPackages) {
        const value = calculatePackageValue(pkg);
        if (pendingStatuses.includes(pkg.status)) {
          // Only count if there's an active (non-expired) assignment for this trip
          if (activeAssignmentPkgIds.has(pkg.id)) pendingTotal += value;
        } else if (confirmedStatuses.includes(pkg.status)) {
          confirmedTotal += value;
        }
      }
      
      // Assignment packages not directly matched also count as pending
      for (const assignment of (tripAssignmentsMap[tripId] || [])) {
        const pkgId = assignment.package_id;
        if (directPackageIds.has(pkgId)) continue;
        const pkg = pkgById[pkgId];
        if (pkg) pendingTotal += calculatePackageValue(pkg);
      }
      
      map[tripId] = { pendingTotal, confirmedTotal };
    }
    
    return map;
  }, [packages, tripAssignmentsMap]);

  const calculateTripPackagesTotals = (tripId: string) => {
    return tripTotalsMap[tripId] || { pendingTotal: 0, confirmedTotal: 0 };
  };

  const calculateTripPackagesTotal = (tripId: string) => {
    const { pendingTotal, confirmedTotal } = calculateTripPackagesTotals(tripId);
    return pendingTotal + confirmedTotal;
  };

  // Normalize country names to handle variations
  const normalizeCountry = (location: string): string => {
    const normalized = location?.toLowerCase().trim() || '';
    
    // Map US variations
    if (normalized.includes('usa') || normalized.includes('estados unidos') || 
        normalized.includes('estados-unidos') || normalized.includes('united states') ||
        normalized.includes('ee.uu') || normalized.includes('eeuu')) {
      return 'usa';
    }
    
    // Map Spain variations
    if (normalized.includes('españa') || normalized.includes('espana') || 
        normalized.includes('spain')) {
      return 'espana';
    }
    
    // Map Mexico variations
    if (normalized.includes('mexico') || normalized.includes('méxico') ||
        normalized.includes('mx') || normalized.includes('cdmx') ||
        normalized.includes('ciudad de mexico') || normalized.includes('ciudad de méxico')) {
      return 'mexico';
    }
    
    // Map Guatemala variations (including all 22 departments and major cities)
    if (normalized.includes('guatemala') || normalized.includes('quetzaltenango') ||
        normalized.includes('xela') || normalized.includes('antigua') ||
        normalized.includes('zona 14') || normalized.includes('guatemala city') ||
        normalized.includes('escuintla') || normalized.includes('amatitlan') ||
        normalized.includes('amatitlán') || normalized.includes('chimaltenango') ||
        normalized.includes('chichicastenango') || normalized.includes('quiche') ||
        normalized.includes('quiché') || normalized.includes('solola') ||
        normalized.includes('sololá') || normalized.includes('san pedro la laguna') ||
        normalized.includes('san lucas') || normalized.includes('villa nueva') ||
        normalized.includes('mixco') || normalized.includes('petapa') ||
        normalized.includes('santa catarina pinula') || normalized.includes('fraijanes') ||
        normalized.includes('sacatepequez') || normalized.includes('sacatepéquez') ||
        normalized.includes('huehuetenango') || normalized.includes('coban') ||
        normalized.includes('cobán') || normalized.includes('alta verapaz') ||
        normalized.includes('retalhuleu') || normalized.includes('mazatenango') ||
        normalized.includes('suchitepequez') || normalized.includes('suchitepéquez') ||
        // Additional departments
        normalized.includes('san marcos') || normalized.includes('peten') ||
        normalized.includes('petén') || normalized.includes('flores') ||
        normalized.includes('puerto barrios') || normalized.includes('izabal') ||
        normalized.includes('zacapa') || normalized.includes('gualan') ||
        normalized.includes('gualán') || normalized.includes('el progreso') ||
        normalized.includes('jalapa') || normalized.includes('jutiapa') ||
        normalized.includes('santa rosa') || normalized.includes('chiquimulilla') ||
        normalized.includes('totonicapan') || normalized.includes('totonicapán') ||
        normalized.includes('san pedro sacatepequez') || normalized.includes('baja verapaz') ||
        normalized.includes('salama') || normalized.includes('salamá')) {
      return 'guatemala';
    }
    
    // Map El Salvador variations
    if (normalized.includes('salvador') || normalized.includes('el salvador') ||
        normalized.includes('san salvador') || normalized.includes('san miguel') ||
        normalized.includes('santa ana') || normalized.includes('soyapango') ||
        normalized.includes('santa tecla') || normalized.includes('san vicente') ||
        normalized.includes('usulutan') || normalized.includes('usulután') ||
        normalized.includes('ahuachapan') || normalized.includes('ahuachapán') ||
        normalized.includes('sonsonate') || normalized.includes('la libertad') ||
        normalized.includes('chalatenango') || normalized.includes('cuscatlan') ||
        normalized.includes('cuscatlán') || normalized.includes('cabañas') ||
        normalized.includes('morazan') || normalized.includes('morazán') ||
        normalized.includes('la union') || normalized.includes('la unión') ||
        normalized.includes('la paz')) {
      return 'el_salvador';
    }
    
    return normalized;
  };

  // Filter trips by country (origin and destination) and exclude past dates
  const validTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
    // Use the new country field if available, fallback to inferring from city
    const packageDestinationCountry = selectedPackage?.package_destination_country 
      ? normalizeCountry(selectedPackage.package_destination_country)
      : normalizeCountry(selectedPackage?.package_destination || '');
    const packageDestinationCity = selectedPackage?.package_destination?.toLowerCase().trim() || '';
    
    // Si no hay paquete seleccionado, no mostrar ningún viaje
    if (!selectedPackage?.purchase_origin) {
      return [];
    }
    
    return availableTrips
      .filter(trip => {
        // Exclude trips with past arrival dates
        const isNotExpired = new Date(trip.arrival_date) >= today;
        
        // Filter by origin country (skip if showAllTrips is enabled)
        const tripOriginNormalized = normalizeCountry(trip.from_country || '');
        const matchesOrigin = showAllTrips || tripOriginNormalized === packageOriginNormalized;
        
        // Filter by destination using country field
        const tripDestinationNormalized = normalizeCountry(trip.to_country || trip.to_city || '');
        const tripDestinationCity = trip.to_city?.toLowerCase().trim() || '';
        
        let matchesDestination = false;
        if (showOtherCities) {
          // Show trips to any city in the same country
          matchesDestination = tripDestinationNormalized === packageDestinationCountry;
        } else {
          // Exact destination match by country
          matchesDestination = !packageDestinationCountry || 
                               tripDestinationNormalized === packageDestinationCountry;
        }
        
        return isNotExpired && matchesOrigin && matchesDestination;
      })
      // Sort by arrival date (soonest first)
      .sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());
  }, [availableTrips, selectedPackage?.purchase_origin, selectedPackage?.package_destination, selectedPackage?.package_destination_country, showAllTrips, showOtherCities]);

  // Count trips that match destination only (for showing "other countries" option)
  const allDestinationTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const packageDestinationNormalized = normalizeCountry(selectedPackage?.package_destination || '');
    const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
    
    return availableTrips.filter(trip => {
      const isNotExpired = new Date(trip.arrival_date) >= today;
      const tripDestinationNormalized = normalizeCountry(trip.to_city || '');
      const tripOriginNormalized = normalizeCountry(trip.from_country || '');
      const matchesDestination = !packageDestinationNormalized || 
                                 tripDestinationNormalized === packageDestinationNormalized;
      // Only count trips from DIFFERENT countries
      const isDifferentOrigin = tripOriginNormalized !== packageOriginNormalized;
      return isNotExpired && matchesDestination && isDifferentOrigin;
    });
  }, [availableTrips, selectedPackage?.package_destination, selectedPackage?.purchase_origin]);

  // Count trips to OTHER cities in Guatemala (same country, different city)
  const otherCityTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
    const packageDestinationNormalized = normalizeCountry(selectedPackage?.package_destination || '');
    const packageDestinationCity = selectedPackage?.package_destination?.toLowerCase().trim() || '';
    
    return availableTrips.filter(trip => {
      const isNotExpired = new Date(trip.arrival_date) >= today;
      const tripOriginNormalized = normalizeCountry(trip.from_country || '');
      const tripDestinationCity = trip.to_city?.toLowerCase().trim() || '';
      
      // Same origin country
      const matchesOrigin = tripOriginNormalized === packageOriginNormalized;
      
      // Trip goes to Guatemala (using to_country field OR normalized city name)
      const tripToGuatemala = trip.to_country?.toLowerCase().includes('guatemala') || 
                              normalizeCountry(trip.to_city || '') === 'guatemala';
      
      // Package destination is in Guatemala
      const packageToGuatemala = packageDestinationNormalized === 'guatemala';
      
      // Different city within Guatemala
      const differentCity = tripDestinationCity !== packageDestinationCity;
      
      return isNotExpired && matchesOrigin && tripToGuatemala && packageToGuatemala && differentCity;
    }).sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());
  }, [availableTrips, selectedPackage?.purchase_origin, selectedPackage?.package_destination]);

  // Count trips to OTHER cities in USA (same origin, different US city)
  const otherUSCityTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
    const packageDestinationCity = selectedPackage?.package_destination?.toLowerCase().trim() || '';
    
    // Check if package destination is in USA
    const usCities = ['miami', 'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 
                      'san antonio', 'san diego', 'dallas', 'austin', 'san jose', 'fort worth', 'jacksonville',
                      'columbus', 'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver', 'washington',
                      'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city', 'portland', 'las vegas',
                      'memphis', 'louisville', 'baltimore', 'milwaukee', 'albuquerque', 'tucson', 'fresno',
                      'sacramento', 'atlanta', 'orlando', 'tampa'];
    
    const isPackageToUS = usCities.some(city => packageDestinationCity.includes(city));
    if (!isPackageToUS) return [];
    
    return availableTrips.filter(trip => {
      const isNotExpired = new Date(trip.arrival_date) >= today;
      const tripOriginNormalized = normalizeCountry(trip.from_country || '');
      const tripDestinationCity = trip.to_city?.toLowerCase().trim() || '';
      
      // Same origin country (e.g., Guatemala)
      const matchesOrigin = tripOriginNormalized === packageOriginNormalized;
      
      // Trip goes to a US city (different from package destination)
      const tripToUSCity = usCities.some(city => tripDestinationCity.includes(city));
      const differentCity = tripDestinationCity !== packageDestinationCity;
      
      return isNotExpired && matchesOrigin && tripToUSCity && differentCity;
    }).sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());
  }, [availableTrips, selectedPackage?.purchase_origin, selectedPackage?.package_destination]);

  // Count trips to OTHER cities in Spain (same origin, different Spanish city)
  const otherSpainCityTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
    const packageDestinationCity = selectedPackage?.package_destination?.toLowerCase().trim() || '';
    
    // Spanish cities
    const spainCities = ['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 
                         'málaga', 'malaga', 'murcia', 'palma', 'bilbao', 
                         'alicante', 'córdoba', 'cordoba', 'valladolid', 'las palmas'];
    
    // Check if package destination is in Spain
    const packageDestNormalized = normalizeCountry(selectedPackage?.package_destination || '');
    const isPackageToSpain = packageDestNormalized === 'espana' || 
                             spainCities.some(city => packageDestinationCity.includes(city));
    
    if (!isPackageToSpain) return [];
    
    return availableTrips.filter(trip => {
      const isNotExpired = new Date(trip.arrival_date) >= today;
      const tripOriginNormalized = normalizeCountry(trip.from_country || '');
      const tripDestinationCity = trip.to_city?.toLowerCase().trim() || '';
      const tripDestNormalized = normalizeCountry(trip.to_city || '');
      
      // Same origin country
      const matchesOrigin = tripOriginNormalized === packageOriginNormalized;
      
      // Trip goes to Spain
      const tripToSpain = tripDestNormalized === 'espana' ||
                          trip.to_country?.toLowerCase().includes('españa') ||
                          trip.to_country?.toLowerCase().includes('espana') ||
                          spainCities.some(city => tripDestinationCity.includes(city));
      
      // Different city
      const differentCity = tripDestinationCity !== packageDestinationCity;
      
      return isNotExpired && matchesOrigin && tripToSpain && differentCity;
    }).sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());
  }, [availableTrips, selectedPackage?.purchase_origin, selectedPackage?.package_destination]);

  // Reset selection only when the selected package changes
  useEffect(() => {
    setShowAllTrips(false);
    setShowOtherCities(false);
    setSelectedTripIds(new Set());
    setSelectedTripId(null);
  }, [selectedPackage?.id]);

  // Fetch existing assignments + trip assignments in parallel (without resetting selection)
  const prevTripIdsRef = useRef<string>('');
  useEffect(() => {
    if (!showMatchDialog || !selectedPackage?.id) {
      setAlreadyAssignedTripIds(new Set());
      setTripAssignmentsMap({});
      return;
    }

    const tripIds = availableTrips.map(t => t.id);
    const tripIdsKey = tripIds.sort().join(',');
    
    // Skip if trips haven't actually changed
    if (tripIdsKey === prevTripIdsRef.current && alreadyAssignedTripIds.size > 0) {
      return;
    }
    prevTripIdsRef.current = tripIdsKey;

    const fetchAllAssignments = async () => {
      // 1) Existing assignments for this package
      const existingPromise = supabase
        .from('package_assignments')
        .select('trip_id')
        .eq('package_id', selectedPackage.id)
        .in('status', ['bid_pending', 'bid_submitted', 'bid_won'])
        .then(r => r);
      
      // 2) Trip assignments map (only if we have trips)
      const tripAssignmentsPromise = tripIds.length > 0
        ? supabase
            .from('package_assignments')
            .select('trip_id, package_id, status')
            .in('trip_id', tripIds)
            .in('status', ['bid_pending', 'bid_submitted', 'bid_won'])
            .then(r => r)
        : Promise.resolve({ data: null });

      const [existingResult, tripResult] = await Promise.all([existingPromise, tripAssignmentsPromise]);
      
      // Process existing assignments
      if (existingResult.data) {
        setAlreadyAssignedTripIds(new Set(existingResult.data.map((a: any) => a.trip_id)));
      } else {
        setAlreadyAssignedTripIds(new Set());
      }
      
      // Process trip assignments map
      if (tripResult.data) {
        const map: Record<string, { package_id: string; status: string }[]> = {};
        tripResult.data.forEach((row: any) => {
          if (!map[row.trip_id]) map[row.trip_id] = [];
          map[row.trip_id].push({ package_id: row.package_id, status: row.status });
        });
        setTripAssignmentsMap(map);
      } else {
        setTripAssignmentsMap({});
      }
    };
    
    fetchAllAssignments();
  }, [selectedPackage?.id, showMatchDialog, availableTrips]);

  // Pre-populate admin tip from existing package
  useEffect(() => {
    if (showMatchDialog && selectedPackage?.admin_assigned_tip && !adminTip) {
      setAdminTip(String(selectedPackage.admin_assigned_tip));
    }
  }, [selectedPackage?.id, showMatchDialog]);

  // Handle modal state persistence — only track open/close, not every keystroke
  useEffect(() => {
    if (showMatchDialog && selectedPackage) {
      openModal(MODAL_ID, 'admin-match-dialog', {
        selectedPackage,
        matchingTrip,
        selectedTripId,
        adminTip,
        assignedProductsWithTips
      });
    } else if (!showMatchDialog && isModalOpen(MODAL_ID)) {
      closeModal(MODAL_ID);
    }
  }, [showMatchDialog, selectedPackage?.id]);

  // Restore modal state if it exists
  useEffect(() => {
    const modalData = getModalData(MODAL_ID);
    if (modalData && !showMatchDialog) {
      // Restore modal state
      setMatchingTrip(modalData.matchingTrip || '');
      setSelectedTripId(modalData.selectedTripId || null);
      setAdminTip(modalData.adminTip || '');
      setAssignedProductsWithTips(modalData.assignedProductsWithTips || []);
    }
  }, []);

  // Fetch traveler profiles when dialog opens and trips are available
  useEffect(() => {
    // Combine all trips from different sections
    const allTrips = [...validTrips, ...otherCityTrips, ...otherUSCityTrips, ...otherSpainCityTrips];
    
    if (showMatchDialog && allTrips.length > 0) {
      const fetchTravelerProfiles = async () => {
        // Get unique IDs from ALL available trips
        const userIds = [...new Set(allTrips.map(trip => trip.user_id))];
        
        try {
          // Fetch profiles directly from the profiles table
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, username, email, country_code, phone_number, avatar_url')
            .in('id', userIds);
          
          if (error) {
            console.error('Error fetching traveler profiles:', error);
            return;
          }
          
          // Create profiles map
          const profilesMap = data?.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {}) || {};
          
          setTravelerProfiles(profilesMap);
        } catch (error) {
          console.error('Error fetching traveler profiles:', error);
        }
      };
      
      fetchTravelerProfiles();
    }
  }, [showMatchDialog, validTrips, otherCityTrips, otherUSCityTrips]);

  const getTravelerName = (userId: string) => {
    const profile = travelerProfiles[userId];
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.username) {
      return profile.username;
    }
    if (profile?.email) {
      return profile.email.split('@')[0];
    }
    return `Viajero #${userId.slice(-6)}`;
  };

  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + '...';
  };

  const handleTravelerClick = async (trip: any) => {
    const profile = travelerProfiles[trip.user_id];
    const baseTraveler = { ...profile, trip, referral: null };
    setSelectedTraveler(baseTraveler);
    setLoadingTimedOut(false);

    // Check cache first — instant if available
    const cached = travelerDataCacheRef.current.get(trip.id);
    if (cached) {
      setTravelerPackages(cached.travelerPackages);
      setTripAssignments(cached.tripAssignments);
      setSelectedTraveler(cached.selectedTraveler);
      setLoadingAssignments(false);
      setShowTravelerInfo(true);
      return;
    }

    setTravelerPackages([]);
    setTripAssignments([]);
    setLoadingAssignments(true);
    setShowTravelerInfo(true);

    const TIMER_STATUSES = ['matched', 'quote_sent', 'payment_pending'];
    const PAID_OR_POST_PAYMENT = [
      'pending_purchase', 'payment_pending_approval', 'paid',
      'shipped', 'in_transit', 'received_by_traveler',
      'pending_office_confirmation', 'delivered_to_office',
      'ready_for_pickup', 'ready_for_delivery', 'completed'
    ];

    // Safety timeout — 10 seconds
    const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 10000));

    const dataPromise = (async () => {
      // STEP 1: All independent queries in parallel (no waterfall)
      const [referralResult, directResult, biddingAssignmentsResult, allAssignmentsResult] = await Promise.all([
        // Referral
        supabase
          .from('referrals')
          .select('referrer_id, status')
          .eq('referred_id', trip.user_id)
          .maybeSingle(),
        // Direct packages
        supabase
          .from('packages')
          .select(`
            *,
            profiles!packages_user_id_fkey (
              id, first_name, last_name, email, username
            )
          `)
          .eq('matched_trip_id', trip.id)
          .in('status', [...TIMER_STATUSES, ...PAID_OR_POST_PAYMENT]),
        // Bidding assignments (for packages tab)
        supabase
          .from('package_assignments')
          .select('package_id, status')
          .eq('trip_id', trip.id)
          .in('status', ['bid_pending', 'bid_submitted']),
        // All assignments flat (for assignments tab) — NO nested join
        supabase
          .from('package_assignments')
          .select('id, package_id, status, admin_assigned_tip, quote, created_at')
          .eq('trip_id', trip.id)
          .order('created_at', { ascending: false })
      ]);

      // Process referral (fire-and-forget style update)
      let updatedTraveler = baseTraveler;
      if (referralResult.data) {
        try {
          const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', referralResult.data.referrer_id)
            .single();
          updatedTraveler = {
            ...baseTraveler,
            referral: {
              referrerName: referrerProfile ? `${referrerProfile.first_name || ''} ${referrerProfile.last_name || ''}`.trim() || 'Desconocido' : 'Desconocido',
              status: referralResult.data.status,
            }
          };
          setSelectedTraveler(updatedTraveler);
        } catch (err) {
          console.error('Error fetching referrer profile:', err);
        }
      }

      // Process direct packages
      const now = Date.now();
      const isTimerActive = (pkg: any) => (
        (pkg.status === 'matched' && pkg.matched_assignment_expires_at && new Date(pkg.matched_assignment_expires_at).getTime() > now) ||
        ((pkg.status === 'quote_sent' || pkg.status === 'payment_pending') && pkg.quote_expires_at && new Date(pkg.quote_expires_at).getTime() > now)
      );
      const filtered = (directResult.data || []).filter((pkg) => isTimerActive(pkg) || PAID_OR_POST_PAYMENT.includes(pkg.status));

      // STEP 2: Fetch bidding packages + assignment package details in parallel
      const directIds = new Set(filtered.map((p: any) => p.id));
      const assignmentPkgIds = (biddingAssignmentsResult.data || [])
        .map(a => a.package_id)
        .filter(id => !directIds.has(id));

      // Collect all unique package IDs from all assignments for the assignments tab
      const allAssignmentPkgIds = [...new Set((allAssignmentsResult.data || []).map(a => a.package_id))];

      const [biddingResult, assignmentPkgsResult] = await Promise.all([
        // Bidding packages (only if needed)
        assignmentPkgIds.length > 0
          ? supabase
              .from('packages')
              .select(`*, profiles!packages_user_id_fkey (id, first_name, last_name, email, username)`)
              .in('id', assignmentPkgIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        // Assignment packages with profiles (flat query instead of nested join)
        allAssignmentPkgIds.length > 0
          ? supabase
              .from('packages')
              .select('id, item_description, estimated_price, purchase_origin, package_destination, user_id, profiles:user_id (first_name, last_name, username)')
              .in('id', allAssignmentPkgIds)
          : Promise.resolve({ data: [] as any[], error: null })
      ]);

      // Build bidding packages
      const assignmentStatusMap = new Map(
        (biddingAssignmentsResult.data || []).map(a => [a.package_id, a.status])
      );
      const biddingPkgs = (biddingResult.data || []).map(p => ({
        ...p,
        _isBidding: true,
        _assignmentStatus: assignmentStatusMap.get(p.id) || 'bid_pending'
      }));

      const finalPackages = [...filtered, ...biddingPkgs];

      // Build assignments with package data (reconstruct the nested structure)
      const pkgLookup = new Map((assignmentPkgsResult.data || []).map(p => [p.id, p]));
      const finalAssignments = (allAssignmentsResult.data || []).map(a => ({
        ...a,
        packages: pkgLookup.get(a.package_id) || null
      }));

      // Update state
      setTravelerPackages(finalPackages);
      setTripAssignments(finalAssignments);
      setLoadingAssignments(false);

      // Cache the result
      travelerDataCacheRef.current.set(trip.id, {
        travelerPackages: finalPackages,
        tripAssignments: finalAssignments,
        selectedTraveler: updatedTraveler
      });

      return 'done' as const;
    })();

    const result = await Promise.race([dataPromise, timeoutPromise]);
    if (result === 'timeout') {
      console.warn('Traveler data fetch timed out for trip:', trip.id);
      setLoadingTimedOut(true);
      setLoadingAssignments(false);
      // Let the data promise continue in background — it will update state when done
    }
  };

  const toggleTripExpansion = (tripId: number) => {
    const newExpanded = new Set(expandedTrips);
    if (newExpanded.has(tripId)) {
      newExpanded.delete(tripId);
    } else {
      newExpanded.add(tripId);
    }
    setExpandedTrips(newExpanded);
  };

  const handleTripSelection = (tripId: number) => {
    const tripIdStr = String(tripId);
    // Prevent selecting already-assigned trips
    if (alreadyAssignedTripIds.has(tripIdStr)) return;
    
    setSelectedTripIds(prev => {
      const next = new Set(prev);
      if (next.has(tripIdStr)) {
        next.delete(tripIdStr);
      } else {
        next.add(tripIdStr);
      }
      return next;
    });
    // Keep legacy single-select for backward compat (use first selected)
    setSelectedTripId(tripId);
    setMatchingTrip(tripIdStr);
  };

  // Helper functions to detect multi-product orders
  const isMultiProductOrder = () => {
    return fullPackage?.products_data && 
           Array.isArray(fullPackage.products_data) && 
           fullPackage.products_data.length > 1;
  };

  const getProductsForModal = () => {
    if (!fullPackage?.products_data) return [];
    
    return fullPackage.products_data.map((product: any) => ({
      itemDescription: product.itemDescription || product.item_description || product.description || '',
      estimatedPrice: product.estimatedPrice || product.estimated_price || product.price || '0',
      itemLink: product.itemLink || product.item_link || product.link || fullPackage.item_link || '',
      quantity: product.quantity ?? product.qty ?? '1',
      adminAssignedTip: product.adminAssignedTip || 0
    }));
  };

  const getTotalAssignedTip = () => {
    if (isMultiProductOrder() && assignedProductsWithTips.length > 0) {
      return assignedProductsWithTips.reduce((total, product) => total + (product.adminAssignedTip || 0), 0);
    }
    return adminTip ? parseFloat(adminTip) : 0;
  };

  const handleProductTipSave = (productsWithTips: any[], totalTip: number) => {
    setAssignedProductsWithTips(productsWithTips);
    setAdminTip(totalTip.toString());
  };

  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  const handleMatch = async () => {
    if (selectedTripIds.size > 0 && !isSubmittingMatch) {
      setIsSubmittingMatch(true);
      try {
        const tipAmount = getTotalAssignedTip();
        const tripIdsArray = Array.from(selectedTripIds);
        if (isMultiProductOrder()) {
          await onMatch(tipAmount, assignedProductsWithTips, tripIdsArray);
        } else {
          await onMatch(tipAmount, undefined, tripIdsArray);
        }
      } finally {
        setIsSubmittingMatch(false);
      }
    }
  };

  // Helper function to get total quantity
  const getTotalQuantity = () => {
    if (fullPackage?.products_data && Array.isArray(fullPackage.products_data)) {
      return fullPackage.products_data.reduce((total, product) => {
        const quantity = parseInt(product.quantity || product.qty || '1');
        return total + quantity;
      }, 0);
    }
    return 1; // Default quantity for single product
  };

  const isShopperPrime = () => {
    return selectedPackage?.profiles?.trust_level === 'prime' || 
           (selectedPackage?.profiles?.prime_expires_at && new Date(selectedPackage.profiles.prime_expires_at) > new Date());
  };

  const handleCloseDialog = () => {
    closeModal(MODAL_ID);
    setShowMatchDialog(false);
  };

  return (
    <>
    <Dialog open={showMatchDialog} onOpenChange={handleCloseDialog}>
      <DialogContent className="w-[98vw] max-w-5xl h-[98vh] sm:h-[95vh] overflow-hidden flex flex-col p-2 sm:p-4">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
            <Zap className="h-5 w-5 text-primary" />
            <span>Hacer Match de Solicitud</span>
          </DialogTitle>
          <DialogDescription>
            Selecciona el viaje más compatible con esta solicitud
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Package Summary */}
          {selectedPackage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-2 sm:mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-900 font-medium text-sm">📦 Solicitud:</span>
                    <span 
                      className="font-medium text-gray-900 text-sm truncate max-w-[280px] sm:max-w-[400px]" 
                      title={selectedPackage.item_description}
                    >
                      {selectedPackage.item_description}
                    </span>
                  </div>
                  
                  {/* Package Details Row */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                      ${selectedPackage.estimated_price}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                      Cantidad: {getTotalQuantity()}
                    </Badge>
                    <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs">
                      📍 {selectedPackage.purchase_origin || 'No especificado'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-300 text-xs">
                      🎯 {selectedPackage.package_destination || 'Guatemala'}
                    </Badge>
                    {selectedPackage.delivery_deadline && (
                      <Badge variant="outline" className="border-red-300 text-red-700 text-xs">
                                       ⏰ Límite: {(() => {
                                         const date = new Date(selectedPackage.delivery_deadline);
                                         return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT', { 
                                           day: 'numeric', 
                                           month: 'short',
                                           year: 'numeric'
                                         });
                                       })()}
                      </Badge>
                    )}
                    {(() => {
                      const normalizedLink = normalizeProductUrl(selectedPackage.item_link);
                      return normalizedLink && (
                        <a 
                          href={normalizedLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver producto
                        </a>
                      );
                    })()}
                  </div>

                  {/* Additional Package Information */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Additional Notes */}
                    {selectedPackage.additional_notes && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <div>
                          <span className="text-xs text-blue-700 font-medium">COMENTARIOS:</span>
                          <span className="text-xs text-blue-900 ml-1">
                            {selectedPackage.additional_notes.length > 30 
                              ? selectedPackage.additional_notes.substring(0, 30) + '...'
                              : selectedPackage.additional_notes
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                 
                {/* Expand Button */}
                <button
                  onClick={() => setPackageExpanded(!packageExpanded)}
                  className="hidden sm:block p-1 hover:bg-blue-100 rounded transition-colors self-start"
                >
                  {packageExpanded ? (
                    <ChevronDown className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>

              {/* Expandable Package Details */}
              {packageExpanded && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Shopper Info */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700">SHOPPER</p>
                           <p className="font-medium text-sm text-blue-900 flex items-center gap-1">
                              {selectedPackage.profiles?.first_name && selectedPackage.profiles?.last_name 
                                ? `${selectedPackage.profiles.first_name} ${selectedPackage.profiles.last_name}`
                                : selectedPackage.profiles?.username || 'Usuario'}
                              {isShopperPrime() && (
                                <span title="Usuario Prime">
                                  <Star className="h-3 w-3 text-purple-500 fill-purple-500" />
                                </span>
                              )}
                              <span className="text-xs text-blue-600 ml-2">
                                (ID: {selectedPackage.user_id || 'N/A'})
                              </span>
                            </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-700">ORIGEN DE COMPRA</p>
                           <p className="font-medium text-sm text-blue-900">
                             {selectedPackage.purchase_origin || 'No especificado'}
                           </p>
                        </div>
                      </div>
                    </div>

                    {/* Product Details - Mostrar links de cada producto */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-blue-700">PRODUCTOS ({fullPackage?.products_data?.length || 1})</p>
                          
                          {fullPackage?.products_data && Array.isArray(fullPackage.products_data) && fullPackage.products_data.length > 0 ? (
                            <div className="space-y-2 mt-1">
                              {fullPackage.products_data.map((product: any, index: number) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-blue-900 truncate flex-1 min-w-0">
                                      {index + 1}. {product.itemDescription || product.item_description || 'Producto'}
                                    </span>
                                    <span className="shrink-0">
                                      {(() => {
                                        const normalizedLink = normalizeProductUrl(product.itemLink || product.item_link);
                                        return normalizedLink ? (
                                          <a
                                            href={normalizedLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            Ver
                                          </a>
                                        ) : (
                                          <span className="text-xs text-gray-400">Sin link</span>
                                        );
                                      })()}
                                    </span>
                                  </div>
                                  {/* Indicador de empaque original */}
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] ${
                                      product.needsOriginalPackaging 
                                        ? 'text-amber-600 border-amber-300 bg-amber-50' 
                                        : 'text-gray-500 border-gray-300 bg-gray-50'
                                    }`}
                                  >
                                    📦 {product.needsOriginalPackaging ? 'Empaque original' : 'Sin empaque'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (() => {
                            const normalizedLink = normalizeProductUrl(selectedPackage?.item_link);
                            return normalizedLink ? (
                              <a 
                                href={normalizedLink}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-sm text-blue-600 hover:underline truncate block mt-1"
                              >
                                Ver producto
                              </a>
                            ) : (
                              <p className="text-sm text-gray-500 mt-1">Sin links de productos</p>
                            );
                          })()}
                          
                          <p className="text-xs text-blue-700 mt-1">
                            Total: {getTotalQuantity()} unidad{getTotalQuantity() !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                       {selectedPackage.additional_notes && (
                         <div className="flex items-start space-x-2">
                           <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                           <div>
                             <p className="text-xs text-blue-700">NOTAS</p>
                             <p className="font-medium text-sm text-blue-900">
                               {selectedPackage.additional_notes}
                             </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous rejection tip banner */}
          {selectedPackage?.traveler_rejection?.previous_admin_assigned_tip != null && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 flex-shrink-0">
              <div className="flex items-center gap-2 text-orange-800">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">
                  <span className="font-medium">Último tip ofrecido: Q{Number(selectedPackage.traveler_rejection.previous_admin_assigned_tip).toFixed(2)}</span>
                  <span className="text-orange-600 ml-1">
                    — rechazado por {selectedPackage.traveler_rejection.rejection_reason === 'tip_bajo' ? 'tip bajo' : selectedPackage.traveler_rejection.rejection_reason || 'viajero'}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Trips List */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <Label className="text-lg font-semibold text-gray-900">
                Viajes Disponibles ({validTrips.length})
              </Label>
              <p className="text-sm text-gray-600">
                Haz clic en un viaje para seleccionarlo
              </p>
            </div>

            {/* Show All Trips Indicator */}
            {showAllTrips && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-amber-800">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Mostrando viajes de todos los países
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllTrips(false)}
                  className="text-amber-800 hover:bg-amber-100 h-7 px-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Solo {selectedPackage?.purchase_origin}
                </Button>
              </div>
            )}

            {/* Show Other Cities Indicator */}
            {showOtherCities && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-blue-800">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Mostrando viajes a todas las ciudades de Guatemala
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowOtherCities(false)}
                  className="text-blue-800 hover:bg-blue-100 h-7 px-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Solo {selectedPackage?.package_destination}
                </Button>
              </div>
            )}

            <ScrollArea className="flex-1 w-full min-h-0">
              <div className="space-y-2 pr-4 pb-4">
                {/* Empty State - Check for trips to other cities first */}
                {validTrips.length === 0 && !showAllTrips && !showOtherCities && otherCityTrips.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No hay viajes disponibles a {selectedPackage?.package_destination}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pero hay {otherCityTrips.length} viaje(s) a otras ciudades de Guatemala
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOtherCities(true)}
                      className="gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Ver viajes a otras ciudades
                    </Button>
                  </div>
                )}

                {/* Empty State with Option to Show Other Countries (after checking other cities) */}
                {validTrips.length === 0 && !showAllTrips && (showOtherCities || otherCityTrips.length === 0) && allDestinationTrips.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No hay viajes disponibles desde {selectedPackage?.purchase_origin}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pero hay {allDestinationTrips.length} viaje(s) desde otros países hacia {selectedPackage?.package_destination}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAllTrips(true)}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Ver viajes de otros países
                    </Button>
                  </div>
                )}

                {/* No trips at all */}
                {validTrips.length === 0 && (showAllTrips || allDestinationTrips.length === 0) && (showOtherCities || otherCityTrips.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      No hay viajes disponibles para esta ruta
                    </p>
                  </div>
                )}

                {validTrips.map((trip) => {
                  const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
                  const tripOriginNormalized = normalizeCountry(trip.from_country || '');
                  const isDifferentCountry = showAllTrips && tripOriginNormalized !== packageOriginNormalized;
                  const wasPreviouslyRejected = (selectedPackage?.traveler_rejection?.previous_traveler_id || selectedPackage?.traveler_rejection?.rejected_by) === trip.user_id;
                  const isDifferentCity = showOtherCities && 
                    trip.to_city?.toLowerCase().trim() !== selectedPackage?.package_destination?.toLowerCase().trim();
                  
                  return (
                    <Card 
                      key={trip.id} 
                      className={`transition-all duration-200 hover:shadow-md ${
                        alreadyAssignedTripIds.has(String(trip.id))
                          ? 'opacity-50 bg-muted border-muted cursor-not-allowed'
                          : selectedTripIds.has(String(trip.id))
                            ? 'ring-2 ring-primary bg-primary/5 cursor-pointer' 
                            : wasPreviouslyRejected
                              ? 'bg-red-50 border-2 border-red-300 hover:bg-red-100 cursor-pointer'
                              : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                      onClick={() => handleTripSelection(trip.id)}
                    >
                    <CardContent className="p-2 sm:p-3">
                         {alreadyAssignedTripIds.has(String(trip.id)) && (
                           <Badge variant="secondary" className="mb-2 text-xs">✅ Ya asignado</Badge>
                         )}
                         {/* Main Trip Info - Mobile Responsive Layout */}
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
                               {/* Traveler */}
                               <div className="flex items-center space-x-2 max-w-[200px] sm:max-w-[220px]">
                                   <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer" onClick={() => handleAvatarClick(travelerProfiles[trip.user_id]?.avatar_url)}>
                                    {travelerProfiles[trip.user_id]?.avatar_url && (
                                      <AvatarImage src={getHighResGoogleAvatar(travelerProfiles[trip.user_id].avatar_url)} alt="Avatar" />
                                    )}
                                    <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                                      {travelerProfiles[trip.user_id]?.first_name?.[0] || trip.user_id?.toString().slice(-2) || '00'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p 
                                          className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline truncate"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTravelerClick(trip);
                                          }}
                                        >
                                          {truncateName(getTravelerName(trip.user_id), 25)}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-white border shadow-lg z-50">
                                        <p className="text-sm">{getTravelerName(trip.user_id)}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                               </div>

                              {/* Route */}
                              <div className="flex items-center space-x-2 min-w-fit">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                 <div className="flex items-center space-x-2 flex-wrap">
                                   <span className="text-sm font-medium text-gray-700">
                                     {trip.from_city || 'No especificado'}
                                   </span>
                                   <span className="text-gray-400">→</span>
                                   <span className="text-sm font-medium text-gray-900">
                                     {trip.to_city}
                                   </span>
                                   {isDifferentCountry && (
                                     <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs ml-1">
                                       ⚠️ País diferente
                                     </Badge>
                                   )}
                                   {isDifferentCity && (
                                     <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs ml-1">
                                       📍 Ciudad diferente
                                     </Badge>
                                   )}
                                 </div>
                              </div>

                               {/* Reception Window */}
                               <div className="flex items-center space-x-2 min-w-fit">
                                 <Package className="h-4 w-4 text-gray-400" />
                                 <div>
                                   <p className="text-xs text-gray-500 font-medium">VENTANA RECEPCIÓN</p>
                                    <p className="text-sm font-medium text-gray-700">
                                      {trip.first_day_packages && trip.last_day_packages ? 
                                        (() => {
                                          const dateFirst = new Date(trip.first_day_packages);
                                          const dateLast = new Date(trip.last_day_packages);
                                          return `${new Date(dateFirst.getUTCFullYear(), dateFirst.getUTCMonth(), dateFirst.getUTCDate()).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} - ${new Date(dateLast.getUTCFullYear(), dateLast.getUTCMonth(), dateLast.getUTCDate()).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}`;
                                        })()
                                        : 'Por confirmar'
                                      }
                                    </p>
                                 </div>
                               </div>

                               {/* Total Value Containers - Pending & Confirmed */}
                               {(() => {
                                 const { pendingTotal, confirmedTotal } = calculateTripPackagesTotals(trip.id);
                                 return (
                                   <div className="flex items-center space-x-3 min-w-fit">
                                     {pendingTotal > 0 && (
                                       <div>
                                         <p className="text-xs text-amber-600 font-medium">Pendiente</p>
                                         <p className="text-sm font-medium text-amber-700">
                                           ${pendingTotal.toFixed(2)}
                                         </p>
                                       </div>
                                     )}
                                     {confirmedTotal > 0 && (
                                       <div>
                                         <p className="text-xs text-green-600 font-medium">Confirmado</p>
                                         <p className="text-sm font-medium text-green-700">
                                           ${confirmedTotal.toFixed(2)}
                                         </p>
                                       </div>
                                     )}
                                   </div>
                                 );
                               })()}
                            </div>

                            {/* Right side - Dates and Badges */}
                           <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                             {/* Key Dates */}
                             <div className="flex items-center justify-between sm:justify-start space-x-4 min-w-fit">
                               <div className="text-center">
                                 <p className="text-xs text-gray-500 font-medium">LLEGADA</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-500 font-medium">ENTREGA</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {trip.delivery_date ? new Date(trip.delivery_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                  </p>
                               </div>
                             </div>

                             {/* Badges */}
                             <div className="flex items-center sm:flex-col sm:items-center justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-1 min-w-fit">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${trip.delivery_method === 'oficina' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  {trip.delivery_method === 'oficina' ? 'Oficina' : 'Mensajero'}
                                </Badge>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  {trip.available_space}kg
                                </Badge>
                             </div>

                             {/* Expand Button */}
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 toggleTripExpansion(trip.id);
                               }}
                               className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 self-end sm:self-center"
                             >
                               {expandedTrips.has(trip.id) ? (
                                 <ChevronDown className="h-4 w-4 text-gray-400" />
                               ) : (
                                 <ChevronRight className="h-4 w-4 text-gray-400" />
                               )}
                             </button>
                           </div>
                         </div>

                       {/* Expandable Content */}
                       {expandedTrips.has(trip.id) && (
                         <div className="mt-3 pt-3 border-t border-gray-200">
                           <ScrollArea className="max-h-[600px] w-full">
                             <div className="grid grid-cols-2 gap-3 pr-2">
                               {/* Package Window Details */}
                               <div className="bg-blue-50 rounded-lg p-3">
                                 <div className="flex items-center space-x-2 mb-2">
                                   <Package className="h-3 w-3 text-blue-600" />
                                   <span className="font-medium text-blue-900 text-sm">Ventana de Recepción</span>
                                 </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-blue-700">Primer día:</span>
                                       <span className="font-medium text-blue-900">
                                         {trip.first_day_packages ? formatDateUTC(new Date(trip.first_day_packages)) : 'No especificado'}
                                       </span>
                                     </div>
                                     <div className="flex justify-between">
                                       <span className="text-blue-700">Último día:</span>
                                       <span className="font-medium text-blue-900">
                                         {trip.last_day_packages ? formatDateUTC(new Date(trip.last_day_packages)) : 'No especificado'}
                                       </span>
                                    </div>
                                  </div>
                               </div>

                               {/* Additional Details */}
                               <div className="space-y-2">
                                 <div className="flex items-center space-x-2">
                                   <Calendar className="h-3 w-3 text-gray-400" />
                                   <div>
                                      <p className="text-xs text-gray-500">PAÍS DE DESTINO</p>
                                      <p className="font-medium text-xs">{trip.to_country || 'Guatemala'}</p>
                                   </div>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   <User className="h-3 w-3 text-gray-400" />
                                   <div>
                                     <p className="text-xs text-gray-500">ID DE VIAJE</p>
                                     <p className="font-medium text-xs">#{trip.id}</p>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </ScrollArea>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                  );
                })}

                {/* Other US Cities Section */}
                {otherUSCityTrips.length > 0 && validTrips.length > 0 && (
                  <>
                    <div className="border-t border-dashed border-gray-300 my-4 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">
                          Otras ciudades en Estados Unidos ({otherUSCityTrips.length})
                        </span>
                      </div>
                    </div>
                    
                    {otherUSCityTrips.map((trip) => {
                      const wasPreviouslyRejected = (selectedPackage?.traveler_rejection?.previous_traveler_id || selectedPackage?.traveler_rejection?.rejected_by) === trip.user_id;
                      
                      return (
                        <Card 
                          key={`us-${trip.id}`} 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedTripIds.has(String(trip.id))
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : wasPreviouslyRejected
                                ? 'bg-red-50 border-2 border-red-300 hover:bg-red-100'
                                : 'hover:bg-amber-50/50 border-amber-200'
                          }`}
                          onClick={() => handleTripSelection(trip.id)}
                        >
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
                                {/* Traveler */}
                                <div className="flex items-center space-x-2 min-w-fit">
                                   <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer" onClick={() => handleAvatarClick(travelerProfiles[trip.user_id]?.avatar_url)}>
                                    {travelerProfiles[trip.user_id]?.avatar_url && (
                                      <AvatarImage src={getHighResGoogleAvatar(travelerProfiles[trip.user_id].avatar_url)} alt="Avatar" />
                                    )}
                                    <AvatarFallback className="text-xs font-medium bg-amber-200 text-amber-800">
                                      {travelerProfiles[trip.user_id]?.first_name?.[0] || trip.user_id?.toString().slice(-2) || '00'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p 
                                      className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTravelerClick(trip);
                                      }}
                                    >
                                      {getTravelerName(trip.user_id)}
                                    </p>
                                  </div>
                                </div>

                                {/* Route */}
                                <div className="flex items-center space-x-2 min-w-fit">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700">
                                      {trip.from_city || 'No especificado'}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {trip.to_city}
                                    </span>
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs ml-1">
                                      📍 Ciudad diferente
                                    </Badge>
                                  </div>
                                </div>

                                {/* Total Value Containers - Pending & Confirmed */}
                                {(() => {
                                  const { pendingTotal, confirmedTotal } = calculateTripPackagesTotals(trip.id);
                                  return (
                                    <div className="flex items-center space-x-3 min-w-fit">
                                      {pendingTotal > 0 && (
                                        <div>
                                          <p className="text-xs text-amber-600 font-medium">Pendiente</p>
                                          <p className="text-sm font-medium text-amber-700">
                                            ${pendingTotal.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                      {confirmedTotal > 0 && (
                                        <div>
                                          <p className="text-xs text-green-600 font-medium">Confirmado</p>
                                          <p className="text-sm font-medium text-green-700">
                                            ${confirmedTotal.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Right side - Dates and Badges */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center justify-between sm:justify-start space-x-4 min-w-fit">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-medium">LLEGADA</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-medium">ENTREGA</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {trip.delivery_date ? new Date(trip.delivery_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center sm:flex-col sm:items-center justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-1 min-w-fit">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${trip.delivery_method === 'oficina' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}
                                  >
                                    <Truck className="h-3 w-3 mr-1" />
                                    {trip.delivery_method === 'oficina' ? 'Oficina' : 'Mensajero'}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                    {trip.available_space}kg
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}

                {/* Other Spain Cities Section */}
                {otherSpainCityTrips.length > 0 && validTrips.length > 0 && (
                  <>
                    <div className="border-t border-dashed border-gray-300 my-4 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">
                          Otras ciudades en España ({otherSpainCityTrips.length})
                        </span>
                      </div>
                    </div>
                    
                    {otherSpainCityTrips.map((trip) => {
                      const wasPreviouslyRejected = (selectedPackage?.traveler_rejection?.previous_traveler_id || selectedPackage?.traveler_rejection?.rejected_by) === trip.user_id;
                      
                      return (
                        <Card 
                          key={`spain-${trip.id}`} 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedTripIds.has(String(trip.id)) 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : wasPreviouslyRejected
                                ? 'bg-red-50 border-2 border-red-300 hover:bg-red-100'
                                : 'hover:bg-orange-50/50 border-orange-200'
                          }`}
                          onClick={() => handleTripSelection(trip.id)}
                        >
                          <CardContent className="p-2 sm:p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
                                {/* Traveler */}
                                <div className="flex items-center space-x-2 min-w-fit">
                                   <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer" onClick={() => handleAvatarClick(travelerProfiles[trip.user_id]?.avatar_url)}>
                                    {travelerProfiles[trip.user_id]?.avatar_url && (
                                      <AvatarImage src={getHighResGoogleAvatar(travelerProfiles[trip.user_id].avatar_url)} alt="Avatar" />
                                    )}
                                    <AvatarFallback className="text-xs font-medium bg-orange-200 text-orange-800">
                                      {travelerProfiles[trip.user_id]?.first_name?.[0] || trip.user_id?.toString().slice(-2) || '00'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p 
                                      className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTravelerClick(trip);
                                      }}
                                    >
                                      {getTravelerName(trip.user_id)}
                                    </p>
                                  </div>
                                </div>

                                {/* Route */}
                                <div className="flex items-center space-x-2 min-w-fit">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700">
                                      {trip.from_city || 'No especificado'}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {trip.to_city}
                                    </span>
                                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs ml-1">
                                      📍 Ciudad diferente
                                    </Badge>
                                  </div>
                                </div>

                                {/* Total Value Containers - Pending & Confirmed */}
                                {(() => {
                                  const { pendingTotal, confirmedTotal } = calculateTripPackagesTotals(trip.id);
                                  return (
                                    <div className="flex items-center space-x-3 min-w-fit">
                                      {pendingTotal > 0 && (
                                        <div>
                                          <p className="text-xs text-amber-600 font-medium">Pendiente</p>
                                          <p className="text-sm font-medium text-amber-700">
                                            ${pendingTotal.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                      {confirmedTotal > 0 && (
                                        <div>
                                          <p className="text-xs text-green-600 font-medium">Confirmado</p>
                                          <p className="text-sm font-medium text-green-700">
                                            ${confirmedTotal.toFixed(2)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Right side - Dates and Badges */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center justify-between sm:justify-start space-x-4 min-w-fit">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-medium">LLEGADA</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {trip.arrival_date ? new Date(trip.arrival_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-medium">ENTREGA</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {trip.delivery_date ? new Date(trip.delivery_date).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' }) : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center sm:flex-col sm:items-center justify-between sm:justify-start space-x-2 sm:space-x-0 sm:space-y-1 min-w-fit">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${trip.delivery_method === 'oficina' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}
                                  >
                                    <Truck className="h-3 w-3 mr-1" />
                                    {trip.delivery_method === 'oficina' ? 'Oficina' : 'Mensajero'}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                    {trip.available_space}kg
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Action Bar: Tip + Buttons */}
        <div className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {selectedTripIds.size > 0 && (
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Tip asignado por Admin
                </Label>
              </div>
              
              {isMultiProductOrder() ? (
                // Multi-product order: Show button to open modal
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProductTipModal(true)}
                    className="w-full sm:w-auto shrink-0"
                    disabled={!fullPackage?.products_data && loadingDetails}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {(!fullPackage?.products_data && loadingDetails) ? 'Cargando...' : `Asignar Tips por Producto (${fullPackage?.products_data?.length || 0} productos)`}
                  </Button>
                  {getTotalAssignedTip() > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex-1">
                      <p className="text-sm font-medium text-green-800">
                        Tips asignados: Q{getTotalAssignedTip().toFixed(2)}
                      </p>
                      <p className="text-xs text-green-600">
                        {assignedProductsWithTips.length} producto{assignedProductsWithTips.length !== 1 ? 's' : ''} con tips individuales
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Single product order: Show input field
                <div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Q</span>
                    <Input
                      id="admin-tip"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ej: 25.00"
                      value={adminTip}
                      onChange={(e) => setAdminTip(e.target.value)}
                      className="text-sm pl-7 h-11 w-full sm:w-48"
                    />
                  </div>
                  {!adminTip && (
                    <p className="text-xs text-destructive mt-1">Este campo es requerido para confirmar el match.</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Monto en GTQ que se asignará al viajero por este paquete
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col w-full sm:w-auto gap-2">
            {selectedTripIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Seleccionados:</span>
                {Array.from(selectedTripIds).map(tripId => {
                  const allTrips = [...(validTrips || []), ...(otherCityTrips || []), ...(otherUSCityTrips || []), ...(otherSpainCityTrips || [])];
                  const trip = allTrips.find(t => String(t.id) === tripId);
                  const name = trip ? getTravelerName(trip.user_id) : 'Desconocido';
                  return (
                    <Badge key={tripId} variant="secondary" className="text-xs gap-1">
                      <Users className="h-3 w-3" />
                      {name}
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleMatch} 
                className="flex-1 sm:flex-none sm:w-auto h-11"
                disabled={selectedTripIds.size === 0 || getTotalAssignedTip() <= 0 || isSubmittingMatch}
                variant="shopper"
              >
                {isSubmittingMatch ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {selectedTripIds.size > 1 
                      ? `Confirmar Match (${selectedTripIds.size} viajes)` 
                      : 'Confirmar Match'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowMatchDialog(false)}
                className="px-8 h-11"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      {/* Traveler Info Modal */}
      <Dialog open={showTravelerInfo} onOpenChange={setShowTravelerInfo}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Información del Viajero</span>
            </DialogTitle>
            <DialogDescription>
              Perfil y paquetes del viajero seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedTraveler && (
            <div className="space-y-6">
              {/* Traveler Profile */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 cursor-pointer" onClick={() => handleAvatarClick(selectedTraveler.avatar_url)}>
                      {selectedTraveler.avatar_url && (
                        <AvatarImage src={getHighResGoogleAvatar(selectedTraveler.avatar_url)} alt="Avatar" />
                      )}
                      <AvatarFallback className="text-lg font-medium bg-muted text-muted-foreground">
                        {selectedTraveler.first_name?.[0] || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold">Perfil del Viajero</h3>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Nombre</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.first_name && selectedTraveler.last_name 
                            ? `${selectedTraveler.first_name} ${selectedTraveler.last_name}` 
                            : selectedTraveler.username || `Usuario ID: ${selectedTraveler.trip?.user_id}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Teléfono</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.country_code && selectedTraveler.phone_number
                            ? `${selectedTraveler.country_code} ${selectedTraveler.phone_number}`
                            : selectedTraveler.phone_number || 'No especificado'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Ruta de Viaje</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip?.from_city} → {selectedTraveler.trip?.to_city}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Fecha de Llegada</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip?.arrival_date 
                            ? new Date(selectedTraveler.trip.arrival_date).toLocaleDateString('es-GT')
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Método de Entrega</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip?.delivery_method === 'oficina' ? 'Oficina Favorón' : 'Mensajero'}
                        </p>
                      </div>
                    </div>

                    {selectedTraveler.referral && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Referido por</p>
                          <p className="text-sm text-green-600 font-semibold">
                            {selectedTraveler.referral.referrerName}
                            {selectedTraveler.referral.status === 'completed' && (
                              <Badge variant="outline" className="ml-2 text-xs border-green-500 text-green-600">Completado</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              {selectedTraveler.trip?.package_receiving_address && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Información de Envío</span>
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-sm font-medium">Dirección de Recepción</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip.package_receiving_address.streetAddress}
                        </p>
                      </div>
                      
                      {selectedTraveler.trip.package_receiving_address.streetAddress2 && (
                        <div>
                          <p className="text-sm font-medium">Dirección 2</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTraveler.trip.package_receiving_address.streetAddress2}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium">Ciudad/Área</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip.package_receiving_address.cityArea}
                        </p>
                      </div>
                      
                      {selectedTraveler.trip.package_receiving_address.postalCode && (
                        <div>
                          <p className="text-sm font-medium">Código Postal</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTraveler.trip.package_receiving_address.postalCode}
                          </p>
                        </div>
                      )}
                      
                      {selectedTraveler.trip.package_receiving_address.accommodationType && (
                        <div>
                          <p className="text-sm font-medium">Tipo de Hospedaje</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedTraveler.trip.package_receiving_address.accommodationType === 'casa' 
                              ? 'Casa' 
                              : selectedTraveler.trip.package_receiving_address.accommodationType === 'hotel'
                              ? 'Hotel'
                              : selectedTraveler.trip.package_receiving_address.accommodationType === 'airbnb'
                              ? 'Airbnb'
                              : selectedTraveler.trip.package_receiving_address.accommodationType}
                          </p>
                        </div>
                      )}
                      
                      {selectedTraveler.trip.package_receiving_address.hotelAirbnbName && (
                        <div>
                          <p className="text-sm font-medium">
                            {selectedTraveler.trip.package_receiving_address.accommodationType === 'hotel' 
                              ? 'Nombre del Hotel'
                              : selectedTraveler.trip.package_receiving_address.accommodationType === 'airbnb'
                              ? 'Nombre del Airbnb'
                              : 'Nombre del Edificio/Residencial'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTraveler.trip.package_receiving_address.hotelAirbnbName}
                          </p>
                        </div>
                      )}
                      
                      {selectedTraveler.trip.package_receiving_address.recipientName && (
                        <div>
                          <p className="text-sm font-medium">Destinatario</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedTraveler.trip.package_receiving_address.recipientName}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium">Teléfono de Contacto</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip.package_receiving_address.contactNumber}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Ventana de Recepción de Paquetes</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTraveler.trip.first_day_packages && selectedTraveler.trip.last_day_packages 
                            ? (() => {
                                const dateFirst = new Date(selectedTraveler.trip.first_day_packages);
                                const dateLast = new Date(selectedTraveler.trip.last_day_packages);
                                return `${new Date(dateFirst.getUTCFullYear(), dateFirst.getUTCMonth(), dateFirst.getUTCDate()).toLocaleDateString('es-GT')} - ${new Date(dateLast.getUTCFullYear(), dateLast.getUTCMonth(), dateLast.getUTCDate()).toLocaleDateString('es-GT')}`;
                              })()
                            : 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Traveler's Packages */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">
                    Paquetes en este Viaje ({travelerPackages.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  {travelerPackages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Este viaje no tiene paquetes asignados aún</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {travelerPackages.map((pkg) => (
                        <div key={pkg.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{pkg.item_description}</p>
                              <p className="text-xs text-muted-foreground">
                                De: {pkg.purchase_origin} → Para: {pkg.package_destination}
                              </p>
                              <p className="text-xs text-blue-600 font-medium">
                                Shopper: {formatFullName(pkg.profiles?.first_name, pkg.profiles?.last_name) || pkg.profiles?.username || 'Nombre no disponible'}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-xs">
                                ${pkg.estimated_price}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Estado: {getStatusLabel(pkg.status)}
                              </p>
                              {(pkg as any)._isBidding && (
                                <Badge variant="warning" className="text-xs mt-1">
                                  ⚡ {(pkg as any)._assignmentStatus === 'bid_submitted' ? 'Cotización Enviada' : 'Compitiendo'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {pkg.additional_notes && (
                            <p className="text-xs text-muted-foreground bg-white p-2 rounded border">
                              {pkg.additional_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Trip Assignments (package_assignments) */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Asignaciones del Viaje ({tripAssignments.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  {loadingAssignments ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                      <p>Cargando asignaciones...</p>
                    </div>
                  ) : tripAssignments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Zap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No hay asignaciones para este viaje</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tripAssignments.map((assignment: any) => {
                        const pkg = assignment.packages;
                        const shopperProfile = pkg?.profiles;
                        const tipAmount = assignment.quote?.price || assignment.admin_assigned_tip || 0;

                        const getBidBadge = (status: string) => {
                          switch (status) {
                            case 'bid_pending':
                              return <Badge variant="warning" className="text-xs">Pendiente</Badge>;
                            case 'bid_submitted':
                              return <Badge variant="default" className="text-xs">Cotización Enviada</Badge>;
                            case 'bid_won':
                              return <Badge variant="success" className="text-xs">Ganada</Badge>;
                            case 'bid_lost':
                              return <Badge variant="destructive" className="text-xs">Perdida</Badge>;
                            case 'bid_expired':
                              return <Badge variant="secondary" className="text-xs">Expirada</Badge>;
                            case 'bid_cancelled':
                              return <Badge variant="secondary" className="text-xs">Cancelada</Badge>;
                            default:
                              return <Badge variant="outline" className="text-xs">{status}</Badge>;
                          }
                        };

                        return (
                          <div key={assignment.id} className="border rounded-lg p-3 bg-muted/30">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{pkg?.item_description || 'Sin descripción'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {pkg?.purchase_origin} → {pkg?.package_destination}
                                </p>
                                <p className="text-xs text-primary font-medium">
                                  Shopper: {formatFullName(shopperProfile?.first_name, shopperProfile?.last_name) || shopperProfile?.username || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                {getBidBadge(assignment.status)}
                                <div className="text-xs text-muted-foreground">
                                  ${Number(pkg?.estimated_price || 0).toFixed(2)}
                                </div>
                                {tipAmount > 0 && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Tip: Q{Number(tipAmount).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Tip Assignment Modal */}
      <ProductTipAssignmentModal
        key={selectedPackage?.id || 'default'}
        isOpen={showProductTipModal}
        onClose={() => setShowProductTipModal(false)}
        onSave={handleProductTipSave}
        products={getProductsForModal()}
        packageId={selectedPackage?.id || ''}
        persistOnSave={false}
      />

      <ImageViewerModal
        isOpen={avatarViewerOpen}
        onClose={() => setAvatarViewerOpen(false)}
        imageUrl={avatarViewerUrl}
        title="Foto de perfil"
        filename="avatar.jpg"
      />
    </>
  );
};

export default AdminMatchDialog;
