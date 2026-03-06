import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddReferralDialogProps {
  onSuccess: () => void;
}

export const AddReferralDialog = ({ onSuccess }: AddReferralDialogProps) => {
  const [open, setOpen] = useState(false);
  const [referrerEmail, setReferrerEmail] = useState("");
  const [referredEmail, setReferredEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!referrerEmail || !referredEmail) {
      toast({ title: "Error", description: "Ambos emails son requeridos", variant: "destructive" });
      return;
    }
    if (referrerEmail === referredEmail) {
      toast({ title: "Error", description: "Los emails deben ser diferentes", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Look up both profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("email", [referrerEmail.trim().toLowerCase(), referredEmail.trim().toLowerCase()]);

      if (error) throw error;

      const referrer = profiles?.find(p => p.email?.toLowerCase() === referrerEmail.trim().toLowerCase());
      const referred = profiles?.find(p => p.email?.toLowerCase() === referredEmail.trim().toLowerCase());

      if (!referrer) {
        toast({ title: "Error", description: `No se encontró usuario con email: ${referrerEmail}`, variant: "destructive" });
        return;
      }
      if (!referred) {
        toast({ title: "Error", description: `No se encontró usuario con email: ${referredEmail}`, variant: "destructive" });
        return;
      }

      // Get reward settings
      const { data: rewardData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "referral_reward_amount")
        .maybeSingle();
      const { data: discountData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "referred_user_discount")
        .maybeSingle();

      const rewardAmount = (rewardData?.value as any)?.amount || 20;
      const discountAmount = (discountData?.value as any)?.amount || 20;

      const { error: insertError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrer.id,
          referred_id: referred.id,
          status: "pending",
          reward_amount: rewardAmount,
          referred_reward_amount: discountAmount,
        });

      if (insertError) throw insertError;

      toast({ title: "✅ Referido creado", description: `${referrer.first_name} → ${referred.first_name}` });
      setReferrerEmail("");
      setReferredEmail("");
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Agregar referido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar referido manualmente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Email del referidor</Label>
            <Input
              placeholder="referidor@email.com"
              value={referrerEmail}
              onChange={e => setReferrerEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email del referido</Label>
            <Input
              placeholder="referido@email.com"
              value={referredEmail}
              onChange={e => setReferredEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={loading} className="w-full">
            {loading ? "Creando..." : "Crear referido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
