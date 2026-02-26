import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Gift, HelpCircle, Bell, Wallet, ArrowLeft, Landmark, FileText, Shield } from "lucide-react";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReferrals } from "@/hooks/useReferrals";
import ProfileHeader from "./profile/ProfileHeader";
import UserLevelCard from "./profile/UserLevelCard";

import PersonalInfoDisplay from "./profile/PersonalInfoDisplay";
import BankingInfoForm from "./profile/BankingInfoForm";
import BankingInfoDisplay from "./profile/BankingInfoDisplay";
import ReferralSection from "./profile/ReferralSection";
import ProfileNavigationCard from "./profile/ProfileNavigationCard";
import ProfileHistorySection from "./profile/ProfileHistorySection";
import ProfileNotificationsSection from "./profile/ProfileNotificationsSection";

interface UserProfileProps {
  user: any;
  packages: any[];
  trips: any[];
  onUpdateUser: (userData: any) => void;
}

type ActiveSection = null | "history" | "referrals" | "help" | "notifications" | "personal" | "banking" | "customs";

const UserProfile = ({ user, packages, trips, onUpdateUser }: UserProfileProps) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [isBankingEditing, setIsBankingEditing] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { toast } = useToast();
  const { balance, loading: referralsLoading } = useReferrals();

  const [formData, setFormData] = useState({
    bankAccountHolder: user.bank_account_holder || user.bankAccountHolder || '',
    bankName: user.bank_name || user.bankName || '',
    bankAccountType: user.bank_account_type || user.bankAccountType || '',
    bankAccountNumber: user.bank_account_number || user.bankAccountNumber || '',
    bank_account_holder: user.bank_account_holder || user.bankAccountHolder || '',
    bank_name: user.bank_name || user.bankName || '',
    bank_account_type: user.bank_account_type || user.bankAccountType || '',
    bank_account_number: user.bank_account_number || user.bankAccountNumber || ''
  });

  const handleBankingSave = () => {
    const updatedUser = {
      ...user,
      bankAccountHolder: formData.bank_account_holder || formData.bankAccountHolder,
      bankName: formData.bank_name || formData.bankName,
      bankAccountType: formData.bank_account_type || formData.bankAccountType,
      bankAccountNumber: formData.bank_account_number || formData.bankAccountNumber,
      bank_account_holder: formData.bank_account_holder || formData.bankAccountHolder,
      bank_name: formData.bank_name || formData.bankName,
      bank_account_type: formData.bank_account_type || formData.bankAccountType,
      bank_account_number: formData.bank_account_number || formData.bankAccountNumber
    };
    onUpdateUser(updatedUser);
    setIsBankingEditing(false);
    toast({
      title: "¡Información bancaria actualizada!",
      description: "Tus datos bancarios han sido guardados correctamente"
    });
  };

  const handleBankingCancel = () => {
    setFormData({
      ...formData,
      bankAccountHolder: user.bank_account_holder || user.bankAccountHolder || '',
      bankName: user.bank_name || user.bankName || '',
      bankAccountType: user.bank_account_type || user.bankAccountType || '',
      bankAccountNumber: user.bank_account_number || user.bankAccountNumber || '',
      bank_account_holder: user.bank_account_holder || user.bankAccountHolder || '',
      bank_name: user.bank_name || user.bankName || '',
      bank_account_type: user.bank_account_type || user.bankAccountType || '',
      bank_account_number: user.bank_account_number || user.bankAccountNumber || ''
    });
    setIsBankingEditing(false);
  };

  // Stats calculation
  const userPackages = packages.filter(pkg => pkg.user_id === user.id);
  const userTrips = trips.filter(trip => trip.user_id === user.id);

  const completedPackages = userPackages.filter(pkg => {
    if (pkg.status === 'delivered_to_office') return true;
    if (pkg.matched_trip_id) {
      const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
      return matchedTrip && matchedTrip.status === 'completed_paid';
    }
    return false;
  });

  const deliveredAsTraverler = packages.filter(pkg => {
    const matchedTrip = userTrips.find(trip => trip.id === pkg.matched_trip_id);
    if (!matchedTrip) return false;
    return pkg.status === 'delivered_to_office' || matchedTrip.status === 'completed_paid';
  });

  const totalTips = deliveredAsTraverler.reduce((sum, pkg) => {
    const tip = pkg.quote?.price ? parseFloat(pkg.quote.price) : 0;
    return sum + tip;
  }, 0);

  const stats = {
    packagesRequested: userPackages.length,
    packagesCompleted: completedPackages.length,
    totalTips: totalTips,
    packagesDelivered: deliveredAsTraverler.length
  };

  const getUserLevel = () => {
    const trustLevel = user.trust_level || user.trustLevel;
    if (trustLevel === 'prime') {
      return { level: "Prime", progress: 100, next: "¡Máximo nivel!", color: "bg-purple-500", isPrime: true, trustLevel: 'prime' };
    }
    const totalActivity = stats.packagesRequested + stats.packagesCompleted;
    if (totalActivity >= 20) return { level: "Experto", progress: 100, next: "¡Máximo nivel!", color: "bg-yellow-500", isPrime: false, trustLevel: trustLevel || 'basic' };
    if (totalActivity >= 10) return { level: "Avanzado", progress: ((totalActivity - 10) / 10) * 100, next: "10 más para Experto", color: "bg-blue-500", isPrime: false, trustLevel: trustLevel || 'basic' };
    if (totalActivity >= 5) return { level: "Intermedio", progress: ((totalActivity - 5) / 5) * 100, next: "5 más para Avanzado", color: "bg-green-500", isPrime: false, trustLevel: trustLevel || 'basic' };
    return { level: "Principiante", progress: (totalActivity / 5) * 100, next: "5 actividades para Intermedio", color: "bg-gray-500", isPrime: false, trustLevel: trustLevel || 'basic' };
  };

  const userLevel = getUserLevel();

  const toggleSection = (section: ActiveSection) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  // If a section is active, show that section's full-page view
  if (activeSection === "history") {
    return (
      <div className="space-y-4 mobile-container">
        <ProfileHistorySection packages={packages} trips={trips} onBack={() => setActiveSection(null)} />
      </div>
    );
  }

  if (activeSection === "notifications") {
    return (
      <div className="space-y-4 mobile-container">
        <ProfileNotificationsSection user={user} onUpdateUser={onUpdateUser} onBack={() => setActiveSection(null)} />
      </div>
    );
  }

  if (activeSection === "referrals") {
    return (
      <div className="space-y-4 mobile-container">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Button>
        <ReferralSection />
      </div>
    );
  }

  if (activeSection === "personal") {
    return (
      <div className="space-y-4 mobile-container">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
            <CardDescription>Tu información registrada</CardDescription>
          </CardHeader>
          <CardContent>
            <PersonalInfoDisplay user={user} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "banking") {
    return (
      <div className="space-y-4 mobile-container">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Bancaria</CardTitle>
            <CardDescription>Para recibir pagos por Favorones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isBankingEditing && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsBankingEditing(true)}>
                  Editar
                </Button>
              </div>
            )}
            {isBankingEditing ? (
              <div className="space-y-4">
                <BankingInfoForm onSave={handleBankingSave} />
                <Button variant="outline" onClick={handleBankingCancel} className="w-full" size="sm">
                  Cancelar
                </Button>
              </div>
            ) : (
              <BankingInfoDisplay />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === "customs") {
    return (
      <div className="space-y-4 mobile-container">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Button>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Artículo 114 del CAUCA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  El viajero podrá introducir con exención de tributos mercancías distintas del equipaje, cuyo valor total en aduana no sea superior a <strong className="text-foreground">$500 USD</strong>.
                </p>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>"Distintas del equipaje"</strong> se refiere a mercancías destinadas a terceras personas —como los productos que transportan los viajeros de Favorón.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <Shield className="h-5 w-5 text-green-600" />
                  Artículo 582 del RECAUCA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span>✅</span><span>Las mercancías no deben ser para fines comerciales.</span></li>
                  <li className="flex items-start gap-2"><span>⛔</span><span>No deben ser mercancías prohibidas.</span></li>
                  <li className="flex items-start gap-2"><span>🕒</span><span>Haber permanecido al menos <strong>72 horas</strong> fuera del territorio.</span></li>
                  <li className="flex items-start gap-2"><span>📌</span><span>Cumplir condiciones de la legislación nacional.</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Condiciones adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>• Puede utilizarse <strong>una vez cada seis meses</strong>.</li>
                  <li>• Es <strong>personal e intransferible</strong>.</li>
                  <li>• No es acumulativo.</li>
                  <li>• Se considera utilizado en un solo viaje.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <Shield className="h-5 w-5 text-red-500" />
                  Productos Restringidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Prohibidos:</p>
                    <ul className="space-y-1"><li>• Sustancias controladas</li><li>• Armas</li><li>• Falsificaciones</li><li>• Materiales peligrosos</li></ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Con permisos:</p>
                    <ul className="space-y-1"><li>• Medicamentos</li><li>• Productos orgánicos</li><li>• Electrónicos caros</li><li>• Productos agrícolas</li></ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="space-y-4 md:space-y-6 mobile-container">
      <ProfileHeader user={user} userLevel={userLevel} onUpdateUser={onUpdateUser} onCardClick={() => setActiveSection("personal")} />

      {/* Level & Stats */}
      <UserLevelCard userLevel={userLevel} />

      {/* Referral Balance Card */}
      <Card className="border-none bg-muted/50">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Saldo de referidos</p>
            <p className="text-xl font-bold">Q{referralsLoading ? '...' : balance.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 gap-3">
        <ProfileNavigationCard
          icon={Package}
          title="Historial"
          description="Pedidos y viajes"
          onClick={() => toggleSection("history")}
        />
        <ProfileNavigationCard
          icon={Gift}
          title="Referidos"
          description="Invita amigos"
          onClick={() => toggleSection("referrals")}
        />
        <ProfileNavigationCard
          icon={HelpCircle}
          title="Ayuda"
          description="Centro de soporte"
          onClick={() => toggleSection("help")}
        />
        <ProfileNavigationCard
          icon={Bell}
          title="Notificaciones"
          description="Email y WhatsApp"
          onClick={() => toggleSection("notifications")}
        />
        <ProfileNavigationCard
          icon={Landmark}
          title="Bancaria"
          description="Pagos y cobros"
          onClick={() => toggleSection("banking")}
        />
        <ProfileNavigationCard
          icon={FileText}
          title="Términos"
          description="Términos y condiciones"
          onClick={() => setShowTermsModal(true)}
        />
        <ProfileNavigationCard
          icon={Shield}
          title="Aduanera"
          description="Regulación aduanera"
          onClick={() => toggleSection("customs")}
        />
      </div>

      

      <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};

export default UserProfile;
