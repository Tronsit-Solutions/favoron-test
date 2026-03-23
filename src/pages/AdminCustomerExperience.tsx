import { RequirePermission } from "@/components/auth/RequirePermission";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, Phone, CheckCircle, Clock, Star, Search } from "lucide-react";
import { useCustomerExperience } from "@/hooks/useCustomerExperience";
import CustomerExperienceTable from "@/components/admin/cx/CustomerExperienceTable";
import { Input } from "@/components/ui/input";
import { useState } from "react";

function CXTab({ userType }: { userType: "shopper" | "traveler" }) {
  const { rows, loading, stats, saveCXCall, statusFilter, setStatusFilter } = useCustomerExperience(userType);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = rows.filter(r =>
    !searchTerm || r.target_user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="h-4 w-4" /> Total
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Completados
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.completed}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Star className="h-4 w-4" /> Rating Prom.
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.avgRating ? stats.avgRating.toFixed(1) : "—"}</p></CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="contacted">Contactado</SelectItem>
            <SelectItem value="no_answer">No contestó</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CustomerExperienceTable rows={rows} loading={loading} userType={userType} onSave={saveCXCall} />
    </div>
  );
}

const AdminCustomerExperience = () => {
  const { user, profile, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const userData = {
    id: user?.id,
    name: `${profile?.first_name} ${profile?.last_name}`.trim(),
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    email: user?.email,
    role: userRole?.role || "user",
    trust_level: profile?.trust_level,
    avatar_url: profile?.avatar_url,
  };

  return (
    <RequirePermission permission="cx">
      <div className="min-h-screen bg-background">
        <DashboardHeader
          user={userData}
          onShowProfile={() => navigate("/dashboard")}
          onLogout={handleLogout}
          onGoHome={() => navigate("/")}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Headphones className="h-8 w-8 text-primary" />
              Customer Experience
            </h1>
            <p className="text-muted-foreground mt-2">
              Seguimiento de llamadas post-entrega a shoppers y viajeros
            </p>
          </div>

          <Tabs defaultValue="shoppers">
            <TabsList>
              <TabsTrigger value="shoppers">Shoppers</TabsTrigger>
              <TabsTrigger value="travelers">Viajeros</TabsTrigger>
            </TabsList>
            <TabsContent value="shoppers" className="mt-4">
              <CXTab userType="shopper" />
            </TabsContent>
            <TabsContent value="travelers" className="mt-4">
              <CXTab userType="traveler" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequirePermission>
  );
};

export default AdminCustomerExperience;
