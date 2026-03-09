import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/ui/star-rating";
import { Star, ThumbsUp, TrendingUp, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TravelerSurvey {
  id: string;
  traveler_id: string;
  trip_id: string;
  rating: number;
  would_recommend: boolean;
  process_difficulty: string;
  would_register_again: string;
  tip_satisfaction: string;
  review_text: string | null;
  consent_to_publish: boolean;
  created_at: string;
}

const difficultyLabels: Record<string, string> = {
  very_easy: "Muy fácil",
  easy: "Fácil",
  normal: "Normal",
  difficult: "Difícil",
  very_difficult: "Muy difícil",
};

const registerAgainLabels: Record<string, string> = {
  yes_sure: "Sí, seguro",
  probably_yes: "Probablemente sí",
  not_sure: "No estoy seguro",
  probably_no: "Probablemente no",
  no: "No",
};

const tipSatisfactionLabels: Record<string, string> = {
  very_satisfied: "Muy satisfecho",
  satisfied: "Satisfecho",
  neutral: "Neutral",
  unsatisfied: "Poco satisfecho",
  very_unsatisfied: "Nada satisfecho",
};

const AdminTravelerSurveysTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-traveler-surveys"],
    queryFn: async () => {
      const { data: rawSurveys, error } = await supabase
        .from("traveler_surveys" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const surveys = (rawSurveys || []) as unknown as TravelerSurvey[];
      const travelerIds = [...new Set(surveys.map((s) => s.traveler_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", travelerIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim()]) || []
      );

      return { surveys, profileMap };
    },
  });

  const surveys = data?.surveys || [];
  const profileMap = data?.profileMap || new Map();

  const total = surveys?.length || 0;
  const avgRating = total > 0 ? surveys!.reduce((s, r) => s + r.rating, 0) / total : 0;
  const recommendPct = total > 0 ? (surveys!.filter((s) => s.would_recommend).length / total) * 100 : 0;

  // Difficulty distribution
  const diffDist = surveys?.reduce((acc, s) => {
    acc[s.process_difficulty] = (acc[s.process_difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Tip satisfaction distribution
  const tipDist = surveys?.reduce((acc, s) => {
    acc[s.tip_satisfaction] = (acc[s.tip_satisfaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Would register again distribution
  const regDist = surveys?.reduce((acc, s) => {
    acc[s.would_register_again] = (acc[s.would_register_again] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const renderBar = (label: string, count: number) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
      <div key={label} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-4 w-4" /> Total Encuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Star className="h-4 w-4" /> Rating Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" /> Recomendaría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{recommendPct.toFixed(0)}%</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Satisf. Propina
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold">
                {total > 0 ? (((tipDist["very_satisfied"] || 0) + (tipDist["satisfied"] || 0)) / total * 100).toFixed(0) : 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distributions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dificultad del Proceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-24 w-full" /> :
              ["very_easy", "easy", "normal", "difficult", "very_difficult"].map((k) =>
                renderBar(difficultyLabels[k], diffDist[k] || 0)
              )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">¿Registraría otro viaje?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-24 w-full" /> :
              ["yes_sure", "probably_yes", "not_sure", "probably_no", "no"].map((k) =>
                renderBar(registerAgainLabels[k], regDist[k] || 0)
              )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Satisfacción con Propina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <Skeleton className="h-24 w-full" /> :
              ["very_satisfied", "satisfied", "neutral", "unsatisfied", "very_unsatisfied"].map((k) =>
                renderBar(tipSatisfactionLabels[k], tipDist[k] || 0)
              )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed responses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Respuestas Individuales
          </CardTitle>
          <CardDescription>{total} encuestas de viajeros</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : surveys && surveys.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {surveys.map((s) => (
                <div key={s.id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <StarRating value={s.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), "PPp", { locale: es })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{difficultyLabels[s.process_difficulty]}</Badge>
                    <Badge variant="secondary">{registerAgainLabels[s.would_register_again]}</Badge>
                    <Badge variant="secondary">{tipSatisfactionLabels[s.tip_satisfaction]}</Badge>
                    <Badge variant={s.would_recommend ? "default" : "destructive"}>
                      {s.would_recommend ? "Recomienda" : "No recomienda"}
                    </Badge>
                  </div>
                  {s.review_text && (
                    <p className="text-sm text-muted-foreground italic">"{s.review_text}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay encuestas de viajeros todavía</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTravelerSurveysTab;
