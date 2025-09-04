import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UserCheck, Phone, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import PersonalInfoForm from "./profile/PersonalInfoForm";
import { useToast } from "@/hooks/use-toast";
import { validateWhatsAppNumber } from "@/lib/validators";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
  description?: string;
}

const ProfileCompletionModal = ({ 
  isOpen, 
  onClose, 
  onComplete,
  title = "Completa tu perfil",
  description = "Necesitamos información adicional para continuar"
}: ProfileCompletionModalProps) => {
  const { profile, updateProfile } = useAuth();
  const { missingFields, completionPercentage, isComplete } = useProfileCompletion();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    countryCode: profile?.country_code || '+502',
    phoneNumber: profile?.phone_number ? profile.phone_number.replace(profile?.country_code || '+502', '').trim() : '',
    username: profile?.username || '',
    idNumber: profile?.document_number || '',
    avatarUrl: profile?.avatar_url || ''
  });
  
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      const newFormData = {
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        countryCode: profile.country_code || '+502',
        phoneNumber: profile.phone_number ? profile.phone_number.replace(profile?.country_code || '+502', '').trim() : '',
        username: profile.username || '',
        idNumber: profile.document_number || '',
        avatarUrl: profile.avatar_url || ''
      };
      setFormData(newFormData);
      
      // Validate phone number on load
      const fullPhone = `${newFormData.countryCode} ${newFormData.phoneNumber}`.trim();
      if (newFormData.phoneNumber) {
        const validation = validateWhatsAppNumber(fullPhone);
        setPhoneValidation(validation);
        console.log('📱 Initial phone validation:', { fullPhone, validation });
      }
    }
  }, [profile]);
  
  // Real-time phone validation
  useEffect(() => {
    const fullPhone = `${formData.countryCode} ${formData.phoneNumber}`.trim();
    if (formData.phoneNumber) {
      const validation = validateWhatsAppNumber(fullPhone);
      setPhoneValidation(validation);
      console.log('📱 Real-time phone validation:', { fullPhone, validation });
    } else {
      setPhoneValidation({ isValid: false, error: 'Número de WhatsApp requerido' });
    }
  }, [formData.countryCode, formData.phoneNumber]);

  // Auto-close modal when profile becomes complete
  useEffect(() => {
    if (isComplete && isOpen) {
      onComplete();
    }
  }, [isComplete, isOpen, onComplete]);

  const handleSave = async () => {
    if (isSubmitting) return;
    
    // Validate required fields
    if (!formData.firstName.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa tu nombre",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.lastName.trim()) {
      toast({
        title: "Campo requerido", 
        description: "Por favor ingresa tu apellido",
        variant: "destructive"
      });
      return;
    }
    
    // Validate WhatsApp number specifically
    const fullPhone = `${formData.countryCode} ${formData.phoneNumber}`.trim();
    const phoneValidationResult = validateWhatsAppNumber(fullPhone);
    if (!phoneValidationResult.isValid) {
      toast({
        title: "WhatsApp inválido",
        description: phoneValidationResult.error || "Por favor ingresa un número de WhatsApp válido",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const fullPhone = `${formData.countryCode} ${formData.phoneNumber}`.trim();
      await updateProfile({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        country_code: formData.countryCode.trim(),
        phone_number: fullPhone,
        username: formData.username.trim() || null,
        document_number: formData.idNumber.trim() || null,
        avatar_url: formData.avatarUrl || null
      });

      toast({
        title: "¡Perfil completado!",
        description: "Tu información ha sido guardada correctamente",
      });

      // Profile completion will be detected by useEffect above
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar tu perfil. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRequiredFieldsText = () => {
    if (missingFields.length === 0) return "Todos los campos están completos";
    if (missingFields.length === 1) return `Falta: ${missingFields[0]}`;
    if (missingFields.length === 2) return `Faltan: ${missingFields.join(' y ')}`;
    return `Faltan: ${missingFields.slice(0, -1).join(', ')} y ${missingFields[missingFields.length - 1]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso del perfil</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {getRequiredFieldsText()}
              </span>
            </div>
          </div>

          {/* Why is this needed */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">¿Por qué necesitamos tu teléfono?</p>
                <p className="text-sm text-blue-700">
                  Necesitamos tu WhatsApp para enviarte notificaciones de paquetes y avisarte cuando haya algún problema.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <PersonalInfoForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              showSaveButton={false}
            />
            
            {/* WhatsApp validation feedback */}
            {formData.phoneNumber && !phoneValidation.isValid && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-700">{phoneValidation.error}</span>
                </div>
              </div>
            )}
            
            {formData.phoneNumber && phoneValidation.isValid && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">WhatsApp válido ✓</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Completar Perfil
                </>
              )}
            </Button>
            
            <Button 
              onClick={onClose} 
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Puedes cerrar este modal, pero no podrás solicitar paquetes ni registrar viajes hasta completar tu perfil
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;