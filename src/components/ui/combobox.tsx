import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  allowCustomValue?: boolean
  portalled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona una opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  className,
  disabled = false,
  allowCustomValue = false,
  portalled = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)
  
  // Check if the current search query matches any option
  const hasExactMatch = options.some(
    (option) => option.value.toLowerCase() === searchQuery.toLowerCase() ||
                option.label.toLowerCase() === searchQuery.toLowerCase()
  )
  
  const showCustomOption = allowCustomValue && searchQuery.length > 0 && !hasExactMatch

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal touch-manipulation",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-h-[60vh] p-0 z-[60] bg-popover overflow-hidden" align="start" portalled={portalled}>
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustomValue && searchQuery.length > 0 ? (
                <CommandItem
                  value={searchQuery}
                  onSelect={() => {
                    onValueChange(searchQuery)
                    setSearchQuery("")
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <span className="text-primary">+ Usar "{searchQuery}"</span>
                </CommandItem>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {showCustomOption && (
                <CommandItem
                  value={searchQuery}
                  onSelect={() => {
                    onValueChange(searchQuery)
                    setSearchQuery("")
                    setOpen(false)
                  }}
                  className="cursor-pointer border-b border-border mb-1"
                >
                  <span className="text-primary">+ Usar "{searchQuery}"</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setSearchQuery("")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}