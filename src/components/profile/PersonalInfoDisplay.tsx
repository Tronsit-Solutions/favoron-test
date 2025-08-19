
import { User, Mail, Phone, CreditCard, AtSign, Hash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PersonalInfoDisplayProps {
  user: any;
}

const PersonalInfoDisplay = ({ user }: PersonalInfoDisplayProps) => {
  // Get the user's full name from various possible fields
  const getFullName = () => {
    if (user.name) return user.name;
    
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || 'Sin nombre registrado';
  };

  const infoItems = [
    {
      icon: User,
      label: "Nombre completo",
      value: getFullName()
    },
    {
      icon: Mail,
      label: "Correo electrónico",
      value: user.email
    },
    {
      icon: Phone,
      label: "WhatsApp",
      value: user.phone || user.phone_number || 'No registrado'
    },
    {
      icon: CreditCard,
      label: "Identificación",
      value: user.idNumber || 'No registrado'
    },
    {
      icon: Hash,
      label: "User ID",
      value: user.id || user.profileId || 'No disponible'
    }
  ];

  // Add username if it exists
  if (user.username) {
    infoItems.splice(4, 0, {
      icon: AtSign,
      label: "Nombre de usuario",
      value: `@${user.username}`
    });
  }

  return (
    <div className="space-y-6">
      {/* Avatar Display */}
      <div className="flex justify-center">
        <Avatar className="h-20 w-20">
          {user.avatarUrl || user.avatar_url ? (
            <AvatarImage src={user.avatarUrl || user.avatar_url} alt="Foto de perfil" />
          ) : (
            <AvatarFallback className="text-xl">
              <User className="h-8 w-8" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {infoItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <item.icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-sm text-muted-foreground">{item.value}</p>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default PersonalInfoDisplay;
