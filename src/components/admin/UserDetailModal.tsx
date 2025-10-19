import { useState, useMemo } from "react";
import { User, Package, Trip } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserStatusBadge from "./UserStatusBadge";
import UserActivityTimeline from "./UserActivityTimeline";
import UserPackagesTab from "./UserPackagesTab";
import UserTripsTab from "./UserTripsTab";
import UserFinancialSummary from "./UserFinancialSummary";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { User as UserIcon, Mail, Phone, Calendar, FileText, Shield } from "lucide-react";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  packages: Package[];
  trips: Trip[];
  allPackages: Package[]; // All packages in system for cross-reference
  onUpdateUser: (userId: number, updates: Partial<User>, primeInfo?: { isPaid: boolean; paymentReference?: string; notes?: string }) => void;
}

const UserDetailModal = ({ 
  isOpen, 
  onClose, 
  user, 
  packages, 
  trips, 
  allPackages,
  onUpdateUser 
}: UserDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [pendingTrustLevel, setPendingTrustLevel] = useState<User['trustLevel']>(user.trustLevel);
  const [pendingStatus, setPendingStatus] = useState<User['status']>(user.status);
  const [showPrimeDialog, setShowPrimeDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [primePaymentInfo, setPrimePaymentInfo] = useState({
    isPaid: false,
    paymentReference: '',
    notes: ''
  });

  const profileId = (user as any).profileId as string | undefined;

  const userPackages = packages.filter(pkg => pkg.user_id === (profileId || ''));
  const userTrips = trips.filter(trip => trip.user_id === (profileId || ''));

  const derivedUsername = useMemo(() => {
    if (user.username && user.username.trim()) return user.username;
    const byPkg: any = allPackages?.find((p: any) => profileId && p.user_id === profileId);
    const fromPkg = byPkg?.profiles?.username as string | undefined;
    const byTrip: any = trips?.find((t: any) => profileId && t.user_id === profileId);
    const fromTrip = byTrip?.profiles?.username as string | undefined;
    const emailPrefix = user.email?.split('@')[0];
    return fromPkg || fromTrip || emailPrefix || 'No definido';
  }, [user.username, user.email, allPackages, trips, profileId]);
  const handleSave = () => {
    onUpdateUser(user.id, editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const getTrustLevelBadge = (level: string | undefined) => {
    const levelConfig = {
      basic: { label: 'Básico', variant: 'secondary' as const },
      confiable: { label: 'Confiable', variant: 'default' as const },
      prime: { label: 'Prime', variant: 'prime' as const }
    };
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.basic;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      shopper: 'Comprador',
      traveler: 'Viajero', 
      admin: 'Administrador'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Perfil de Usuario: {user.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="packages">Pedidos</TabsTrigger>
            <TabsTrigger value="trips">Viajes</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="activity">Historial</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Datos Personales
                </CardTitle>
                <Button 
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                  onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                >
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.name}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm font-medium">{user.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nombre de Usuario</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.username || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, username: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm">{derivedUsername}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedUser.email}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm">{user.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Usuario</Label>
                    {isEditing ? (
                      <Select 
                        value={editedUser.role} 
                        onValueChange={(value) => setEditedUser(prev => ({ ...prev, role: value as User['role'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shopper">Comprador</SelectItem>
                          <SelectItem value="traveler">Viajero</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{getRoleLabel(user.role)}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Teléfono
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.phoneNumber || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm">{user.phoneNumber || 'No registrado'}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    {isEditing ? (
                      <Input
                        value={editedUser.whatsappNumber || ''}
                        onChange={(e) => setEditedUser(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm">{user.whatsappNumber || 'No registrado'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fecha de Registro
                    </Label>
                    <p className="text-sm">
                      {user.registrationDate ? 
                        formatDistanceToNow(new Date(user.registrationDate), { addSuffix: true, locale: es }) :
                        'No disponible'
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <UserStatusBadge status={user.status} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nivel de Confianza</Label>
                    {getTrustLevelBadge(user.trustLevel)}
                  </div>
                </div>

                {/* Document Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Información de Documentos</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Documento</Label>
                      <p className="text-sm">{user.documentType || 'No registrado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Número de Documento</Label>
                      <p className="text-sm">{user.documentNumber || 'No registrado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Código de País</Label>
                      <p className="text-sm">{user.countryCode || '+502'}</p>
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Información Bancaria</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titular de la Cuenta</Label>
                      <p className="text-sm">{user.bankAccountHolder || 'No registrado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <p className="text-sm">{user.bankName || 'No registrado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipo de Cuenta</Label>
                      <p className="text-sm">{user.bankAccountType || 'No registrado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Número de Cuenta</Label>
                      <p className="text-sm font-mono">{user.bankAccountNumber || 'No registrado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Código SWIFT</Label>
                      <p className="text-sm font-mono">{user.bankSwiftCode || 'No registrado'}</p>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      Guardar Cambios
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages">
            <UserPackagesTab packages={userPackages} />
          </TabsContent>

          <TabsContent value="trips">
            <UserTripsTab trips={userTrips} allPackages={allPackages} />
          </TabsContent>

          <TabsContent value="financial">
            <UserFinancialSummary 
              packages={userPackages} 
              trips={userTrips} 
              allPackages={allPackages}
            />
          </TabsContent>

          <TabsContent value="activity">
            <UserActivityTimeline packages={userPackages} trips={userTrips} />
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Configuración Administrativa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado del Usuario</Label>
                    <Select 
                      value={pendingStatus || 'active'}
                      onValueChange={(value) => setPendingStatus(value as User['status'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="verified">Verificado</SelectItem>
                        <SelectItem value="blocked">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nivel de Confianza</Label>
                    <Select 
                      value={pendingTrustLevel || 'basic'}
                      onValueChange={(value) => {
                        const newLevel = value as User['trustLevel'];
                        // If selecting Prime, show confirmation dialog
                        if (newLevel === 'prime' && user.trustLevel !== 'prime') {
                          setShowPrimeDialog(true);
                          setPendingTrustLevel(newLevel);
                        } else {
                          setPendingTrustLevel(newLevel);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="basic">Básico</SelectItem>
                         <SelectItem value="confiable">Confiable</SelectItem>
                         <SelectItem value="prime" className="text-purple-600 font-semibold">
                           Prime ✨
                         </SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>

                {(pendingTrustLevel !== user.trustLevel || pendingStatus !== user.status) && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Hay cambios sin guardar
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Presiona "Guardar cambios" para aplicar los cambios
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPendingTrustLevel(user.trustLevel);
                          setPendingStatus(user.status);
                        }}
                      >
                       Cancelar
                      </Button>
                       <Button
                         size="sm"
                         disabled={isSaving}
                         onClick={async () => {
                           try {
                             setIsSaving(true);
                             
                             if (pendingTrustLevel !== user.trustLevel) {
                               // If upgrading to Prime, pass payment info
                               if (pendingTrustLevel === 'prime') {
                                 await onUpdateUser(user.id, { trustLevel: pendingTrustLevel }, primePaymentInfo);
                               } else {
                                 await onUpdateUser(user.id, { trustLevel: pendingTrustLevel });
                               }
                             }
                             if (pendingStatus !== user.status) {
                               await onUpdateUser(user.id, { status: pendingStatus });
                             }
                             
                             // Reset pending states after successful save
                             setPendingTrustLevel(user.trustLevel);
                             setPendingStatus(user.status);
                             
                             // Close Prime dialog if it was open
                             setShowPrimeDialog(false);
                             setPrimePaymentInfo({ isPaid: false, paymentReference: '', notes: '' });
                           } catch (error) {
                             console.error('Error saving changes:', error);
                           } finally {
                             setIsSaving(false);
                           }
                         }}
                       >
                         {isSaving ? (
                           <>
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                             Guardando...
                           </>
                         ) : (
                           'Guardar cambios'
                         )}
                       </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Notas Administrativas
                  </Label>
                  <Textarea
                    placeholder="Agregar notas internas sobre el usuario..."
                    value={user.adminNotes || ''}
                    onChange={(e) => onUpdateUser(user.id, { adminNotes: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Estas notas solo son visibles para administradores
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Total de Paquetes</p>
                    <p className="text-2xl font-bold text-primary">{userPackages.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total de Viajes</p>
                    <p className="text-2xl font-bold text-secondary">{userTrips.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Prime Payment Information Dialog */}
        <AlertDialog open={showPrimeDialog} onOpenChange={setShowPrimeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Asignar Membresía Prime ✨</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Estás a punto de asignar nivel Prime a {user.name}. Por favor confirma:</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paid"
                      name="payment"
                      checked={primePaymentInfo.isPaid}
                      onChange={() => setPrimePaymentInfo(prev => ({ ...prev, isPaid: true }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="paid" className="font-normal cursor-pointer">
                      El usuario pagó la membresía (Q300)
                    </Label>
                  </div>
                  
                  {primePaymentInfo.isPaid && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="reference" className="text-sm">
                        Referencia de pago (opcional)
                      </Label>
                      <Input
                        id="reference"
                        placeholder="Ej: Transferencia #12345"
                        value={primePaymentInfo.paymentReference}
                        onChange={(e) => setPrimePaymentInfo(prev => ({ 
                          ...prev, 
                          paymentReference: e.target.value 
                        }))}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="courtesy"
                      name="payment"
                      checked={!primePaymentInfo.isPaid}
                      onChange={() => setPrimePaymentInfo(prev => ({ 
                        ...prev, 
                        isPaid: false,
                        paymentReference: ''
                      }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="courtesy" className="font-normal cursor-pointer">
                      Cortesía administrativa (sin pago)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm">
                      Notas adicionales (opcional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Ej: Usuario de confianza, membresía promocional, etc."
                      value={primePaymentInfo.notes}
                      onChange={(e) => setPrimePaymentInfo(prev => ({ 
                        ...prev, 
                        notes: e.target.value 
                      }))}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    Esta acción creará un registro en prime_memberships con validez de 1 año.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setPendingTrustLevel(user.trustLevel);
                setPrimePaymentInfo({ isPaid: false, paymentReference: '', notes: '' });
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowPrimeDialog(false);
              }}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;