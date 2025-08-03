import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';

interface EmailNotificationSettingsProps {
  userId: string;
  emailNotifications: boolean;
  onUpdate: (value: boolean) => void;
}

export const EmailNotificationSettings = ({ 
  userId, 
  emailNotifications, 
  onUpdate 
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
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="email-notifications">
              Recibir notificaciones importantes por email
            </Label>
            <p className="text-sm text-muted-foreground">
              Notificaciones de alta prioridad como pagos, entregas y actualizaciones importantes
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
};