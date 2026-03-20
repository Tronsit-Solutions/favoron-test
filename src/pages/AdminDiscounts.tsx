import { RequirePermission } from "@/components/auth/RequirePermission";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Ticket, Rocket, Plus, Pencil, Trash2, TrendingUp, Users, DollarSign, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ─── Types ───────────────────────────────────────────
interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses: number | null;
  single_use_per_user: boolean;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DiscountCodeUsage {
  id: string;
  discount_code_id: string;
  package_id: string;
  user_id: string;
  discount_amount: number;
  used_at: string;
}

interface BoostCode {
  id: string;
  code: string;
  description: string | null;
  boost_type: 'percentage' | 'fixed';
  boost_value: number;
  max_boost_amount: number | null;
  max_uses: number | null;
  single_use_per_user: boolean;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BoostCodeUsage {
  id: string;
  boost_code_id: string;
  trip_id: string;
  traveler_id: string;
  boost_amount: number;
  used_at: string;
}

// ─── Component ───────────────────────────────────────
const AdminDiscounts = () => {
  const { user, profile, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Discount state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [discountUsage, setDiscountUsage] = useState<DiscountCodeUsage[]>([]);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [discountForm, setDiscountForm] = useState({
    code: '', description: '', discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '', min_order_amount: '0', max_discount_amount: '', max_uses: '',
    single_use_per_user: false, expires_at: '', is_active: true,
  });

  // Boost state
  const [boostCodes, setBoostCodes] = useState<BoostCode[]>([]);
  const [boostUsage, setBoostUsage] = useState<BoostCodeUsage[]>([]);
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [editingBoost, setEditingBoost] = useState<BoostCode | null>(null);
  const [boostForm, setBoostForm] = useState({
    code: '', description: '', boost_type: 'fixed' as 'percentage' | 'fixed',
    boost_value: '', max_boost_amount: '', max_uses: '',
    single_use_per_user: false, expires_at: '', is_active: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDiscountCodes(), fetchDiscountUsage(), fetchBoostCodes(), fetchBoostUsage()])
      .finally(() => setLoading(false));
  }, []);

  // ─── Discount CRUD ──────────────────────────────────
  const fetchDiscountCodes = async () => {
    const { data, error } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setDiscountCodes((data || []) as DiscountCode[]);
  };
  const fetchDiscountUsage = async () => {
    const { data } = await supabase.from('discount_code_usage').select('*').order('used_at', { ascending: false });
    setDiscountUsage(data || []);
  };

  const resetDiscountForm = () => {
    setDiscountForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', max_discount_amount: '', max_uses: '', single_use_per_user: false, expires_at: '', is_active: true });
    setEditingDiscount(null);
  };

  const openDiscountDialog = (code?: DiscountCode) => {
    if (code) {
      setEditingDiscount(code);
      setDiscountForm({
        code: code.code, description: code.description || '', discount_type: code.discount_type,
        discount_value: code.discount_value.toString(), min_order_amount: code.min_order_amount.toString(),
        max_discount_amount: code.max_discount_amount?.toString() || '', max_uses: code.max_uses?.toString() || '',
        single_use_per_user: code.single_use_per_user,
        expires_at: code.expires_at ? format(new Date(code.expires_at), "yyyy-MM-dd'T'HH:mm") : '',
        is_active: code.is_active,
      });
    } else { resetDiscountForm(); }
    setDiscountDialogOpen(true);
  };

  const submitDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const d = {
        code: discountForm.code.toUpperCase(), description: discountForm.description || null,
        discount_type: discountForm.discount_type, discount_value: parseFloat(discountForm.discount_value),
        min_order_amount: parseFloat(discountForm.min_order_amount),
        max_discount_amount: discountForm.max_discount_amount ? parseFloat(discountForm.max_discount_amount) : null,
        max_uses: discountForm.max_uses ? parseInt(discountForm.max_uses) : null,
        single_use_per_user: discountForm.single_use_per_user,
        expires_at: discountForm.expires_at ? new Date(discountForm.expires_at).toISOString() : null,
        is_active: discountForm.is_active,
      };
      if (editingDiscount) {
        const { error } = await supabase.from('discount_codes').update(d).eq('id', editingDiscount.id);
        if (error) throw error;
        toast({ title: "Código actualizado" });
      } else {
        const { error } = await supabase.from('discount_codes').insert([d]);
        if (error) throw error;
        toast({ title: "Código creado" });
      }
      setDiscountDialogOpen(false); resetDiscountForm(); fetchDiscountCodes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleDiscount = async (code: DiscountCode) => {
    const { error } = await supabase.from('discount_codes').update({ is_active: !code.is_active }).eq('id', code.id);
    if (error) { toast({ title: "Error", variant: "destructive" }); return; }
    toast({ title: code.is_active ? "Desactivado" : "Activado" }); fetchDiscountCodes();
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('¿Eliminar este código?')) return;
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) { toast({ title: "Error", variant: "destructive" }); return; }
    toast({ title: "Eliminado" }); fetchDiscountCodes();
  };

  // ─── Boost CRUD ─────────────────────────────────────
  const fetchBoostCodes = async () => {
    const { data, error } = await supabase.from('boost_codes').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    setBoostCodes((data || []) as BoostCode[]);
  };
  const fetchBoostUsage = async () => {
    const { data } = await supabase.from('boost_code_usage').select('*').order('used_at', { ascending: false });
    setBoostUsage(data || []);
  };

  const resetBoostForm = () => {
    setBoostForm({ code: '', description: '', boost_type: 'fixed', boost_value: '', max_boost_amount: '', max_uses: '', single_use_per_user: false, expires_at: '', is_active: true });
    setEditingBoost(null);
  };

  const openBoostDialog = (code?: BoostCode) => {
    if (code) {
      setEditingBoost(code);
      setBoostForm({
        code: code.code, description: code.description || '', boost_type: code.boost_type,
        boost_value: code.boost_value.toString(), max_boost_amount: code.max_boost_amount?.toString() || '',
        max_uses: code.max_uses?.toString() || '', single_use_per_user: code.single_use_per_user,
        expires_at: code.expires_at ? format(new Date(code.expires_at), "yyyy-MM-dd'T'HH:mm") : '',
        is_active: code.is_active,
      });
    } else { resetBoostForm(); }
    setBoostDialogOpen(true);
  };

  const submitBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const d = {
        code: boostForm.code.toUpperCase(), description: boostForm.description || null,
        boost_type: boostForm.boost_type, boost_value: parseFloat(boostForm.boost_value),
        max_boost_amount: boostForm.max_boost_amount ? parseFloat(boostForm.max_boost_amount) : null,
        max_uses: boostForm.max_uses ? parseInt(boostForm.max_uses) : null,
        single_use_per_user: boostForm.single_use_per_user,
        expires_at: boostForm.expires_at ? new Date(boostForm.expires_at).toISOString() : null,
        is_active: boostForm.is_active,
      };
      if (editingBoost) {
        const { error } = await supabase.from('boost_codes').update(d).eq('id', editingBoost.id);
        if (error) throw error;
        toast({ title: "Boost actualizado" });
      } else {
        const { error } = await supabase.from('boost_codes').insert([d]);
        if (error) throw error;
        toast({ title: "Boost creado" });
      }
      setBoostDialogOpen(false); resetBoostForm(); fetchBoostCodes();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleBoost = async (code: BoostCode) => {
    const { error } = await supabase.from('boost_codes').update({ is_active: !code.is_active }).eq('id', code.id);
    if (error) { toast({ title: "Error", variant: "destructive" }); return; }
    toast({ title: code.is_active ? "Desactivado" : "Activado" }); fetchBoostCodes();
  };

  const deleteBoost = async (id: string) => {
    if (!confirm('¿Eliminar este código?')) return;
    const { error } = await supabase.from('boost_codes').delete().eq('id', id);
    if (error) { toast({ title: "Error", variant: "destructive" }); return; }
    toast({ title: "Eliminado" }); fetchBoostCodes();
  };

  // ─── Computed ───────────────────────────────────────
  const discountActive = discountCodes.filter(c => c.is_active);
  const discountInactive = discountCodes.filter(c => !c.is_active);
  const discountTotalUsage = discountUsage.length;
  const discountTotalAmount = discountUsage.reduce((s, u) => s + Number(u.discount_amount), 0);
  const discountUniqueUsers = new Set(discountUsage.map(u => u.user_id)).size;
  const getDiscountUsageCount = (id: string) => discountUsage.filter(u => u.discount_code_id === id).length;
  const getDiscountTotal = (id: string) => discountUsage.filter(u => u.discount_code_id === id).reduce((s, u) => s + Number(u.discount_amount), 0);

  const boostActive = boostCodes.filter(c => c.is_active);
  const boostInactive = boostCodes.filter(c => !c.is_active);
  const boostTotalUsage = boostUsage.length;
  const boostTotalAmount = boostUsage.reduce((s, u) => s + Number(u.boost_amount), 0);
  const boostUniqueTravelers = new Set(boostUsage.map(u => u.traveler_id)).size;
  const getBoostUsageCount = (id: string) => boostUsage.filter(u => u.boost_code_id === id).length;
  const getBoostTotal = (id: string) => boostUsage.filter(u => u.boost_code_id === id).reduce((s, u) => s + Number(u.boost_amount), 0);

  // ─── Header ─────────────────────────────────────────
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };
  const userData = {
    id: user?.id, name: `${profile?.first_name} ${profile?.last_name}`.trim(),
    firstName: profile?.first_name, lastName: profile?.last_name, email: user?.email,
    role: userRole?.role || 'user', trust_level: profile?.trust_level, avatar_url: profile?.avatar_url,
  };

  // ─── Render helpers ─────────────────────────────────
  const renderDiscountTable = (codes: DiscountCode[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Usos</TableHead>
          <TableHead>Total Desc.</TableHead>
          <TableHead>Expira</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.id}>
            <TableCell className="font-mono font-bold">{code.code}</TableCell>
            <TableCell>{code.discount_type === 'percentage' ? `${code.discount_value}%` : `Q${code.discount_value}`}</TableCell>
            <TableCell>{getDiscountUsageCount(code.id)}{code.max_uses && ` / ${code.max_uses}`}</TableCell>
            <TableCell>Q{getDiscountTotal(code.id).toFixed(2)}</TableCell>
            <TableCell>{code.expires_at ? format(new Date(code.expires_at), 'dd/MM/yyyy') : 'Sin expiración'}</TableCell>
            <TableCell><Badge variant={code.is_active ? "default" : "secondary"}>{code.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openDiscountDialog(code)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleDiscount(code)}>{code.is_active ? '⏸' : '▶'}</Button>
                <Button variant="ghost" size="icon" onClick={() => deleteDiscount(code.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {codes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay códigos</TableCell></TableRow>}
      </TableBody>
    </Table>
  );

  const renderBoostTable = (codes: BoostCode[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Boost</TableHead>
          <TableHead>Tope</TableHead>
          <TableHead>Usos</TableHead>
          <TableHead>Total Boost</TableHead>
          <TableHead>Expira</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.id}>
            <TableCell className="font-mono font-bold">{code.code}</TableCell>
            <TableCell>{code.boost_type === 'percentage' ? `${code.boost_value}%` : `Q${code.boost_value}`}</TableCell>
            <TableCell>{code.max_boost_amount ? `Q${code.max_boost_amount}` : '-'}</TableCell>
            <TableCell>{getBoostUsageCount(code.id)}{code.max_uses && ` / ${code.max_uses}`}</TableCell>
            <TableCell>Q{getBoostTotal(code.id).toFixed(2)}</TableCell>
            <TableCell>{code.expires_at ? format(new Date(code.expires_at), 'dd/MM/yyyy') : 'Sin expiración'}</TableCell>
            <TableCell><Badge variant={code.is_active ? "default" : "secondary"}>{code.is_active ? 'Activo' : 'Inactivo'}</Badge></TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openBoostDialog(code)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleBoost(code)}>{code.is_active ? '⏸' : '▶'}</Button>
                <Button variant="ghost" size="icon" onClick={() => deleteBoost(code.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {codes.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No hay códigos</TableCell></TableRow>}
      </TableBody>
    </Table>
  );

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <DashboardHeader user={userData} onShowProfile={() => navigate('/dashboard')} onLogout={handleLogout} onGoHome={() => navigate('/')} />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Tag className="h-8 w-8 text-primary" />
              Códigos Promocionales
            </h1>
            <p className="text-muted-foreground mt-2">Descuentos para shoppers y tip boosts para viajeros</p>
          </div>

          {/* ─── Top-level Tabs ─── */}
          <Tabs defaultValue="discounts" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="discounts" className="gap-2"><Ticket className="h-4 w-4" /> Descuentos</TabsTrigger>
              <TabsTrigger value="boost" className="gap-2"><Rocket className="h-4 w-4" /> Tip Boost</TabsTrigger>
            </TabsList>

            {/* ════════ DISCOUNTS TAB ════════ */}
            <TabsContent value="discounts">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">Códigos de descuento para shoppers</p>
                <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openDiscountDialog()}><Plus className="h-4 w-4 mr-2" />Nuevo Descuento</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingDiscount ? 'Editar Código' : 'Crear Código de Descuento'}</DialogTitle>
                      <DialogDescription>{editingDiscount ? 'Actualiza la información' : 'Crea un nuevo código promocional'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitDiscount} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Código *</Label>
                          <Input value={discountForm.code} onChange={e => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })} placeholder="VERANO2024" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo *</Label>
                          <Select value={discountForm.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setDiscountForm({ ...discountForm, discount_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                              <SelectItem value="fixed">Monto Fijo (Q)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea value={discountForm.description} onChange={e => setDiscountForm({ ...discountForm, description: e.target.value })} placeholder="Descripción..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor * {discountForm.discount_type === 'percentage' ? '(%)' : '(Q)'}</Label>
                          <Input type="number" step="0.01" value={discountForm.discount_value} onChange={e => setDiscountForm({ ...discountForm, discount_value: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Monto Mínimo (Q)</Label>
                          <Input type="number" step="0.01" value={discountForm.min_order_amount} onChange={e => setDiscountForm({ ...discountForm, min_order_amount: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Descuento Máximo (Q)</Label>
                          <Input type="number" step="0.01" value={discountForm.max_discount_amount} onChange={e => setDiscountForm({ ...discountForm, max_discount_amount: e.target.value })} placeholder="Sin límite" />
                        </div>
                        <div className="space-y-2">
                          <Label>Máximo de Usos</Label>
                          <Input type="number" value={discountForm.max_uses} onChange={e => setDiscountForm({ ...discountForm, max_uses: e.target.value })} placeholder="Ilimitado" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Expiración</Label>
                        <Input type="datetime-local" value={discountForm.expires_at} onChange={e => setDiscountForm({ ...discountForm, expires_at: e.target.value })} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={discountForm.single_use_per_user} onCheckedChange={c => setDiscountForm({ ...discountForm, single_use_per_user: c })} />
                        <Label>Un uso por usuario</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={discountForm.is_active} onCheckedChange={c => setDiscountForm({ ...discountForm, is_active: c })} />
                        <Label>Código activo</Label>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setDiscountDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingDiscount ? 'Actualizar' : 'Crear'}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Usos</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{discountTotalUsage}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Descontado</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Q{discountTotalAmount.toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{discountUniqueUsers}</div></CardContent></Card>
              </div>

              <Tabs defaultValue="active" className="w-full">
                <TabsList>
                  <TabsTrigger value="active">Activos ({discountActive.length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactivos ({discountInactive.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active"><Card><CardHeader><CardTitle>Códigos Activos</CardTitle><CardDescription>Códigos de descuento actualmente disponibles</CardDescription></CardHeader><CardContent>{renderDiscountTable(discountActive)}</CardContent></Card></TabsContent>
                <TabsContent value="inactive"><Card><CardHeader><CardTitle>Códigos Inactivos</CardTitle><CardDescription>Códigos desactivados o expirados</CardDescription></CardHeader><CardContent>{renderDiscountTable(discountInactive)}</CardContent></Card></TabsContent>
              </Tabs>
            </TabsContent>

            {/* ════════ BOOST TAB ════════ */}
            <TabsContent value="boost">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-muted-foreground">Códigos que aumentan el pago del viajero (Favorón absorbe el costo)</p>
                <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openBoostDialog()}><Plus className="h-4 w-4 mr-2" />Nuevo Boost</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingBoost ? 'Editar Boost Code' : 'Crear Boost Code'}</DialogTitle>
                      <DialogDescription>{editingBoost ? 'Actualiza la información' : 'Crea un nuevo código de tip boost para viajeros'}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitBoost} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Código *</Label>
                          <Input value={boostForm.code} onChange={e => setBoostForm({ ...boostForm, code: e.target.value.toUpperCase() })} placeholder="BOOST10" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo *</Label>
                          <Select value={boostForm.boost_type} onValueChange={(v: 'percentage' | 'fixed') => setBoostForm({ ...boostForm, boost_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                              <SelectItem value="fixed">Monto Fijo (Q)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea value={boostForm.description} onChange={e => setBoostForm({ ...boostForm, description: e.target.value })} placeholder="Ej: Boost del 5% para viajeros frecuentes" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Valor * {boostForm.boost_type === 'percentage' ? '(%)' : '(Q)'}</Label>
                          <Input type="number" step="0.01" value={boostForm.boost_value} onChange={e => setBoostForm({ ...boostForm, boost_value: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tope Máximo (Q)</Label>
                          <Input type="number" step="0.01" value={boostForm.max_boost_amount} onChange={e => setBoostForm({ ...boostForm, max_boost_amount: e.target.value })} placeholder="Sin límite" />
                          <p className="text-xs text-muted-foreground">{boostForm.boost_type === 'percentage' ? 'Limita el monto máximo del boost porcentual' : 'Opcional para boost fijo'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Máximo de Usos</Label>
                          <Input type="number" value={boostForm.max_uses} onChange={e => setBoostForm({ ...boostForm, max_uses: e.target.value })} placeholder="Ilimitado" />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiración</Label>
                          <Input type="datetime-local" value={boostForm.expires_at} onChange={e => setBoostForm({ ...boostForm, expires_at: e.target.value })} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={boostForm.single_use_per_user} onCheckedChange={c => setBoostForm({ ...boostForm, single_use_per_user: c })} />
                        <Label>Un uso por viajero</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={boostForm.is_active} onCheckedChange={c => setBoostForm({ ...boostForm, is_active: c })} />
                        <Label>Código activo</Label>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setBoostDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit">{editingBoost ? 'Actualizar' : 'Crear'}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Usos</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{boostTotalUsage}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Boost Distribuido</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Q{boostTotalAmount.toFixed(2)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Viajeros Beneficiados</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{boostUniqueTravelers}</div></CardContent></Card>
              </div>

              <Tabs defaultValue="active" className="w-full">
                <TabsList>
                  <TabsTrigger value="active">Activos ({boostActive.length})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactivos ({boostInactive.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="active"><Card><CardHeader><CardTitle>Códigos Activos</CardTitle><CardDescription>Códigos de tip boost actualmente disponibles</CardDescription></CardHeader><CardContent>{renderBoostTable(boostActive)}</CardContent></Card></TabsContent>
                <TabsContent value="inactive"><Card><CardHeader><CardTitle>Códigos Inactivos</CardTitle><CardDescription>Códigos desactivados o expirados</CardDescription></CardHeader><CardContent>{renderBoostTable(boostInactive)}</CardContent></Card></TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminDiscounts;
