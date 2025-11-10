import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Package, Plane, CreditCard, Info } from "lucide-react";

interface WhatsAppNotificationSettingsProps {
  userId: string;
  whatsappNotifications: boolean;
  whatsappNotificationPreferences: {
    package?: boolean;
    trip?: boolean;
    payment?: boolean;
    general?: boolean;
  };
  onUpdate: (enabled: boolean) => void;
  onPreferencesUpdate: (preferences: any) => void;
}

const notificationTypes = [
  { key: 'package', label: 'Paquetes', description: 'Actualizaciones sobre tus paquetes', icon: Package },
  { key: 'trip', label: 'Viajes', description: 'Actualizaciones sobre tus viajes', icon: Plane },
  { key: 'payment', label: 'Pagos', description: 'Confirmaciones de pago y transacciones', icon: CreditCard },
  { key: 'general', label: 'General', description: 'Notificaciones generales de la plataforma', icon: Info },
];

export const WhatsAppNotificationSettings = ({
  userId,
  whatsappNotifications,
  whatsappNotificationPreferences,
  onUpdate,
  onPreferencesUpdate,
}: WhatsAppNotificationSettingsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_notifications: checked })
        .eq('id', userId);

      if (error) throw error;

      onUpdate(checked);
      toast({
        title: checked ? "WhatsApp activado" : "WhatsApp desactivado",
        description: checked 
          ? "Recibirás notificaciones por WhatsApp según tus preferencias" 
          : "No recibirás notificaciones por WhatsApp",
      });
    } catch (error) {
      console.error('Error updating WhatsApp settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la configuración",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferenceToggle = async (key: string, checked: boolean) => {
    setIsUpdating(true);
    try {
      const newPreferences = {
        ...whatsappNotificationPreferences,
        [key]: checked,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_notification_preferences: newPreferences })
        .eq('id', userId);

      if (error) throw error;

      onPreferencesUpdate(newPreferences);
      toast({
        title: "Preferencia actualizada",
        description: `Notificaciones de ${notificationTypes.find(t => t.key === key)?.label} ${checked ? 'activadas' : 'desactivadas'}`,
      });
    } catch (error) {
      console.error('Error updating WhatsApp preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la preferencia",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Notificaciones WhatsApp</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Recibe actualizaciones importantes por WhatsApp
            </p>
          </div>
          <Switch
            checked={whatsappNotifications}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>

        {whatsappNotifications && (
          <div className="space-y-4 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">
              Selecciona qué notificaciones deseas recibir:
            </p>
            {notificationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.key} className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{type.label}</Label>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={whatsappNotificationPreferences[type.key as keyof typeof whatsappNotificationPreferences] ?? true}
                    onCheckedChange={(checked) => handlePreferenceToggle(type.key, checked)}
                    disabled={isUpdating}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
