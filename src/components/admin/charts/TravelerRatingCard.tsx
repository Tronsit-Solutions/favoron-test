import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StarRating from "@/components/ui/star-rating";
import { Plane, ThumbsUp, RotateCcw, MessageSquare } from "lucide-react";
import AdminTravelerSurveysTab from "@/components/admin/AdminTravelerSurveysTab";

const TravelerRatingCard = () => {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["traveler-rating-widget"],
    queryFn: async () => {
      const { data: surveys, error } = await supabase
        .from("traveler_surveys")
        .select("rating, would_recommend, would_register_again");
      if (error) throw error;
      return surveys || [];
    },
  });

  const total = data?.length || 0;
  const avgRating = total > 0
    ? data!.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;
  const recommendPercent = total > 0
    ? (data!.filter((r) => r.would_recommend).length / total) * 100
    : 0;
  const registerAgainPercent = total > 0
    ? (data!.filter((r) => r.would_register_again === "yes_sure" || r.would_register_again === "probably_yes").length / total) * 100
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
    <>
      <Card className="h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpen(true)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plane className="h-5 w-5 text-sky-500" />
            Rating Viajeros
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-6xl font-bold tracking-tight">{avgRating.toFixed(1)}</span>
            <div className="flex flex-col gap-1">
              <StarRating value={Math.round(avgRating)} readonly size="lg" />
              <span className="text-sm text-muted-foreground">{total} encuestas</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <MessageSquare className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-3xl font-bold">{total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-3xl font-bold">{recommendPercent.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Recomendaría</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <RotateCcw className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-3xl font-bold">{registerAgainPercent.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Volvería a viajar</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="sm:max-w-5xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle de Encuestas de Viajeros</SheetTitle>
          </SheetHeader>
          <AdminTravelerSurveysTab />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TravelerRatingCard;
