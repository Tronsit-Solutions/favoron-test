import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AddReferralDialogProps {
  onSuccess: () => void;
}

interface ProfileOption {
  id: string;
  name: string;
  email: string;
}

function UserSearchField({
  label,
  selected,
  onSelect,
  onClear,
  excludeId,
}: {
  label: string;
  selected: ProfileOption | null;
  onSelect: (p: ProfileOption) => void;
  onClear: () => void;
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const pattern = `%${q}%`;
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(10);
    const mapped = (data || [])
      .filter(p => p.id !== excludeId)
      .map(p => ({
        id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Sin nombre",
        email: p.email || "",
      }));
    setResults(mapped);
    setLoading(false);
  }, [excludeId]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length >= 2) {
      timerRef.current = setTimeout(() => search(query), 300);
    } else {
      setResults([]);
    }
    return () => clearTimeout(timerRef.current);
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (selected) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.name}</p>
            <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
          </div>
          <button onClick={onClear} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label>{label}</Label>
      <Input
        placeholder="Buscar por nombre o email..."
        value={query}
        onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && query.length >= 2 && (
        <div className="rounded-md border border-border bg-popover shadow-md max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">No se encontraron usuarios</div>
          ) : (
            results.map(p => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent cursor-pointer"
                onClick={() => { onSelect(p); setQuery(""); setShowDropdown(false); }}
              >
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export const AddReferralDialog = ({ onSuccess }: AddReferralDialogProps) => {
  const [open, setOpen] = useState(false);
  const [referrer, setReferrer] = useState<ProfileOption | null>(null);
  const [referred, setReferred] = useState<ProfileOption | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!referrer || !referred) {
      toast({ title: "Error", description: "Selecciona ambos usuarios", variant: "destructive" });
      return;
    }
    if (referrer.id === referred.id) {
      toast({ title: "Error", description: "Los usuarios deben ser diferentes", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: rewardData } = await supabase
        .from("app_settings").select("value").eq("key", "referral_reward_amount").maybeSingle();
      const { data: discountData } = await supabase
        .from("app_settings").select("value").eq("key", "referred_user_discount").maybeSingle();

      const rewardAmount = (rewardData?.value as any)?.amount || 20;
      const discountAmount = (discountData?.value as any)?.amount || 20;

      const { error: insertError } = await supabase.from("referrals").insert({
        referrer_id: referrer.id,
        referred_id: referred.id,
        status: "pending",
        reward_amount: rewardAmount,
        referred_reward_amount: discountAmount,
      });

      if (insertError) throw insertError;

      toast({ title: "✅ Referido creado", description: `${referrer.name} → ${referred.name}` });
      setReferrer(null);
      setReferred(null);
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
          <UserSearchField
            label="Referidor"
            selected={referrer}
            onSelect={setReferrer}
            onClear={() => setReferrer(null)}
            excludeId={referred?.id}
          />
          <UserSearchField
            label="Referido"
            selected={referred}
            onSelect={setReferred}
            onClear={() => setReferred(null)}
            excludeId={referrer?.id}
          />
          <Button onClick={handleAdd} disabled={loading || !referrer || !referred} className="w-full">
            {loading ? "Creando..." : "Crear referido"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
