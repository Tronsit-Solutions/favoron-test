import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { parsePhoneNumber, combinePhoneNumber } from "@/lib/phoneUtils";
import PersonalInfoForm from "./PersonalInfoForm";

interface EditProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (userData: any) => void;
}

const EditProfileModal = ({ user, isOpen, onClose, onUpdateUser }: EditProfileModalProps) => {
  const parsedPhone = parsePhoneNumber(user.phone_number || user.phone || '');
  
  const [formData, setFormData] = useState({
    firstName: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName || '',
    username: user.username || '',
    countryCode: parsedPhone.countryCode,
    phoneNumber: parsedPhone.phoneNumber,
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

    if (!formData.phoneNumber && formData.countryCode) {
      toast({
        title: "Error", 
        description: "El número de teléfono es obligatorio",
        variant: "destructive"
      });
      return;
    }

    const fullPhoneNumber = combinePhoneNumber(formData.countryCode, formData.phoneNumber);

    const updatedUser = {
      ...user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      name: `${formData.firstName} ${formData.lastName}`,
      username: formData.username,
      phone: fullPhoneNumber,
      idNumber: formData.idNumber,
      avatarUrl: formData.avatarUrl,
      // Database fields
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: fullPhoneNumber,
      country_code: formData.countryCode,
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
    const parsedPhone = parsePhoneNumber(user.phone_number || user.phone || '');
    
    setFormData({
      firstName: user.first_name || user.firstName || '',
      lastName: user.last_name || user.lastName || '',
      username: user.username || '',
      countryCode: parsedPhone.countryCode,
      phoneNumber: parsedPhone.phoneNumber,
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