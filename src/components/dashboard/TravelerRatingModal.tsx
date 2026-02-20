import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import StarRating from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

interface TravelerRatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: Package;
  onSuccess?: () => void;
}

const TravelerRatingModal = ({ open, onOpenChange, pkg, onSuccess }: TravelerRatingModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [productCondition, setProductCondition] = useState<string>("");
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculate: traveler confirmed before trip arrival?
  const confirmation = pkg.traveler_confirmation as any;
  const confirmedAt = confirmation?.confirmedAt || confirmation?.confirmed_at;
  const matchedDates = pkg.matched_trip_dates as any;
  const tripArrivalDate = matchedDates?.arrival_date;
  const travelerConfirmed = !!(confirmedAt && tripArrivalDate && new Date(confirmedAt) < new Date(tripArrivalDate));

  // Auto-calculate: delivered on time to office?
  const officeDelivery = pkg.office_delivery as any;
  const declaredAt = officeDelivery?.traveler_declaration?.declared_at;
  const tripDeliveryDate = matchedDates?.delivery_date;
  const deliveredOnTime = !!(declaredAt && tripDeliveryDate && new Date(declaredAt) <= new Date(tripDeliveryDate));

  const handleSubmit = async () => {
    if (rating === 0 || !productCondition) {
      toast({ title: "Campos requeridos", description: "Selecciona estrellas y condición del producto.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Get traveler_id from the matched trip
      const { data: tripData } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', pkg.matched_trip_id!)
        .single();

      if (!tripData) throw new Error("No se encontró el viaje");

      const { error } = await supabase.from('traveler_ratings').insert({
        package_id: pkg.id,
        traveler_id: tripData.user_id,
        shopper_id: user.id,
        trip_id: pkg.matched_trip_id!,
        rating,
        product_condition: productCondition,
        traveler_confirmed: travelerConfirmed,
        delivered_on_time: deliveredOnTime,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({ title: "¡Gracias!", description: "Tu calificación al viajero fue enviada." });
      queryClient.invalidateQueries({ queryKey: ['traveler-rating', pkg.id] });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error submitting rating:', err);
      toast({ title: "Error", description: err.message || "No se pudo enviar la calificación.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>⭐ Califica al viajero</DialogTitle>
          <DialogDescription>
            Tu opinión ayuda a mejorar la comunidad de Favorón.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Stars */}
          <div className="space-y-2">
            <Label>¿Cómo fue tu experiencia con el viajero?</Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Product condition */}
          <div className="space-y-2">
            <Label>¿En qué condición llegaron tus productos?</Label>
            <RadioGroup value={productCondition} onValueChange={setProductCondition} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bad" id="cond-bad" />
                <Label htmlFor="cond-bad" className="cursor-pointer">😞 Mal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="cond-fair" />
                <Label htmlFor="cond-fair" className="cursor-pointer">😐 Regular</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="cond-good" />
                <Label htmlFor="cond-good" className="cursor-pointer">😊 Bien</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Auto-calculated info */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 rounded-md p-3">
            <p>{travelerConfirmed ? "✅" : "❌"} El viajero confirmó recepción antes del viaje</p>
            <p>{deliveredOnTime ? "✅" : "❌"} Entregó en oficina a tiempo</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Comentario (opcional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Algo más que quieras compartir?"
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || rating === 0 || !productCondition}>
            {isSaving ? "Enviando..." : "Enviar calificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TravelerRatingModal;
