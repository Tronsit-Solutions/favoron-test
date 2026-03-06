import { useState, useEffect, useCallback } from "react";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAdminReferrals } from "@/hooks/useAdminReferrals";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, Clock, CheckCircle, DollarSign, Gift, Settings } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { DeleteReferralDialog } from "@/components/admin/referrals/DeleteReferralDialog";
import { AddReferralDialog } from "@/components/admin/referrals/AddReferralDialog";

const formatName = (profile?: { first_name: string | null; last_name: string | null }) => {
  if (!profile) return "—";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
};

const AdminReferrals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    referrals, loading, totalReferrals, pendingCount, completedCount,
    totalRewardsDistributed, totalDiscountsGiven, refetch,
  } = useAdminReferrals();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from('referrals').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "✅ Eliminado", description: "Registro de referido eliminado" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const [rewardAmount, setRewardAmount] = useState<number>(20);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardSaving, setRewardSaving] = useState(false);
  const [referredDiscount, setReferredDiscount] = useState<number>(20);
  const [referredDiscountLoading, setReferredDiscountLoading] = useState(false);
  const [referredDiscountSaving, setReferredDiscountSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setRewardLoading(true);
      setReferredDiscountLoading(true);
      try {
        const { data: rewardData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'referral_reward_amount')
          .maybeSingle();
        if (rewardData?.value && typeof rewardData.value === 'object' && 'amount' in (rewardData.value as any)) {
          setRewardAmount((rewardData.value as any).amount);
        }

        const { data: discountData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'referred_user_discount')
          .maybeSingle();
        if (discountData?.value && typeof discountData.value === 'object' && 'amount' in (discountData.value as any)) {
          setReferredDiscount((discountData.value as any).amount);
        }
      } catch (err) {
        console.error('Error loading referral settings:', err);
      } finally {
        setRewardLoading(false);
        setReferredDiscountLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveReward = async () => {
    setRewardSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: { amount: rewardAmount }, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('key', 'referral_reward_amount');
      if (error) throw error;
      toast({ title: "✅ Guardado", description: `Reward actualizado a Q${rewardAmount}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRewardSaving(false);
    }
  };

  const handleSaveReferredDiscount = async () => {
    setReferredDiscountSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: { amount: referredDiscount, enabled: true }, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('key', 'referred_user_discount');
      if (error) throw error;
      toast({ title: "✅ Guardado", description: `Descuento de referido actualizado a Q${referredDiscount}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setReferredDiscountSaving(false);
    }
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/admin/control")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Control Admin
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="h-8 w-8 text-primary" />
              Programa de Referidos
            </h1>
            <p className="text-muted-foreground mt-1">
              Configuración, seguimiento de referidos, recompensas y descuentos
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-blue-50 w-fit">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground">Total referidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-amber-50 w-fit">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-green-50 w-fit">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">Completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-purple-50 w-fit">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">Q{totalRewardsDistributed}</div>
                <p className="text-xs text-muted-foreground">Rewards distribuidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="p-2 rounded-lg bg-teal-50 w-fit">
                  <Gift className="h-4 w-4 text-teal-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">Q{totalDiscountsGiven}</div>
                <p className="text-xs text-muted-foreground">Descuentos otorgados</p>
              </CardContent>
            </Card>
          </div>

          {/* Configuration */}
          <Card className="mb-8 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 text-lg">
                <Settings className="h-5 w-5" />
                Configuración del programa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reward-amount" className="text-sm">Monto del reward para referidor (GTQ)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="reward-amount"
                      type="number"
                      min={1}
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(Number(e.target.value))}
                      disabled={rewardLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      onClick={handleSaveReward}
                      disabled={rewardSaving || rewardLoading}
                    >
                      {rewardSaving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este monto se asigna al referidor cuando el referido completa su primer pedido o viaje
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referred-discount" className="text-sm">Descuento para usuario referido (GTQ)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="referred-discount"
                      type="number"
                      min={0}
                      value={referredDiscount}
                      onChange={(e) => setReferredDiscount(Number(e.target.value))}
                      disabled={referredDiscountLoading}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      onClick={handleSaveReferredDiscount}
                      disabled={referredDiscountSaving || referredDiscountLoading}
                    >
                      {referredDiscountSaving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Descuento automático en el primer pedido del nuevo usuario referido
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <LoadingState message="Cargando referidos..." />
          ) : referrals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay referidos registrados aún.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Detalle de referidos ({referrals.length})</CardTitle>
                <AddReferralDialog onSuccess={refetch} />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referidor</TableHead>
                      <TableHead>Referido</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Fecha registro</TableHead>
                      <TableHead>Fecha completado</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatName(r.referrer)}</div>
                            <div className="text-xs text-muted-foreground">{r.referrer?.email || "—"}</div>
                            {r.referrer?.referral_code && (
                              <Badge variant="outline" className="text-[10px] mt-0.5">
                                {r.referrer.referral_code}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatName(r.referred)}</div>
                            <div className="text-xs text-muted-foreground">{r.referred?.email || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                            {r.status === "completed" ? "Completado" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          Q{r.reward_amount || 0}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">Q{r.referred_reward_amount || 0}</span>
                            {r.referred_reward_amount != null && r.referred_reward_amount > 0 && (
                              <Badge variant={r.referred_reward_used ? "default" : "outline"} className="ml-1 text-[10px]">
                                {r.referred_reward_used ? "Usado" : "Sin usar"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.completed_at
                            ? format(new Date(r.completed_at), "dd MMM yyyy", { locale: es })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <DeleteReferralDialog
                            referrerName={formatName(r.referrer)}
                            referredName={formatName(r.referred)}
                            onConfirm={() => handleDelete(r.id)}
                            loading={deletingId === r.id}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RequireAdmin>
  );
};

export default AdminReferrals;
