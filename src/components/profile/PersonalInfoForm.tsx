
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, Phone, CreditCard, Save } from "lucide-react";
import AvatarUpload from "./AvatarUpload";

interface PersonalInfoFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSave: () => void;
  showSaveButton?: boolean;
}

const PersonalInfoForm = ({ formData, setFormData, onSave, showSaveButton = true }: PersonalInfoFormProps) => {
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
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
            placeholder="+502 1234 5678"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber">DPI/Pasaporte</Label>
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
