import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailNotificationSettings } from "./EmailNotificationSettings";
import { WhatsAppNotificationSettings } from "./WhatsAppNotificationSettings";

interface ProfileNotificationsSectionProps {
  user: any;
  onUpdateUser: (userData: any) => void;
  onBack: () => void;
}

const ProfileNotificationsSection = ({ user, onUpdateUser, onBack }: ProfileNotificationsSectionProps) => {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al perfil
      </Button>

      <EmailNotificationSettings
        userId={user.id}
        emailNotifications={user.email_notifications ?? true}
        emailNotificationPreferences={user.email_notification_preferences || {}}
        onUpdate={(value) => onUpdateUser({ ...user, email_notifications: value })}
        onPreferencesUpdate={(preferences) => onUpdateUser({ ...user, email_notification_preferences: preferences })}
      />

      <WhatsAppNotificationSettings
        userId={user.id}
        whatsappNotifications={user.whatsapp_notifications ?? false}
        whatsappNotificationPreferences={user.whatsapp_notification_preferences || {}}
        onUpdate={(value) => onUpdateUser({ ...user, whatsapp_notifications: value })}
        onPreferencesUpdate={(preferences) => onUpdateUser({ ...user, whatsapp_notification_preferences: preferences })}
      />
    </div>
  );
};

export default ProfileNotificationsSection;
