import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TravelerSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onCompleted?: () => void;
}

const TravelerSurveyModal = ({ isOpen, onClose, tripId, onCompleted }: TravelerSurveyModalProps) => {
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<string>("");
  const [processDifficulty, setProcessDifficulty] = useState("");
  const [wouldRegisterAgain, setWouldRegisterAgain] = useState("");
  const [tipSatisfaction, setTipSatisfaction] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const isValid = rating > 0 && wouldRecommend !== "" && processDifficulty && wouldRegisterAgain && tipSatisfaction;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("traveler_surveys" as any).insert({
        traveler_id: user.id,
        trip_id: tripId,
        rating,
        would_recommend: wouldRecommend === "yes",
        process_difficulty: processDifficulty,
        would_register_again: wouldRegisterAgain,
        tip_satisfaction: tipSatisfaction,
        review_text: reviewText || null,
        consent_to_publish: consentToPublish,
      });
      if (error) throw error;

      // Mark feedback as completed
      await supabase.from("trips").update({ traveler_feedback_completed: true } as any).eq("id", tripId);

      toast({ title: "¡Gracias por tu feedback!", description: "Tu opinión nos ayuda a mejorar." });
      onCompleted?.();
      onClose();
    } catch (err: any) {
      console.error("Error submitting survey:", err);
      toast({ title: "Error", description: "No se pudo enviar la encuesta.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await supabase.from("trips").update({ traveler_feedback_completed: true } as any).eq("id", tripId);
      onCompleted?.();
      onClose();
    } catch (err) {
      console.error("Error skipping survey:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>¿Cómo fue tu experiencia?</DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar Favorón para todos los viajeros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 1. Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Cómo calificarías a Favorón?</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* 2. Would recommend */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Recomendarías Favorón a otro viajero?</Label>
            <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="rec-yes" />
                <Label htmlFor="rec-yes">Sí</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="rec-no" />
                <Label htmlFor="rec-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 3. Process difficulty */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Qué tan fácil fue el proceso de llevar y entregar el pedido?</Label>
            <RadioGroup value={processDifficulty} onValueChange={setProcessDifficulty}>
              {[
                { value: "very_easy", label: "Muy fácil" },
                { value: "easy", label: "Fácil" },
                { value: "normal", label: "Normal" },
                { value: "difficult", label: "Difícil" },
                { value: "very_difficult", label: "Muy difícil" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`diff-${opt.value}`} />
                  <Label htmlFor={`diff-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 4. Would register again */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Registrarías otro viaje en Favorón?</Label>
            <RadioGroup value={wouldRegisterAgain} onValueChange={setWouldRegisterAgain}>
              {[
                { value: "yes_sure", label: "Sí, seguro" },
                { value: "probably_yes", label: "Probablemente sí" },
                { value: "not_sure", label: "No estoy seguro" },
                { value: "probably_no", label: "Probablemente no" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`reg-${opt.value}`} />
                  <Label htmlFor={`reg-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 5. Tip satisfaction */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Qué tan satisfecho/a quedaste con la propina recibida?</Label>
            <RadioGroup value={tipSatisfaction} onValueChange={setTipSatisfaction}>
              {[
                { value: "very_satisfied", label: "Muy satisfecho" },
                { value: "satisfied", label: "Satisfecho" },
                { value: "neutral", label: "Neutral" },
                { value: "unsatisfied", label: "Poco satisfecho" },
                { value: "very_unsatisfied", label: "Nada satisfecho" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`tip-${opt.value}`} />
                  <Label htmlFor={`tip-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 6. Review text */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Te gustaría dejar una reseña sobre tu experiencia?</Label>
            <Textarea
              placeholder="Cuéntanos sobre tu experiencia... (opcional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
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
            <Label htmlFor="consent" className="text-xs text-muted-foreground leading-tight">
              Acepto que mi reseña se publique de forma anónima en la plataforma.
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Omitir
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelerSurveyModal;
