import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/ui/star-rating";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, Clock, ThumbsUp } from "lucide-react";

const conditionLabels: Record<string, string> = {
  good: "Buena",
  fair: "Regular",
  bad: "Mala",
};

const conditionVariants: Record<string, "success" | "warning" | "destructive"> = {
  good: "success",
  fair: "warning",
  bad: "destructive",
};

const AdminTravelerRatingsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-traveler-ratings"],
    queryFn: async () => {
      const { data: ratings, error } = await supabase
        .from("traveler_ratings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Batch fetch profile names
      const userIds = new Set<string>();
      ratings?.forEach((r) => {
        userIds.add(r.shopper_id);
        userIds.add(r.traveler_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(
        profiles?.map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim()]) || []
      );

      return { ratings: ratings || [], profileMap };
    },
  });

  const ratings = data?.ratings || [];
  const profileMap = data?.profileMap || new Map();

  const totalRatings = ratings.length;
  const avgRating = totalRatings > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
    : "0";
  const onTimePercent = totalRatings > 0
    ? ((ratings.filter((r) => r.delivered_on_time).length / totalRatings) * 100).toFixed(0)
    : "0";

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" /> Total Calificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{totalRatings}</div>}
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
              <Clock className="h-4 w-4" /> Entrega a Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{onTimePercent}%</div>}
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Calificaciones de Viajeros</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : ratings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay calificaciones todavía</p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shopper</TableHead>
                    <TableHead>Viajero</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Condición</TableHead>
                    <TableHead>A Tiempo</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{profileMap.get(r.shopper_id) || "—"}</TableCell>
                      <TableCell>{profileMap.get(r.traveler_id) || "—"}</TableCell>
                      <TableCell><StarRating value={r.rating} readonly size="sm" /></TableCell>
                      <TableCell>
                        <Badge variant={conditionVariants[r.product_condition] || "secondary"}>
                          {conditionLabels[r.product_condition] || r.product_condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.delivered_on_time ? (
                          <Badge variant="success"><ThumbsUp className="h-3 w-3 mr-1" />Sí</Badge>
                        ) : (
                          <Badge variant="destructive">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.comment || "—"}</TableCell>
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

export default AdminTravelerRatingsTab;
