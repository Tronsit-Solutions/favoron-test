import { useState } from "react";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, TrendingUp, Users, Download, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcquisitionSurveyModal from "@/components/AcquisitionSurveyModal";
import AdminTravelerRatingsTab from "@/components/admin/AdminTravelerRatingsTab";
import AdminPlatformReviewsTab from "@/components/admin/AdminPlatformReviewsTab";
import AdminTravelerSurveysTab from "@/components/admin/AdminTravelerSurveysTab";

interface AcquisitionSurveyRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  acquisition_source: string | null;
  acquisition_source_answered_at: string | null;
  referrer_name: string | null;
  created_at: string | null;
}

const AdminSurveys = () => {
  const [showPreview, setShowPreview] = useState(false);
  const { user, profile, userRole } = useAuth();
  const navigate = useNavigate();

  const { data: surveyData, isLoading } = useQuery<AcquisitionSurveyRow[]>({
    queryKey: ['acquisition-surveys'],
    queryFn: async () => {
      const pageSize = 1000;
      let from = 0;
      const allRows: AcquisitionSurveyRow[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, acquisition_source, acquisition_source_answered_at, referrer_name, created_at')
          .not('acquisition_source', 'is', null)
          .order('acquisition_source_answered_at', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allRows.push(...data);

        if (data.length < pageSize) break;
        from += pageSize;
      }

      return allRows;
    }
  });

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

  // Calcular estadísticas
  const stats = surveyData?.reduce((acc, response) => {
    const source = response.acquisition_source || 'Sin respuesta';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalResponses = surveyData?.length || 0;

  const sourceLabels: Record<string, string> = {
    'instagram_facebook_ads': 'Instagram/Facebook Ads',
    'instagram_ads': 'Instagram Ads',
    'facebook_ads': 'Facebook Ads',
    'tiktok': 'TikTok',
    'reels': 'Reels',
    'friend_referral': 'Recomendación de amigo/familiar',
    'referral': 'Recomendación',
    'other': 'Otro'
  };

  const handleExportCSV = () => {
    if (!surveyData) return;

    const csvContent = [
      ['Nombre', 'Email', 'Fuente', 'Fecha de Respuesta', 'Fecha de Registro'].join(','),
      ...surveyData.map(row => [
        `"${row.first_name} ${row.last_name}"`,
        row.email,
        sourceLabels[row.acquisition_source] || row.acquisition_source,
        row.acquisition_source_answered_at ? format(new Date(row.acquisition_source_answered_at), 'PPpp', { locale: es }) : '',
        row.created_at ? format(new Date(row.created_at), 'PPpp', { locale: es }) : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `encuesta-adquisicion-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
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
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              Encuestas y Reviews
            </h1>
            <p className="text-muted-foreground mt-2">
              Encuestas de adquisición, calificaciones de viajeros y reviews de la plataforma
            </p>
          </div>

          <Tabs defaultValue="acquisition" className="space-y-6">
            <TabsList>
              <TabsTrigger value="acquisition">Adquisición</TabsTrigger>
              <TabsTrigger value="traveler-surveys">Encuesta Viajeros</TabsTrigger>
              <TabsTrigger value="traveler-ratings">Reviews Viajeros</TabsTrigger>
              <TabsTrigger value="platform-reviews">Reviews Plataforma</TabsTrigger>
            </TabsList>

            <TabsContent value="acquisition">
              <div className="flex justify-end gap-2 mb-6">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Encuesta
                </Button>
                <Button onClick={handleExportCSV} disabled={!surveyData || totalResponses === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>

              {/* Estadísticas Generales */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de Respuestas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-3xl font-bold">{totalResponses}</div>
                    )}
                  </CardContent>
                </Card>

                {Object.entries(stats)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([source, count]) => (
                  <Card key={source}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {sourceLabels[source] || source}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        <div className="space-y-1">
                          <div className="text-3xl font-bold">{count}</div>
                          <p className="text-xs text-muted-foreground">
                            {((count / totalResponses) * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Gráfico de Distribución */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Distribución de Respuestas
                  </CardTitle>
                  <CardDescription>
                    Visualización de cómo los usuarios conocieron Favorón
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(stats)
                        .sort(([, a], [, b]) => b - a)
                        .map(([source, count]) => {
                          const percentage = (count / totalResponses) * 100;
                          return (
                            <div key={source} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{sourceLabels[source] || source}</span>
                                <span className="text-muted-foreground">
                                  {count} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tabla de Respuestas Detalladas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Respuestas Individuales
                  </CardTitle>
                  <CardDescription>
                    Todas las respuestas de usuarios ({totalResponses} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : surveyData && surveyData.length > 0 ? (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {surveyData.map((response) => (
                        <div
                          key={response.id}
                          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">
                                {response.first_name} {response.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {response.email}
                              </div>
                              {response.acquisition_source === 'friend_referral' && response.referrer_name && (
                                <div className="text-sm text-primary">
                                  Recomendado por: <span className="font-medium">{response.referrer_name}</span>
                                </div>
                              )}
                              {response.acquisition_source_answered_at && (
                                <div className="text-xs text-muted-foreground">
                                  Respondió el {format(new Date(response.acquisition_source_answered_at), 'PPpp', { locale: es })}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {sourceLabels[response.acquisition_source] || response.acquisition_source}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay respuestas de encuestas todavía
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traveler-surveys">
              <AdminTravelerSurveysTab />
            </TabsContent>

            <TabsContent value="traveler-ratings">
              <AdminTravelerRatingsTab />
            </TabsContent>

            <TabsContent value="platform-reviews">
              <AdminPlatformReviewsTab />
            </TabsContent>
          </Tabs>
        </div>

        <AcquisitionSurveyModal
          isOpen={showPreview}
          onComplete={() => setShowPreview(false)}
          previewMode
        />
      </div>
    </RequireAdmin>
  );
};

export default AdminSurveys;
