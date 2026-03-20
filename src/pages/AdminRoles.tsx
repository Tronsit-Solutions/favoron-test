import { useState, useEffect } from "react";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Shield, Plus, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PERMISSION_KEYS, PermissionKey } from "@/hooks/useUserPermissions";

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
}

interface AssignedUser {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const AdminRoles = () => {
  const { user, profile, userRole } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Role form
  const [showForm, setShowForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Assign user
  const [showAssign, setShowAssign] = useState(false);
  const [assignRoleId, setAssignRoleId] = useState<string | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    const { data: rolesData, error } = await supabase
      .from('custom_roles')
      .select('id, name, description, role_permissions(permission_key), user_custom_roles(id)')
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      setLoading(false);
      return;
    }

    const mapped = (rolesData || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.role_permissions?.map((rp: any) => rp.permission_key) || [],
      userCount: r.user_custom_roles?.length || 0,
    }));
    setRoles(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (selectedPermissions.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos un permiso", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let roleId = editingRoleId;

      if (editingRoleId) {
        const { error } = await supabase
          .from('custom_roles')
          .update({ name: roleName, description: roleDescription || null, updated_at: new Date().toISOString() })
          .eq('id', editingRoleId);
        if (error) throw error;

        // Delete old permissions and re-insert
        await supabase.from('role_permissions').delete().eq('role_id', editingRoleId);
      } else {
        const { data, error } = await supabase
          .from('custom_roles')
          .insert({ name: roleName, description: roleDescription || null })
          .select('id')
          .single();
        if (error) throw error;
        roleId = data.id;
      }

      // Insert permissions
      const permsToInsert = selectedPermissions.map(key => ({
        role_id: roleId!,
        permission_key: key,
      }));
      const { error: permError } = await supabase.from('role_permissions').insert(permsToInsert);
      if (permError) throw permError;

      toast({ title: "✅ Rol guardado", description: `Rol "${roleName}" ${editingRoleId ? 'actualizado' : 'creado'}` });
      resetForm();
      fetchRoles();
    } catch (err: any) {
      console.error('Error saving role:', err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`¿Eliminar el rol "${roleName}"? Se desasignarán todos los usuarios.`)) return;
    const { error } = await supabase.from('custom_roles').delete().eq('id', roleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol eliminado" });
      fetchRoles();
    }
  };

  const handleEditRole = (role: CustomRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRoleId(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
  };

  // Assign user flow
  const openAssignDialog = async (roleId: string) => {
    setAssignRoleId(roleId);
    setShowAssign(true);
    setUserSearch("");
    setSearchResults([]);

    const { data: assignments } = await supabase
      .from('user_custom_roles')
      .select('id, user_id')
      .eq('custom_role_id', roleId);

    if (assignments && assignments.length > 0) {
      const userIds = assignments.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setAssignedUsers(assignments.map(a => {
        const p = profileMap.get(a.user_id);
        return {
          id: a.id,
          user_id: a.user_id,
          first_name: p?.first_name || null,
          last_name: p?.last_name || null,
          email: p?.email || null,
        };
      }));
    } else {
      setAssignedUsers([]);
    }
  };

  const searchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const assignUser = async (userId: string) => {
    if (!assignRoleId || !user) return;
    const alreadyAssigned = assignedUsers.some(u => u.user_id === userId);
    if (alreadyAssigned) {
      toast({ title: "Ya asignado", description: "Este usuario ya tiene este rol", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('user_custom_roles').insert({
      user_id: userId,
      custom_role_id: assignRoleId,
      assigned_by: user.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Usuario asignado" });
      openAssignDialog(assignRoleId);
      fetchRoles();
    }
  };

  const removeUser = async (assignmentId: string) => {
    const { error } = await supabase.from('user_custom_roles').delete().eq('id', assignmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuario removido" });
      if (assignRoleId) openAssignDialog(assignRoleId);
      fetchRoles();
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

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          user={userData}
          onShowProfile={() => navigate('/dashboard')}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
        />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/control')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Roles y Permisos
              </h1>
              <p className="text-muted-foreground text-sm">Crear roles personalizados y asignar permisos</p>
            </div>
          </div>

          {/* Create / Edit Form */}
          {showForm ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingRoleId ? "Editar Rol" : "Nuevo Rol"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Nombre</Label>
                    <Input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="Ej: Marketing" />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Input value={roleDescription} onChange={e => setRoleDescription(e.target.value)} placeholder="Descripción opcional" />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Permisos</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(PERMISSION_KEYS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={selectedPermissions.includes(key)}
                          onCheckedChange={() => togglePermission(key)}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveRole} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar Rol"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button className="mb-6" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Crear Rol
            </Button>
          )}

          {/* Roles List */}
          <Card>
            <CardHeader>
              <CardTitle>Roles Personalizados</CardTitle>
              <CardDescription>Roles creados para acceso parcial al panel</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Cargando...</p>
              ) : roles.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay roles creados aún.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Usuarios</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{role.name}</span>
                            {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map(p => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {PERMISSION_KEYS[p as PermissionKey] || p}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openAssignDialog(role.id)}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            {role.userCount}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id, role.name)}>
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

          {/* Assign User Dialog */}
          <Dialog open={showAssign} onOpenChange={setShowAssign}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Asignar Usuarios al Rol</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Buscar usuario</Label>
                  <Input
                    value={userSearch}
                    onChange={e => searchUsers(e.target.value)}
                    placeholder="Nombre o email..."
                  />
                  {searching && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
                  {searchResults.length > 0 && (
                    <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                      {searchResults.map(u => (
                        <button
                          key={u.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                          onClick={() => assignUser(u.id)}
                        >
                          <span>{u.first_name} {u.last_name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Usuarios asignados</Label>
                  {assignedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">Ningún usuario asignado</p>
                  ) : (
                    <div className="space-y-1 mt-2">
                      {assignedUsers.map(au => (
                        <div key={au.id} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="text-sm">{au.first_name} {au.last_name} <span className="text-muted-foreground">({au.email})</span></span>
                          <Button variant="ghost" size="icon" onClick={() => removeUser(au.id)}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminRoles;
