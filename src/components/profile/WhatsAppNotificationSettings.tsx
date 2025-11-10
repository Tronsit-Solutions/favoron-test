import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Package, Plane, CreditCard, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppNotificationSettingsProps {
  userId: string;
  whatsappNotifications: boolean;
  whatsappNotificationPreferences: Record<string, boolean>;
  onUpdate: (enabled: boolean) => void;
  onPreferencesUpdate: (preferences: Record<string, boolean>) => void;
}

const notificationTypes = [
  { key: "package", label: "Paquetes", description: "Actualizaciones de paquetes", icon: Package },
  { key: "trip", label: "Viajes", description: "Actualizaciones de viajes", icon: Plane },
  { key: "payment", label: "Pagos", description: "Notificaciones de pagos", icon: CreditCard },
  { key: "general", label: "General", description: "Notificaciones generales", icon: Bell },
];

export function WhatsAppNotificationSettings({
  userId,
  whatsappNotifications,
  whatsappNotificationPreferences,
  onUpdate,
  onPreferencesUpdate,
}: WhatsAppNotificationSettingsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp_notifications: enabled })
        .eq("id", userId);

      if (error) throw error;

      onUpdate(enabled);
      toast({
        title: enabled ? "WhatsApp habilitado" : "WhatsApp deshabilitado",
        description: enabled
          ? "Recibirás notificaciones por WhatsApp"
          : "Ya no recibirás notificaciones por WhatsApp",
      });
    } catch (error) {
      console.error("Error updating WhatsApp notifications:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferenceToggle = async (key: string, enabled: boolean) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const newPreferences = {
        ...whatsappNotificationPreferences,
        [key]: enabled,
      };

      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp_notification_preferences: newPreferences })
        .eq("id", userId);

      if (error) throw error;

      onPreferencesUpdate(newPreferences);
      toast({
        title: "Preferencia actualizada",
        description: `Notificaciones de ${
          notificationTypes.find((t) => t.key === key)?.label
        } ${enabled ? "habilitadas" : "deshabilitadas"}`,
      });
    } catch (error) {
      console.error("Error updating WhatsApp preferences:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar las preferencias de WhatsApp",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <Label htmlFor="whatsapp-notifications" className="text-base font-semibold">
              Notificaciones de WhatsApp
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Recibe actualizaciones importantes por WhatsApp
          </p>
        </div>
        <Switch
          id="whatsapp-notifications"
          checked={whatsappNotifications}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
        />
      </div>

      {whatsappNotifications && (
        <div className="space-y-4 pt-4 border-t">
          <p className="text-sm font-medium">Tipos de notificaciones</p>
          {notificationTypes.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor={`whatsapp-${key}`} className="text-sm font-medium">
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                id={`whatsapp-${key}`}
                checked={whatsappNotificationPreferences[key] ?? true}
                onCheckedChange={(enabled) => handlePreferenceToggle(key, enabled)}
                disabled={isUpdating}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
