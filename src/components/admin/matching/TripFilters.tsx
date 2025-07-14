import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface TripFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  originFilter: string;
  onOriginChange: (value: string) => void;
  origins: string[];
}

export const TripFilters = ({
  searchTerm,
  onSearchChange,
  originFilter,
  onOriginChange,
  origins
}: TripFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ciudad o viajero..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={originFilter} onValueChange={onOriginChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por origen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los orígenes</SelectItem>
          {origins.map(origin => (
            <SelectItem key={origin} value={origin}>{origin}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};