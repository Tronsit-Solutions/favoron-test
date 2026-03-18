import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedAddress {
  id: string;
  label: string;
  streetAddress: string;
  cityArea: string;
  hotelAirbnbName: string;
  contactNumber: string;
  isDefault: boolean;
}

interface SavedAddressesSectionProps {
  userId: string;
  onBack: () => void;
}

const SavedAddressesSection = ({ userId, onBack }: SavedAddressesSectionProps) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('saved_addresses')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setAddresses((data.saved_addresses as unknown as SavedAddress[]) || []);
    }
    setLoading(false);
  };

  const updateAddresses = async (updated: SavedAddress[]) => {
    const { error } = await supabase
      .from('profiles')
      .update({ saved_addresses: updated as unknown as any })
      .eq('id', userId);

    if (error) {
      toast({ title: "Error al actualizar", variant: "destructive" });
      return false;
    }
    setAddresses(updated);
    return true;
  };

  const handleDelete = async (id: string) => {
    const updated = addresses.filter(a => a.id !== id);
    // If we removed the default, make first one default
    if (updated.length > 0 && !updated.some(a => a.isDefault)) {
      updated[0].isDefault = true;
    }
    await updateAddresses(updated);
    toast({ title: "Dirección eliminada" });
  };

  const handleSetDefault = async (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    if (await updateAddresses(updated)) {
      toast({ title: "Dirección predeterminada actualizada" });
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al perfil
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Direcciones guardadas
          </CardTitle>
          <CardDescription>
            Las direcciones que guardas aquí aparecerán al elegir entrega a domicilio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aún no tienes direcciones guardadas.
              </p>
              <p className="text-xs text-muted-foreground">
                Al aceptar una cotización con entrega a domicilio, podrás guardar la dirección.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-lg border p-3 space-y-1 ${
                    addr.isDefault ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!addr.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Predeterminar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(addr.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.streetAddress}</p>
                  {addr.hotelAirbnbName && (
                    <p className="text-xs text-muted-foreground">{addr.hotelAirbnbName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{addr.cityArea} · {addr.contactNumber}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedAddressesSection;
