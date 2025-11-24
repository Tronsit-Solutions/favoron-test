import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Instagram, Music2, Video, Users, Search } from "lucide-react";
import { useAcquisitionSurvey, AcquisitionSource } from "@/hooks/useAcquisitionSurvey";
import { cn } from "@/lib/utils";

interface AcquisitionSurveyModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const AcquisitionSurveyModal = ({ isOpen, onComplete }: AcquisitionSurveyModalProps) => {
  const { submitSurvey } = useAcquisitionSurvey();
  const [selectedSource, setSelectedSource] = useState<AcquisitionSource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const surveyOptions = [
    {
      value: 'instagram_facebook_ads' as AcquisitionSource,
      label: 'Instagram/Facebook Ads',
      icon: Instagram,
      color: 'from-pink-500 to-purple-500'
    },
    {
      value: 'tiktok' as AcquisitionSource,
      label: 'TikTok',
      icon: Music2,
      color: 'from-black to-cyan-500'
    },
    {
      value: 'reels' as AcquisitionSource,
      label: 'Reels',
      icon: Video,
      color: 'from-orange-500 to-pink-500'
    },
    {
      value: 'friend_referral' as AcquisitionSource,
      label: 'Recomendación de un amigo',
      icon: Users,
      color: 'from-blue-500 to-green-500'
    },
    {
      value: 'other' as AcquisitionSource,
      label: 'Otro',
      icon: Search,
      color: 'from-gray-500 to-slate-600'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedSource) return;

    setIsSubmitting(true);
    const result = await submitSurvey(selectedSource);
    setIsSubmitting(false);

    if (result.success) {
      onComplete();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[400px] [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">¿Cómo conociste Favorón? 🎉</DialogTitle>
          <DialogDescription className="text-sm">
            No queremos seguir tirando pisto en mala publicidad. Cuéntanos, ¿cómo nos encontraste?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3">
          {surveyOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedSource === option.value;

            return (
              <Card
                key={option.value}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:shadow-md",
                  isSelected && "ring-2 ring-primary shadow-lg"
                )}
                onClick={() => setSelectedSource(option.value)}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                    option.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{option.label}</p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "border-gray-300"
                  )}>
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!selectedSource || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Enviando..." : "Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcquisitionSurveyModal;
