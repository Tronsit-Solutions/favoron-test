import { RequireAdmin } from "@/components/auth/RequireAdmin";
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
import { Ticket, Plus, Pencil, Trash2, TrendingUp, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

const AdminDiscounts = () => {
  const { user, profile, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [usage, setUsage] = useState<DiscountCodeUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '0',
    max_discount_amount: '',
    max_uses: '',
    single_use_per_user: false,
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDiscountCodes();
    fetchUsageStats();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes((data || []) as DiscountCode[]);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los códigos de descuento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_code_usage')
        .select('*')
        .order('used_at', { ascending: false });

      if (error) throw error;
      setUsage(data || []);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const userData = {
    id: user?.id,
    name: `${profile?.first_name} ${profile?.last_name}`.trim(),
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    email: user?.email,
    role: userRole?.role || 'user',
    trust_level: profile?.trust_level,
    avatar_url: profile?.avatar_url,
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '0',
      max_discount_amount: '',
      max_uses: '',
      single_use_per_user: false,
      expires_at: '',
      is_active: true,
    });
    setEditingCode(null);
  };

  const handleOpenDialog = (code?: DiscountCode) => {
    if (code) {
      setEditingCode(code);
      setFormData({
        code: code.code,
        description: code.description || '',
        discount_type: code.discount_type,
        discount_value: code.discount_value.toString(),
        min_order_amount: code.min_order_amount.toString(),
        max_discount_amount: code.max_discount_amount?.toString() || '',
        max_uses: code.max_uses?.toString() || '',
        single_use_per_user: code.single_use_per_user,
        expires_at: code.expires_at ? format(new Date(code.expires_at), "yyyy-MM-dd'T'HH:mm") : '',
        is_active: code.is_active,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        single_use_per_user: formData.single_use_per_user,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_active: formData.is_active,
      };

      if (editingCode) {
        const { error } = await supabase
          .from('discount_codes')
          .update(dataToSubmit)
          .eq('id', editingCode.id);

        if (error) throw error;
        toast({
          title: "Código actualizado",
          description: "El código de descuento se actualizó correctamente",
        });
      } else {
        const { error } = await supabase
          .from('discount_codes')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast({
          title: "Código creado",
          description: "El código de descuento se creó correctamente",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchDiscountCodes();
    } catch (error: any) {
      console.error('Error saving discount code:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el código de descuento",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (code: DiscountCode) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: !code.is_active })
        .eq('id', code.id);

      if (error) throw error;

      toast({
        title: code.is_active ? "Código desactivado" : "Código activado",
        description: `El código ${code.code} se ${code.is_active ? 'desactivó' : 'activó'} correctamente`,
      });

      fetchDiscountCodes();
    } catch (error) {
      console.error('Error toggling discount code:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del código",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (codeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este código? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Código eliminado",
        description: "El código de descuento se eliminó correctamente",
      });

      fetchDiscountCodes();
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el código",
        variant: "destructive",
      });
    }
  };

  const getCodeUsageCount = (codeId: string) => {
    return usage.filter(u => u.discount_code_id === codeId).length;
  };

  const getTotalDiscountAmount = (codeId: string) => {
    return usage
      .filter(u => u.discount_code_id === codeId)
      .reduce((sum, u) => sum + Number(u.discount_amount), 0);
  };

  const activeCodes = codes.filter(c => c.is_active);
  const inactiveCodes = codes.filter(c => !c.is_active);

  const totalUsage = usage.length;
  const totalDiscounted = usage.reduce((sum, u) => sum + Number(u.discount_amount), 0);
  const uniqueUsers = new Set(usage.map(u => u.user_id)).size;

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={userData}
          onShowProfile={() => navigate('/dashboard')}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Ticket className="h-8 w-8 text-primary" />
                Códigos de Descuento
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona códigos promocionales y descuentos
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Código
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCode ? 'Editar Código' : 'Crear Código de Descuento'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCode ? 'Actualiza la información del código' : 'Crea un nuevo código promocional'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="VERANO2024"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount_type">Tipo de Descuento *</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                          <SelectItem value="fixed">Monto Fijo (Q)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descripción del código..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_value">
                        Valor de Descuento * {formData.discount_type === 'percentage' ? '(%)' : '(Q)'}
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="min_order_amount">Monto Mínimo (Q)</Label>
                      <Input
                        id="min_order_amount"
                        type="number"
                        step="0.01"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_discount_amount">Descuento Máximo (Q)</Label>
                      <Input
                        id="max_discount_amount"
                        type="number"
                        step="0.01"
                        value={formData.max_discount_amount}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                        placeholder="Sin límite"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_uses">Máximo de Usos</Label>
                      <Input
                        id="max_uses"
                        type="number"
                        value={formData.max_uses}
                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                        placeholder="Ilimitado"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Fecha de Expiración</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="single_use_per_user"
                      checked={formData.single_use_per_user}
                      onCheckedChange={(checked) => setFormData({ ...formData, single_use_per_user: checked })}
                    />
                    <Label htmlFor="single_use_per_user">Un uso por usuario</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Código activo</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCode ? 'Actualizar' : 'Crear'} Código
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsage}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Descontado</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Q{totalDiscounted.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Únicos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Codes Table */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Activos ({activeCodes.length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactivos ({inactiveCodes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Códigos Activos</CardTitle>
                  <CardDescription>Códigos de descuento actualmente disponibles</CardDescription>
                </CardHeader>
                <CardContent>
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
                      {activeCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-bold">{code.code}</TableCell>
                          <TableCell>
                            {code.discount_type === 'percentage' 
                              ? `${code.discount_value}%` 
                              : `Q${code.discount_value}`}
                          </TableCell>
                          <TableCell>
                            {getCodeUsageCount(code.id)}
                            {code.max_uses && ` / ${code.max_uses}`}
                          </TableCell>
                          <TableCell>Q{getTotalDiscountAmount(code.id).toFixed(2)}</TableCell>
                          <TableCell>
                            {code.expires_at 
                              ? format(new Date(code.expires_at), 'dd/MM/yyyy')
                              : 'Sin expiración'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Activo</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(code)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(code)}
                              >
                                Desactivar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(code.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeCodes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No hay códigos activos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inactive">
              <Card>
                <CardHeader>
                  <CardTitle>Códigos Inactivos</CardTitle>
                  <CardDescription>Códigos desactivados o expirados</CardDescription>
                </CardHeader>
                <CardContent>
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
                      {inactiveCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono font-bold">{code.code}</TableCell>
                          <TableCell>
                            {code.discount_type === 'percentage' 
                              ? `${code.discount_value}%` 
                              : `Q${code.discount_value}`}
                          </TableCell>
                          <TableCell>
                            {getCodeUsageCount(code.id)}
                            {code.max_uses && ` / ${code.max_uses}`}
                          </TableCell>
                          <TableCell>Q{getTotalDiscountAmount(code.id).toFixed(2)}</TableCell>
                          <TableCell>
                            {code.expires_at 
                              ? format(new Date(code.expires_at), 'dd/MM/yyyy')
                              : 'Sin expiración'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Inactivo</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(code)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(code)}
                              >
                                Activar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(code.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {inactiveCodes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No hay códigos inactivos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminDiscounts;
