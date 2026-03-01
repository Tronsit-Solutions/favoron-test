import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAdminReferrals } from "@/hooks/useAdminReferrals";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, Clock, CheckCircle, DollarSign, Gift } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formatName = (profile?: { first_name: string | null; last_name: string | null }) => {
  if (!profile) return "—";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—";
};

const AdminReferrals = () => {
  const navigate = useNavigate();
  const {
    referrals, loading, totalReferrals, pendingCount, completedCount,
    totalRewardsDistributed, totalDiscountsGiven,
  } = useAdminReferrals();

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
              Reporte de Referidos
            </h1>
            <p className="text-muted-foreground mt-1">
              Seguimiento completo de referidos, recompensas y descuentos
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
              <CardHeader>
                <CardTitle className="text-lg">Detalle de referidos ({referrals.length})</CardTitle>
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
