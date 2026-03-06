import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/ui/star-rating";
import { Star, ThumbsUp, RotateCcw, MessageSquare } from "lucide-react";

const PlatformRatingCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-rating-widget"],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("platform_reviews")
        .select("rating, would_recommend, would_use_again");
      if (error) throw error;
      return reviews || [];
    },
  });

  const total = data?.length || 0;
  const avgRating = total > 0
    ? data!.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;
  const recommendPercent = total > 0
    ? (data!.filter((r) => r.would_recommend).length / total) * 100
    : 0;
  const useAgainPercent = total > 0
    ? (data!.filter((r) => r.would_use_again === "yes").length / total) * 100
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          Rating Global de la Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl font-bold tracking-tight">{avgRating.toFixed(1)}</span>
          <div className="flex flex-col gap-1">
            <StarRating value={Math.round(avgRating)} readonly size="lg" />
            <span className="text-sm text-muted-foreground">{total} reviews</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <ThumbsUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{recommendPercent.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Recomendaría</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <RotateCcw className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{useAgainPercent.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Volvería a usar</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformRatingCard;
