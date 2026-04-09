import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Star, Trash2, Plus, Pencil, X, Check } from "lucide-react";
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

const LABEL_OPTIONS = ["Casa", "Oficina", "Otro"];

const emptyForm = { label: "Casa", streetAddress: "", cityArea: "", hotelAirbnbName: "", contactNumber: "" };

const SavedAddressesSection = ({ userId, onBack }: SavedAddressesSectionProps) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
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

  const openNewForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      streetAddress: addr.streetAddress,
      cityArea: addr.cityArea,
      hotelAirbnbName: addr.hotelAirbnbName || "",
      contactNumber: addr.contactNumber,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const isFormValid = form.streetAddress.trim() && form.cityArea.trim() && form.contactNumber.trim();

  const handleSave = async () => {
    if (!isFormValid) return;
    setSaving(true);

    let updated: SavedAddress[];
    if (editingId) {
      updated = addresses.map(a =>
        a.id === editingId ? { ...a, ...form } : a
      );
    } else {
      const newAddr: SavedAddress = {
        id: crypto.randomUUID(),
        ...form,
        isDefault: addresses.length === 0,
      };
      updated = [...addresses, newAddr];
    }

    const ok = await updateAddresses(updated);
    setSaving(false);
    if (ok) {
      toast({ title: editingId ? "Dirección actualizada" : "Dirección agregada" });
      closeForm();
    }
  };

  const renderForm = () => (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{editingId ? "Editar dirección" : "Nueva dirección"}</span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={closeForm}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Label selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">Etiqueta</Label>
        <div className="flex gap-2">
          {LABEL_OPTIONS.map(opt => (
            <Button
              key={opt}
              type="button"
              variant={form.label === opt ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setForm(f => ({ ...f, label: opt }))}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Dirección completa *</Label>
        <Input
          placeholder="Ej: 12 calle 1-25 zona 10"
          value={form.streetAddress}
          onChange={e => setForm(f => ({ ...f, streetAddress: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Ciudad / Municipio *</Label>
        <Input
          placeholder="Ej: Guatemala, zona 10"
          value={form.cityArea}
          onChange={e => setForm(f => ({ ...f, cityArea: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Referencia / Condominio / Edificio</Label>
        <Input
          placeholder="Opcional"
          value={form.hotelAirbnbName}
          onChange={e => setForm(f => ({ ...f, hotelAirbnbName: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Número de contacto *</Label>
        <Input
          placeholder="Ej: 5555-1234"
          value={form.contactNumber}
          onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={closeForm}>Cancelar</Button>
        <Button size="sm" disabled={!isFormValid || saving} onClick={handleSave}>
          <Check className="h-3.5 w-3.5 mr-1" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al perfil
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Direcciones guardadas
            </CardTitle>
            {!showForm && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={openNewForm}>
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            )}
          </div>
          <CardDescription>
            Las direcciones que guardas aquí aparecerán al elegir entrega a domicilio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && renderForm()}

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : addresses.length === 0 && !showForm ? (
            <div className="text-center py-8 space-y-3">
              <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aún no tienes direcciones guardadas.
              </p>
              <Button size="sm" variant="default" className="gap-1.5" onClick={openNewForm}>
                <Plus className="h-4 w-4" />
                Agregar dirección
              </Button>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openEditForm(addr)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
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
