
import { User, Mail, Phone, CreditCard, AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PersonalInfoDisplayProps {
  user: any;
}

const PersonalInfoDisplay = ({ user }: PersonalInfoDisplayProps) => {
  const infoItems = [
    {
      icon: User,
      label: "Nombre completo",
      value: user.name
    },
    {
      icon: Mail,
      label: "Correo electrónico",
      value: user.email
    },
    {
      icon: Phone,
      label: "WhatsApp",
      value: user.phone || 'No registrado'
    },
    {
      icon: CreditCard,
      label: "Identificación",
      value: user.idNumber || 'No registrado'
    }
  ];

  // Add username if it exists
  if (user.username) {
    infoItems.push({
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
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt="Foto de perfil" />
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
