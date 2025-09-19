import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { validateWhatsAppNumber } from "@/lib/validators";
import PersonalInfoForm from "./PersonalInfoForm";

interface EditProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (userData: any) => void;
}

const EditProfileModal = ({ user, isOpen, onClose, onUpdateUser }: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    firstName: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName || '',
    username: user.username || '',
    phoneNumber: user.phone_number || user.phone || '',
    idNumber: user.idNumber || '',
    avatarUrl: user.avatar_url || user.avatarUrl || '',
  });
  const { toast } = useToast();

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "El nombre y apellido son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number format if provided
    if (formData.phoneNumber?.trim()) {
      const validation = validateWhatsAppNumber(formData.phoneNumber);
      if (!validation.isValid) {
        toast({
          title: "Error",
          description: validation.error || "Formato de número de WhatsApp inválido",
          variant: "destructive",
        });
        return;
      }
    }

    const updatedUser = {
      ...user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: `${formData.firstName} ${formData.lastName}`,
      username: formData.username,
      phone: formData.phoneNumber?.trim() || null,
      idNumber: formData.idNumber,
      avatarUrl: formData.avatarUrl,
      // Database fields
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: formData.phoneNumber?.trim() || null,
      avatar_url: formData.avatarUrl
    };

    onUpdateUser(updatedUser);
    onClose();
    toast({
      title: "¡Perfil actualizado!",
      description: "Tus datos han sido guardados correctamente"
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      firstName: user.first_name || user.firstName || '',
      lastName: user.last_name || user.lastName || '',
      username: user.username || '',
      phoneNumber: user.phone_number || user.phone || '',
      idNumber: user.idNumber || '',
      avatarUrl: user.avatar_url || user.avatarUrl || '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <PersonalInfoForm 
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            showSaveButton={false}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;