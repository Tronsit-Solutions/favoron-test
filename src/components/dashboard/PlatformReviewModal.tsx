import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import StarRating from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface PlatformReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
}

const PlatformReviewModal = ({ open, onOpenChange, packageId }: PlatformReviewModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [wouldUseAgain, setWouldUseAgain] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [processWasClear, setProcessWasClear] = useState<boolean | null>(null);
  const [communicationQuality, setCommunicationQuality] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isValid = rating > 0 && wouldUseAgain && wouldRecommend !== null && processWasClear !== null && communicationQuality;

  const handleSubmit = async () => {
    if (!isValid) {
      toast({ title: "Campos requeridos", description: "Completa todas las preguntas.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from('platform_reviews').insert({
        package_id: packageId,
        shopper_id: user.id,
        rating,
        would_use_again: wouldUseAgain,
        would_recommend: wouldRecommend!,
        process_was_clear: processWasClear!,
        communication_quality: communicationQuality,
        review_text: reviewText.trim() || null,
        consent_to_publish: consentToPublish,
      });

      if (error) throw error;

      toast({ title: "¡Gracias!", description: "Tu opinión sobre Favorón fue enviada." });
      queryClient.invalidateQueries({ queryKey: ['platform-review', packageId] });
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      toast({ title: "Error", description: err.message || "No se pudo enviar la reseña.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💬 Califica tu experiencia con Favorón</DialogTitle>
          <DialogDescription>
            Tu feedback nos ayuda a mejorar el servicio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Stars */}
          <div className="space-y-2">
            <Label>¿Cómo calificarías a Favorón?</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Would use again */}
          <div className="space-y-2">
            <Label>¿Volverías a usar Favorón?</Label>
            <RadioGroup value={wouldUseAgain} onValueChange={setWouldUseAgain} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="use-yes" />
                <Label htmlFor="use-yes" className="cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maybe" id="use-maybe" />
                <Label htmlFor="use-maybe" className="cursor-pointer">Tal vez</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="use-no" />
                <Label htmlFor="use-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Would recommend */}
          <div className="space-y-2">
            <Label>¿Recomendarías Favorón a un amigo?</Label>
            <RadioGroup value={wouldRecommend === null ? "" : wouldRecommend ? "yes" : "no"} onValueChange={(v) => setWouldRecommend(v === "yes")} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="rec-yes" />
                <Label htmlFor="rec-yes" className="cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="rec-no" />
                <Label htmlFor="rec-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Process clear */}
          <div className="space-y-2">
            <Label>¿El proceso fue claro?</Label>
            <RadioGroup value={processWasClear === null ? "" : processWasClear ? "yes" : "no"} onValueChange={(v) => setProcessWasClear(v === "yes")} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="clear-yes" />
                <Label htmlFor="clear-yes" className="cursor-pointer">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="clear-no" />
                <Label htmlFor="clear-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Communication quality */}
          <div className="space-y-2">
            <Label>¿Cómo fue la comunicación?</Label>
            <RadioGroup value={communicationQuality} onValueChange={setCommunicationQuality} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="comm-good" />
                <Label htmlFor="comm-good" className="cursor-pointer">Buena</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="comm-fair" />
                <Label htmlFor="comm-fair" className="cursor-pointer">Regular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bad" id="comm-bad" />
                <Label htmlFor="comm-bad" className="cursor-pointer">Mala</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <Label>Reseña (opcional)</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Cuéntanos más sobre tu experiencia..."
              maxLength={1000}
              rows={3}
            />
          </div>

          {/* Consent */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent"
              checked={consentToPublish}
              onCheckedChange={(checked) => setConsentToPublish(checked === true)}
            />
            <Label htmlFor="consent" className="text-xs text-muted-foreground cursor-pointer leading-tight">
              Permito que Favorón publique mi reseña de forma anónima en su sitio web.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !isValid}>
            {isSaving ? "Enviando..." : "Enviar reseña"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformReviewModal;
