import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Package, Plane, CreditCard, CheckCircle, MessageSquare, Truck, Bell } from 'lucide-react';

interface EmailNotificationSettingsProps {
  userId: string;
  emailNotifications: boolean;
  emailNotificationPreferences: Record<string, boolean>;
  onUpdate: (value: boolean) => void;
  onPreferencesUpdate: (preferences: Record<string, boolean>) => void;
}

const notificationTypes = [
  { key: 'package', label: 'Paquetes', description: 'Nuevos paquetes, cotizaciones y actualizaciones de estado', icon: Package },
  { key: 'trip', label: 'Viajes', description: 'Nuevos viajes asignados y actualizaciones', icon: Plane },
  { key: 'payment', label: 'Pagos', description: 'Órdenes de pago y confirmaciones financieras', icon: CreditCard },
  { key: 'approval', label: 'Aprobaciones', description: 'Solicitudes que requieren aprobación', icon: CheckCircle },
  { key: 'quote', label: 'Cotizaciones', description: 'Nuevas cotizaciones recibidas', icon: MessageSquare },
  { key: 'delivery', label: 'Entregas', description: 'Confirmaciones de entrega y recogida', icon: Truck },
  { key: 'general', label: 'Generales', description: 'Notificaciones generales del sistema', icon: Bell }
];

export const EmailNotificationSettings = ({ 
  userId, 
  emailNotifications, 
  emailNotificationPreferences,
  onUpdate,
  onPreferencesUpdate
}: EmailNotificationSettingsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: enabled })
        .eq('id', userId);

      if (error) throw error;

      onUpdate(enabled);
      toast({
        title: enabled ? 'Notificaciones por email activadas' : 'Notificaciones por email desactivadas',
        description: enabled 
          ? 'Recibirás notificaciones importantes por correo electrónico'
          : 'Ya no recibirás notificaciones por correo electrónico'
      });
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar las preferencias de email',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferenceToggle = async (type: string, enabled: boolean) => {
    setIsUpdating(true);
    try {
      const newPreferences = {
        ...emailNotificationPreferences,
        [type]: enabled
      };

      const { error } = await supabase
        .from('profiles')
        .update({ email_notification_preferences: newPreferences })
        .eq('id', userId);

      if (error) throw error;

      onPreferencesUpdate(newPreferences);
      toast({
        title: 'Preferencias actualizadas',
        description: `Notificaciones de ${notificationTypes.find(nt => nt.key === type)?.label} ${enabled ? 'activadas' : 'desactivadas'}`
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar las preferencias',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Notificaciones por Email
        </CardTitle>
        <CardDescription>
          Configura cuándo quieres recibir notificaciones por correo electrónico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="email-notifications">
              Recibir notificaciones importantes por email
            </Label>
            <p className="text-sm text-muted-foreground">
              Activa o desactiva todas las notificaciones por correo electrónico
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>

        {emailNotifications && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Tipos de notificaciones</h4>
            <div className="space-y-4">
              {notificationTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <IconComponent className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div className="space-y-1">
                        <Label htmlFor={`notification-${type.key}`} className="text-sm font-medium">
                          {type.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`notification-${type.key}`}
                      checked={emailNotificationPreferences[type.key] || false}
                      onCheckedChange={(enabled) => handlePreferenceToggle(type.key, enabled)}
                      disabled={isUpdating}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};