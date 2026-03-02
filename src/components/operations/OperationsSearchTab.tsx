import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Tag, MapPin, User, Calendar, Plane, ChevronDown, Package, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor } from '@/lib/styles';
import { getStatusLabel } from '@/lib/formatters';
import { PackageLabelModal } from '@/components/admin/PackageLabelModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SearchResult {
  package_id: string;
  package_status: string;
  item_description: string;
  label_number: number | null;
  estimated_price: number | null;
  created_at: string;
  delivery_deadline: string;
  products_data: any;
  shopper_first_name: string | null;
  shopper_last_name: string | null;
  traveler_first_name: string | null;
  traveler_last_name: string | null;
  from_city: string | null;
  to_city: string | null;
  matched_trip_id: string | null;
  trip_arrival_date: string | null;
  trip_delivery_date: string | null;
  trip_status: string | null;
}

interface TripGroup {
  tripId: string | null;
  fromCity: string | null;
  toCity: string | null;
  arrivalDate: string | null;
  travelerName: string | null;
  tripStatus: string | null;
  packages: SearchResult[];
}

const OperationsSearchTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [labelPkg, setLabelPkg] = useState<any>(null);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search
  useEffect(() => {
    if (debouncedTerm.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const doSearch = async () => {
      setLoading(true);
      setHasSearched(true);
      const { data, error } = await supabase.rpc('search_operations_packages', {
        search_term: debouncedTerm,
      });
      if (!error && data) {
        setResults(data as SearchResult[]);
      } else {
        setResults([]);
      }
      setLoading(false);
    };
    doSearch();
  }, [debouncedTerm]);

  // Group results by trip
  const tripGroups = useMemo((): TripGroup[] => {
    const map = new Map<string, TripGroup>();

    for (const item of results) {
      const key = item.matched_trip_id || '__unassigned__';

      if (!map.has(key)) {
        map.set(key, {
          tripId: item.matched_trip_id,
          fromCity: item.from_city,
          toCity: item.to_city,
          arrivalDate: item.trip_arrival_date,
          travelerName: item.traveler_first_name
            ? `${item.traveler_first_name} ${item.traveler_last_name || ''}`.trim()
            : null,
          tripStatus: item.trip_status,
          packages: [],
        });
      }

      map.get(key)!.packages.push(item);
    }

    const groups = Array.from(map.values());

    // Sort: trips with arrival date (newest first), then unassigned at end
    groups.sort((a, b) => {
      if (!a.tripId) return 1;
      if (!b.tripId) return -1;
      if (a.arrivalDate && b.arrivalDate) {
        return new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime();
      }
      return 0;
    });

    return groups;
  }, [results]);

  const getProductNames = (item: SearchResult) => {
    if (item.products_data && Array.isArray(item.products_data)) {
      return (item.products_data as any[])
        .map((p: any) => p.itemDescription || p.name || p.description)
        .filter(Boolean)
        .join(', ');
    }
    return item.item_description;
  };

  const totalPackages = results.length;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, shopper, viajero, descripción o # etiqueta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && !hasSearched && (
        <EmptyState
          icon="search"
          title="Buscar pedidos"
          description="Escribe al menos 2 caracteres para buscar pedidos por ID, nombre del shopper o viajero, descripción o número de etiqueta."
          showAction={false}
          variant="card"
        />
      )}

      {!loading && hasSearched && results.length === 0 && (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description={`No se encontraron pedidos para "${debouncedTerm}"`}
          showAction={false}
          variant="card"
        />
      )}

      {!loading && tripGroups.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {totalPackages} paquete{totalPackages !== 1 ? 's' : ''} en {tripGroups.length} grupo{tripGroups.length !== 1 ? 's' : ''}
          </p>

          {tripGroups.map((group) => (
            <Collapsible key={group.tripId || '__unassigned__'} defaultOpen>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {group.tripId ? (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
                          <Plane className="h-4 w-4 text-primary" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      <div className="text-left min-w-0">
                        {group.tripId ? (
                          <>
                            <p className="text-sm font-medium truncate">
                              {group.fromCity} → {group.toCity}
                              {group.arrivalDate && (
                                <span className="text-muted-foreground font-normal ml-2">
                                  {format(new Date(group.arrivalDate), 'dd MMM yyyy', { locale: es })}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              Viajero: {group.travelerName || 'Sin asignar'}
                              <span className="ml-2">· {group.packages.length} paquete{group.packages.length !== 1 ? 's' : ''}</span>
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">Sin viaje asignado</p>
                            <p className="text-xs text-muted-foreground">
                              {group.packages.length} paquete{group.packages.length !== 1 ? 's' : ''}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-2">
                    {group.packages.map((item) => (
                      <div
                        key={item.package_id}
                        className="rounded-md border bg-muted/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.label_number && (
                                <Badge variant="outline" className="gap-1 font-mono">
                                  <Tag className="h-3 w-3" />
                                  #{item.label_number}
                                </Badge>
                              )}
                              <Badge className={getStatusColor(item.package_status)}>
                                {getStatusLabel(item.package_status)}
                              </Badge>
                            </div>

                            <p className="font-medium text-sm truncate">
                              {getProductNames(item)}
                            </p>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.shopper_first_name} {item.shopper_last_name}
                              </span>

                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(item.created_at), 'dd MMM yyyy', { locale: es })}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground/60 font-mono truncate">
                              ID: {item.package_id}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.estimated_price != null && (
                              <span className="text-sm font-semibold whitespace-nowrap">
                                Q{item.estimated_price.toFixed(2)}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Ver etiqueta"
                              onClick={() => setLabelPkg({
                                id: item.package_id,
                                item_description: getProductNames(item),
                                products_data: item.products_data,
                                label_number: item.label_number,
                                status: item.package_status,
                                estimated_price: item.estimated_price,
                                created_at: item.created_at,
                                shopper_name: `${item.shopper_first_name || ''} ${item.shopper_last_name || ''}`.trim(),
                              })}
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
      {labelPkg && (
        <PackageLabelModal
          isOpen={!!labelPkg}
          onClose={() => setLabelPkg(null)}
          pkg={labelPkg}
        />
      )}
    </div>
  );
};

export default OperationsSearchTab;
