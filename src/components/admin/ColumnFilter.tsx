import React, { useState, useMemo } from "react";
import { Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColumnFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  showSearch?: boolean;
}

const ColumnFilter = ({
  title,
  options,
  selectedValues,
  onSelectionChange,
  showSearch = false,
}: ColumnFilterProps) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const isActive = selectedValues.length > 0;

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(lower));
  }, [options, search]);

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const selectAll = () => onSelectionChange([...options]);
  const clearAll = () => onSelectionChange([]);

  return (
    <div className="flex items-center gap-1">
      <span>{title}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center justify-center rounded p-0.5 hover:bg-accent",
              isActive && "text-primary"
            )}
          >
            <Filter className={cn("h-3.5 w-3.5", isActive ? "fill-primary/30" : "")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          {showSearch && (
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 mb-2 text-xs"
            />
          )}
          <div className="flex gap-1 mb-2">
            <Button variant="ghost" size="sm" className="h-6 text-xs flex-1" onClick={selectAll}>
              Todos
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs flex-1" onClick={clearAll}>
              Limpiar
            </Button>
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-1">
              {filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent cursor-pointer text-xs"
                >
                  <Checkbox
                    checked={selectedValues.includes(option)}
                    onCheckedChange={() => toggleValue(option)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate">{option}</span>
                </label>
              ))}
              {filteredOptions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Sin resultados</p>
              )}
            </div>
          </ScrollArea>
          {isActive && (
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {selectedValues.length} seleccionado(s)
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColumnFilter;
