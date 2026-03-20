
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AtSign, Phone, CreditCard, Save, Globe } from "lucide-react";
import AvatarUpload from "./AvatarUpload";
import { PHONE_CONFIG } from "@/lib/constants";
import { useState } from "react";

interface PersonalInfoFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  showSaveButton?: boolean;
}

const PersonalInfoForm = ({ formData, setFormData, onSave, showSaveButton = true }: PersonalInfoFormProps) => {
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  
  const handleAvatarChange = (url: string | null) => {
    setFormData((prev: any) => ({ ...prev, avatarUrl: url }));
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <AvatarUpload
          currentAvatarUrl={formData.avatarUrl}
          userName={formData.firstName || formData.lastName || 'Usuario'}
          onAvatarChange={handleAvatarChange}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, firstName: e.target.value }))}
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, lastName: e.target.value }))}
            placeholder="Tu apellido"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, username: e.target.value }))}
            placeholder="usuario123"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">WhatsApp</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative flex gap-1">
            <Input
              type="text"
              value={formData.countryCode || '+502'}
              onChange={(e) => 
                setFormData((prev: any) => ({ ...prev, countryCode: e.target.value }))
              }
              placeholder="+502"
              className="pr-8"
            />
            <Popover open={countryCodeOpen} onOpenChange={setCountryCodeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                  type="button"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Buscar país..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el país</CommandEmpty>
                    <CommandGroup>
                      {PHONE_CONFIG.SUPPORTED_COUNTRIES.map((country) => (
                        <CommandItem
                          key={country.code}
                          value={`${country.name} ${country.code}`}
                          onSelect={() => {
                            setFormData((prev: any) => ({ ...prev, countryCode: country.code }));
                            setCountryCodeOpen(false);
                          }}
                        >
                          <span className="mr-2">{country.flag}</span>
                          <span className="font-medium">{country.code}</span>
                          <span className="ml-2 text-muted-foreground">{country.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="col-span-2 relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={(e) => 
                setFormData((prev: any) => ({ ...prev, phoneNumber: e.target.value }))
              }
              placeholder="12345678"
              className="pl-10"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Tu número de WhatsApp para notificaciones
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber">Documento de identidad *</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="idNumber"
            value={formData.idNumber}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, idNumber: e.target.value }))}
            placeholder="Número de identificación"
            className="pl-10"
          />
        </div>
      </div>

      {showSaveButton && (
        <Button onClick={onSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      )}
    </>
  );
};

export default PersonalInfoForm;
