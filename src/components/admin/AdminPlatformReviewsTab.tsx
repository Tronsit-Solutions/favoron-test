import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/ui/star-rating";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, ThumbsUp, RotateCcw, MessageSquare } from "lucide-react";

const communicationLabels: Record<string, string> = {
  excellent: "Excelente",
  good: "Buena",
  fair: "Regular",
  poor: "Mala",
};

const wouldUseAgainLabels: Record<string, string> = {
  yes: "Sí",
  maybe: "Tal vez",
  no: "No",
};

const AdminPlatformReviewsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-platform-reviews"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("platform_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const shopperIds = new Set(reviews?.map((r) => r.shopper_id) || []);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", Array.from(shopperIds));

      const profileMap = new Map(
        profiles?.map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim()]) || []
      );

      return { reviews: reviews || [], profileMap };
    },
  });

  const reviews = data?.reviews || [];
  const profileMap = data?.profileMap || new Map();

  const total = reviews.length;
  const avgRating = total > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
    : "0";
  const recommendPercent = total > 0
    ? ((reviews.filter((r) => r.would_recommend).length / total) * 100).toFixed(0)
    : "0";
  const useAgainPercent = total > 0
    ? ((reviews.filter((r) => r.would_use_again === "yes").length / total) * 100).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" /> Rating Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{avgRating}</span>
                <StarRating value={Math.round(Number(avgRating))} readonly size="sm" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" /> Recomendaría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{recommendPercent}%</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Volvería a usar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{useAgainPercent}%</div>}
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews de la Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay reviews todavía</p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shopper</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Volvería</TableHead>
                    <TableHead>Recomendaría</TableHead>
                    <TableHead>Proceso claro</TableHead>
                    <TableHead>Comunicación</TableHead>
                    <TableHead>Reseña</TableHead>
                    <TableHead>Consentimiento</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{profileMap.get(r.shopper_id) || "—"}</TableCell>
                      <TableCell><StarRating value={r.rating} readonly size="sm" /></TableCell>
                      <TableCell>
                        <Badge variant={r.would_use_again === "yes" ? "success" : r.would_use_again === "no" ? "destructive" : "warning"}>
                          {wouldUseAgainLabels[r.would_use_again] || r.would_use_again}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.would_recommend ? (
                          <Badge variant="success">Sí</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.process_was_clear ? (
                          <Badge variant="success">Sí</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.communication_quality === "excellent" || r.communication_quality === "good" ? "success" : r.communication_quality === "fair" ? "warning" : "destructive"}>
                          {communicationLabels[r.communication_quality] || r.communication_quality}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] whitespace-pre-wrap break-words">{r.review_text || "—"}</TableCell>
                      <TableCell>
                        {r.consent_to_publish ? (
                          <Badge variant="success">Sí</Badge>
                        ) : (
                          <Badge variant="muted">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.created_at), "PPp", { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlatformReviewsTab;
