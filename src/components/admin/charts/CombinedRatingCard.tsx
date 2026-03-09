import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StarRating from "@/components/ui/star-rating";
import { Star, ThumbsUp, RotateCcw, MessageSquare, Plane, ShoppingBag } from "lucide-react";
import AdminPlatformReviewsTab from "@/components/admin/AdminPlatformReviewsTab";
import AdminTravelerSurveysTab from "@/components/admin/AdminTravelerSurveysTab";

const CombinedRatingCard = () => {
  const [shopperSheetOpen, setShopperSheetOpen] = useState(false);
  const [travelerSheetOpen, setTravelerSheetOpen] = useState(false);

  const { data: shopperData, isLoading: shopperLoading } = useQuery({
    queryKey: ["platform-rating-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_reviews")
        .select("rating, would_recommend, would_use_again");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: travelerData, isLoading: travelerLoading } = useQuery({
    queryKey: ["traveler-rating-widget"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traveler_surveys")
        .select("rating, would_recommend, would_register_again");
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = shopperLoading || travelerLoading;

  const shopperTotal = shopperData?.length || 0;
  const shopperAvg = shopperTotal > 0 ? shopperData!.reduce((s, r) => s + r.rating, 0) / shopperTotal : 0;
  const shopperRecommend = shopperTotal > 0 ? (shopperData!.filter(r => r.would_recommend).length / shopperTotal) * 100 : 0;
  const shopperUseAgain = shopperTotal > 0 ? (shopperData!.filter(r => r.would_use_again === "yes").length / shopperTotal) * 100 : 0;

  const travelerTotal = travelerData?.length || 0;
  const travelerAvg = travelerTotal > 0 ? travelerData!.reduce((s, r) => s + r.rating, 0) / travelerTotal : 0;
  const travelerRecommend = travelerTotal > 0 ? (travelerData!.filter(r => r.would_recommend).length / travelerTotal) * 100 : 0;
  const travelerRegisterAgain = travelerTotal > 0 ? (travelerData!.filter(r => r.would_register_again === "yes_sure" || r.would_register_again === "probably_yes").length / travelerTotal) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            Ratings de la Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shoppers Column */}
            <div
              className="rounded-lg border border-border p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => setShopperSheetOpen(true)}
            >
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Shoppers</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-bold tracking-tight">{shopperAvg.toFixed(1)}</span>
                <div className="flex flex-col gap-0.5">
                  <StarRating value={Math.round(shopperAvg)} readonly size="sm" />
                  <span className="text-xs text-muted-foreground">{shopperTotal} reviews</span>
                </div>
              </div>
              <div className="space-y-2">
                <StatRow icon={MessageSquare} label="Total" value={shopperTotal.toString()} />
                <StatRow icon={ThumbsUp} label="Recomendaría" value={`${shopperRecommend.toFixed(0)}%`} />
                <StatRow icon={RotateCcw} label="Volvería a usar" value={`${shopperUseAgain.toFixed(0)}%`} />
              </div>
            </div>

            {/* Travelers Column */}
            <div
              className="rounded-lg border border-border p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => setTravelerSheetOpen(true)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Plane className="h-4 w-4 text-sky-500" />
                <span className="font-semibold text-sm">Viajeros</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-bold tracking-tight">{travelerAvg.toFixed(1)}</span>
                <div className="flex flex-col gap-0.5">
                  <StarRating value={Math.round(travelerAvg)} readonly size="sm" />
                  <span className="text-xs text-muted-foreground">{travelerTotal} encuestas</span>
                </div>
              </div>
              <div className="space-y-2">
                <StatRow icon={MessageSquare} label="Total" value={travelerTotal.toString()} />
                <StatRow icon={ThumbsUp} label="Recomendaría" value={`${travelerRecommend.toFixed(0)}%`} />
                <StatRow icon={RotateCcw} label="Volvería a viajar" value={`${travelerRegisterAgain.toFixed(0)}%`} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={shopperSheetOpen} onOpenChange={setShopperSheetOpen}>
        <SheetContent side="right" className="sm:max-w-5xl w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle de Reviews de la Plataforma</SheetTitle>
          </SheetHeader>
          <AdminPlatformReviewsTab />
        </SheetContent>
      </Sheet>

      <Sheet open={travelerSheetOpen} onOpenChange={setTravelerSheetOpen}>
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

const StatRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <span className="font-semibold">{value}</span>
  </div>
);

export default CombinedRatingCard;
