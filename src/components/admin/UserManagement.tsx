import { useState } from "react";
import { User, Package, Trip } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserStatusBadge from "./UserStatusBadge";
import UserDetailModal from "./UserDetailModal";
import AdminTravelersTab from "./AdminTravelersTab";
import { ImageViewerModal } from "@/components/ui/image-viewer-modal";
import { useUserManagement } from "@/hooks/useUserManagement";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Users, Eye, Filter, User as UserIcon, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UserManagementProps {
  packages: Package[];
  trips: Trip[];
}

const UserManagement = ({ packages, trips }: UserManagementProps) => {
  const {
    users,
    totalCount,
    loading,
    loadingMore,
    searching,
    isServerSearch,
    hasMore,
    loadMore,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    updateUser,
    updateTrustLevel,
    updateUserStatus,
    banUser,
    unbanUser,
    updateUserRole,
    refreshUsers
  } = useUserManagement();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [selectedAvatarName, setSelectedAvatarName] = useState<string>("");
  const { toast } = useToast();

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      user: 'Usuario',
      admin: 'Admin'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      user: { variant: 'default' as const },
      admin: { variant: 'destructive' as const }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || { variant: 'outline' as const };
    return <Badge variant={config.variant}>{getRoleLabel(role)}</Badge>;
  };

  const getTrustLevelBadge = (trustLevel: string) => {
    const trustLevelLabels = {
      basic: 'Básico',
      confiable: 'Confiable', 
      prime: 'Prime'
    };
    
    const trustLevelConfig = {
      basic: { variant: 'secondary' as const },
      confiable: { variant: 'default' as const },
      prime: { variant: 'prime' as const }
    };
    
    const label = trustLevelLabels[trustLevel as keyof typeof trustLevelLabels] || trustLevel;
    const config = trustLevelConfig[trustLevel as keyof typeof trustLevelConfig] || { variant: 'outline' as const };
    return <Badge variant={config.variant}>{label}</Badge>;
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleUpdateUser = async (
    userId: number, 
    updates: Partial<User>,
    primeInfo?: { isPaid: boolean; paymentReference?: string; notes?: string }
  ) => {
    try {
      // Handle specific updates that require database operations
      if (updates.trustLevel !== undefined) {
        await updateTrustLevel(userId, updates.trustLevel, primeInfo);
      }
      if (updates.status !== undefined) {
        await updateUserStatus(userId, updates.status);
      }
      
      // Update selected user in modal immediately with pending changes
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? {
          ...prev,
          trustLevel: updates.trustLevel ?? prev.trustLevel,
          status: updates.status ?? prev.status
        } : prev);
      }
      
      // Show success toast with details
      const changeDetails = [];
      if (updates.trustLevel) changeDetails.push(`Nivel de Confianza: ${updates.trustLevel}`);
      if (updates.status) changeDetails.push(`Estado: ${updates.status}`);
      
      toast({
        title: "Usuario actualizado",
        description: changeDetails.length > 0 
          ? `Los cambios se han guardado: ${changeDetails.join(', ')}`
          : "Los cambios se han guardado correctamente",
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error al actualizar",
        description: error?.message || "No se pudieron guardar los cambios. Intenta de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleBanUser = async (
    userId: number,
    duration: 'permanent' | '24h' | '7d' | '30d' | 'custom',
    customDate?: string,
    reason?: string
  ) => {
    try {
      await banUser(userId, duration, customDate, reason);
      
      toast({
        title: "Usuario bloqueado",
        description: `El usuario ha sido bloqueado exitosamente${duration === 'permanent' ? ' de forma permanente' : ''}.`,
      });

      // Update selected user to reflect ban status
      if (selectedUser && selectedUser.id === userId) {
        await refreshUsers();
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast({
        title: "Error al bloquear",
        description: error?.message || "No se pudo bloquear el usuario. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await unbanUser(userId);
      
      toast({
        title: "Usuario desbloqueado",
        description: "El usuario ha sido desbloqueado exitosamente y puede acceder a la plataforma.",
      });

      // Update selected user to reflect unban status
      if (selectedUser && selectedUser.id === userId) {
        await refreshUsers();
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error al desbloquear",
        description: error?.message || "No se pudo desbloquear el usuario. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, newRole);
      
      toast({
        title: newRole === 'admin' ? "Usuario promovido" : "Rol removido",
        description: newRole === 'admin' 
          ? "El usuario ahora es administrador y tiene acceso completo a la plataforma" 
          : "El usuario ya no es administrador",
      });

      // Refresh and update selected user
      await refreshUsers();
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = users.find(u => u.id === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error al actualizar rol",
        description: error?.message || "No se pudo actualizar el rol del usuario. Intenta de nuevo.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getUserInitials = (user: any) => {
    const firstName = user.name?.split(' ')[0] || user.first_name || '';
    const lastName = user.name?.split(' ')[1] || user.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const runMigration = async (dryRun: boolean) => {
    try {
      setMigrating(true);
      toast({
        title: dryRun ? 'Simulando migración de avatares' : 'Migrando avatares',
        description: dryRun ? 'Ejecutando DRY RUN...' : 'Ejecutando migración en vivo...',
      });
      const { data, error } = await supabase.functions.invoke('migrate-avatar-paths', {
        body: { dryRun, batchSize: 25 },
      });
      if (error) {
        throw error;
      }
      toast({
        title: 'Proceso completado',
        description: `Migrados: ${data?.migrated ?? 0} • Errores: ${data?.errors?.length ?? 0}`,
      });
      try { (refreshUsers as any)?.(); } catch {}
    } catch (e: any) {
      toast({
        title: 'Error en migración',
        description: e?.message || 'No se pudo ejecutar la migración',
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              Control de Usuarios
            </h2>
            <p className="text-muted-foreground">
              Gestiona todos los usuarios registrados en la plataforma
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => runMigration(true)} disabled={migrating}>
              Dry run
            </Button>
            <Button variant="default" size="sm" onClick={() => runMigration(false)} disabled={migrating}>
              Migrar avatares
            </Button>
          </div>
        </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Todos los Usuarios
          </TabsTrigger>
          <TabsTrigger value="travelers" className="flex items-center gap-1.5">
            <Plane className="h-4 w-4" />
            Viajeros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalCount || users.length}</p>
              <p className="text-sm text-muted-foreground">Total Usuarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {users.filter(u => u.role === 'user').length}
              </p>
              <p className="text-sm text-muted-foreground">Usuarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-muted-foreground">Administradores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                {users.filter(u => u.status === 'verified').length}
              </p>
              <p className="text-sm text-muted-foreground">Verificados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en TODOS los usuarios por nombre, email, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              {isServerSearch && !searching && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ Buscando en todos los {totalCount} usuarios
                </p>
              )}
              {searchTerm.length === 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Escribe al menos 2 caracteres para buscar...
                </p>
              )}
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="user">Usuarios</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="verified">Verificados</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isServerSearch 
              ? `Resultados de búsqueda (${users.length})` 
              : `Lista de Usuarios (${users.length} de ${totalCount})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Foto</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Nivel de Confianza</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Cargando usuarios...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                 users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar 
                        className={`h-12 w-12 ${(user as any).avatar_url ? 'cursor-pointer hover:ring-2 hover:ring-primary transition-all' : ''}`}
                        onClick={() => {
                          const avatarUrl = (user as any).avatar_url;
                          if (avatarUrl) {
                            setSelectedAvatarUrl(avatarUrl);
                            setSelectedAvatarName(user.name);
                          }
                        }}
                      >
                        <AvatarImage 
                          src={(user as any).avatar_url || undefined} 
                          alt={`Foto de ${user.name}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{user.username || `user${user.id}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {user.whatsappNumber || 'No registrado'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.registrationDate ? 
                        formatDistanceToNow(new Date(user.registrationDate), { addSuffix: true, locale: es }) :
                        'No disponible'
                      }
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      {getTrustLevelBadge(user.trustLevel)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUser(user)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver Perfil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios con los filtros aplicados
            </div>
          )}

          {/* Load More Button */}
          {!loading && hasMore && users.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loadingMore}
                className="w-full max-w-xs"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Cargando...
                  </>
                ) : (
                  <>Cargar más usuarios ({users.length} de {totalCount})</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          isOpen={showUserDetail}
          onClose={() => {
            setShowUserDetail(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          packages={packages}
          trips={trips}
          allPackages={packages}
          onUpdateUser={handleUpdateUser}
          onBanUser={handleBanUser}
          onUnbanUser={handleUnbanUser}
          onUpdateUserRole={handleUpdateUserRole}
        />
      )}

      {/* Avatar Viewer Modal */}
      <ImageViewerModal
        isOpen={!!selectedAvatarUrl}
        onClose={() => setSelectedAvatarUrl(null)}
        imageUrl={selectedAvatarUrl || ''}
        title={`Foto de ${selectedAvatarName}`}
        filename={`avatar-${selectedAvatarName.toLowerCase().replace(/\s+/g, '-')}.jpg`}
      />
        </TabsContent>

        <TabsContent value="travelers" className="mt-4">
          <AdminTravelersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
