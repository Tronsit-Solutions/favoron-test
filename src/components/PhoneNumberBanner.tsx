import { Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface PhoneNumberBannerProps {
  onOpenProfileModal: () => void;
}

export const PhoneNumberBanner = ({ onOpenProfileModal }: PhoneNumberBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 mb-4">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Recomendamos que agregues tu número de teléfono en tu perfil.</strong> Para avisos importantes de tus paquetes y viajes. Prometemos no spam.
            </p>
          </div>
          <Button
            onClick={onOpenProfileModal}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50"
          >
            Completar Número de Teléfono
          </Button>
        </div>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
          className="ml-2 h-8 w-8 p-0 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};