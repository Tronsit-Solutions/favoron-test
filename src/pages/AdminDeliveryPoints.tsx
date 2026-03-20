import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useAuth } from "@/hooks/useAuth";
import { useDeliveryPoints, DeliveryPointInsert, DeliveryPointUpdate } from "@/hooks/useDeliveryPoints";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { Combobox } from "@/components/ui/combobox";

const AdminDeliveryPoints = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { deliveryPoints, loading, createDeliveryPoint, updateDeliveryPoint, deleteDeliveryPoint } = useDeliveryPoints();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<string | null>(null);
  const [formData, setFormData] = useState<DeliveryPointInsert>({
    name: '',
    city: '',
    country: '',
    address_line_1: '',
    address_line_2: '',
    postal_code: '',
    state_province: '',
    phone_number: '',
    email: '',
    schedule: '',
    instructions: '',
    is_active: true,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const userData = {
    id: user?.id || "",
    email: user?.email || "",
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    avatar_url: profile?.avatar_url || "",
    trust_level: profile?.trust_level || "basic",
  };

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      country: '',
      address_line_1: '',
      address_line_2: '',
      postal_code: '',
      state_province: '',
      phone_number: '',
      email: '',
      schedule: '',
      instructions: '',
      is_active: true,
    });
    setEditingPoint(null);
  };

  const handleEdit = (point: any) => {
    setFormData({
      name: point.name,
      city: point.city,
      country: point.country,
      address_line_1: point.address_line_1 || '',
      address_line_2: point.address_line_2 || '',
      postal_code: point.postal_code || '',
      state_province: point.state_province || '',
      phone_number: point.phone_number || '',
      email: point.email || '',
      schedule: point.schedule || '',
      instructions: point.instructions || '',
      is_active: point.is_active,
    });
    setEditingPoint(point.id);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.city || !formData.country) {
      return;
    }

    try {
      if (editingPoint) {
        await updateDeliveryPoint(editingPoint, formData as DeliveryPointUpdate);
      } else {
        await createDeliveryPoint(formData);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving delivery point:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este punto de entrega?')) {
      await deleteDeliveryPoint(id);
    }
  };

  const getCountryLabel = (value: string) => {
    const country = COUNTRIES.find(c => c.value === value);
    return country?.label || value;
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          user={userData}
          onShowProfile={() => navigate("/dashboard/profile")}
          onLogout={handleLogout}
          onGoHome={() => navigate("/")}
        />

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/control")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Puntos de Entrega Internacionales</h1>
              <p className="text-muted-foreground">Gestiona los puntos de entrega en diferentes ciudades</p>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Puntos de Entrega</CardTitle>
                <CardDescription>
                  Los viajeros podrán seleccionar estos puntos cuando su destino coincida
                </CardDescription>
              </div>
              <Dialog open={isFormOpen} onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Punto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPoint ? 'Editar Punto de Entrega' : 'Nuevo Punto de Entrega'}
                    </DialogTitle>
                    <DialogDescription>
                      Configura la información del punto de entrega internacional
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del punto *</Label>
                      <Input
                        id="name"
                        placeholder="Ej: Punto de Entrega Madrid"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">País *</Label>
                        <Combobox
                          options={COUNTRIES}
                          value={formData.country}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                          placeholder="Seleccionar país"
                          searchPlaceholder="Buscar país..."
                          emptyMessage="No encontrado"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad *</Label>
                        <Input
                          id="city"
                          placeholder="Ej: Madrid"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line_1">Dirección línea 1</Label>
                      <Input
                        id="address_line_1"
                        placeholder="Calle, número"
                        value={formData.address_line_1 || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line_2">Dirección línea 2</Label>
                      <Input
                        id="address_line_2"
                        placeholder="Piso, puerta, etc."
                        value={formData.address_line_2 || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state_province">Estado/Provincia</Label>
                        <Input
                          id="state_province"
                          placeholder="Ej: Comunidad de Madrid"
                          value={formData.state_province || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Código Postal</Label>
                        <Input
                          id="postal_code"
                          placeholder="Ej: 28001"
                          value={formData.postal_code || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Teléfono</Label>
                        <Input
                          id="phone_number"
                          placeholder="+34 612 345 678"
                          value={formData.phone_number || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contacto@ejemplo.com"
                          value={formData.email || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schedule">Horario de atención</Label>
                      <Input
                        id="schedule"
                        placeholder="Ej: Lunes a Viernes: 9:00-18:00"
                        value={formData.schedule || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instrucciones de entrega</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Instrucciones especiales para los viajeros..."
                        value={formData.instructions || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Punto activo</Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsFormOpen(false);
                        resetForm();
                      }} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1">
                        {editingPoint ? 'Guardar Cambios' : 'Crear Punto'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : deliveryPoints.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay puntos de entrega configurados</p>
                  <p className="text-sm">Agrega un punto de entrega para empezar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryPoints.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell>
                          <div className="font-medium">{point.name}</div>
                          {point.schedule && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {point.schedule}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div>{point.city}, {getCountryLabel(point.country)}</div>
                              {point.address_line_1 && (
                                <div className="text-xs text-muted-foreground">{point.address_line_1}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {point.phone_number && (
                              <div className="text-xs flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {point.phone_number}
                              </div>
                            )}
                            {point.email && (
                              <div className="text-xs flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {point.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={point.is_active ? "default" : "secondary"}>
                            {point.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(point)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(point.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </RequireAdmin>
  );
};

export default AdminDeliveryPoints;
