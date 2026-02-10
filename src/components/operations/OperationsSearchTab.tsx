import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Tag, MapPin, User, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor } from '@/lib/styles';
import { getStatusLabel } from '@/lib/formatters';
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
}

const OperationsSearchTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const getProductNames = (item: SearchResult) => {
    if (item.products_data && Array.isArray(item.products_data)) {
      return (item.products_data as any[])
        .map((p: any) => p.name || p.description)
        .filter(Boolean)
        .join(', ');
    }
    return item.item_description;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, nombre del shopper, descripción o # etiqueta..."
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
          description="Escribe al menos 2 caracteres para buscar pedidos por ID, nombre, descripción o número de etiqueta."
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

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((item) => (
            <Card key={item.package_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
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

                      {item.from_city && item.to_city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.from_city} → {item.to_city}
                        </span>
                      )}

                      {item.traveler_first_name && (
                        <span className="text-xs">
                          Viajero: {item.traveler_first_name} {item.traveler_last_name}
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.created_at), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground/60 font-mono truncate">
                      ID: {item.package_id}
                    </p>
                  </div>

                  {item.estimated_price != null && (
                    <span className="text-sm font-semibold whitespace-nowrap">
                      Q{item.estimated_price.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperationsSearchTab;
