import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/ui/star-rating";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle } from "lucide-react";

interface TravelerRatingsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  travelerId: string;
  travelerName: string;
}

interface RatingRow {
  id: string;
  rating: number;
  product_condition: string;
  delivered_on_time: boolean;
  comment: string | null;
  created_at: string;
  shopper_id: string;
  package_id: string;
  shopperName?: string;
}

const conditionLabels: Record<string, string> = {
  good: "Buena",
  fair: "Regular",
  bad: "Mala",
};

const conditionVariant: Record<string, "default" | "secondary" | "destructive"> = {
  good: "default",
  fair: "secondary",
  bad: "destructive",
};

const TravelerRatingsDetailModal = ({
  isOpen,
  onClose,
  travelerId,
  travelerName,
}: TravelerRatingsDetailModalProps) => {
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("traveler_ratings")
        .select("*")
        .eq("traveler_id", travelerId)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) {
        setRatings([]);
        setLoading(false);
        return;
      }

      const shopperIds = [...new Set(data.map((r) => r.shopper_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", shopperIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [
          p.id,
          `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "—",
        ])
      );

      setRatings(
        data.map((r) => ({ ...r, shopperName: profileMap.get(r.shopper_id) || "—" }))
      );
      setLoading(false);
    };
    fetch();
  }, [isOpen, travelerId]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ratings de {travelerName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Este viajero aún no tiene ratings.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shopper</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Puntual</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.shopperName}</TableCell>
                  <TableCell>
                    <StarRating value={r.rating} readonly size="sm" />
                  </TableCell>
                  <TableCell>
                    <Badge variant={conditionVariant[r.product_condition] || "outline"}>
                      {conditionLabels[r.product_condition] || r.product_condition}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.delivered_on_time ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {r.comment || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TravelerRatingsDetailModal;
