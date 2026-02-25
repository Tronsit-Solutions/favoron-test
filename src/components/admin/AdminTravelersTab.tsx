import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/ui/star-rating";
import TravelerRatingsDetailModal from "./TravelerRatingsDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plane, Star, Clock, Eye } from "lucide-react";

interface TravelerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  traveler_avg_rating: number | null;
  traveler_total_ratings: number | null;
  traveler_ontime_rate: number | null;
  tripCount: number;
}

const AdminTravelersTab = () => {
  const [travelers, setTravelers] = useState<TravelerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTraveler, setSelectedTraveler] = useState<TravelerProfile | null>(null);

  useEffect(() => {
    const fetchTravelers = async () => {
      setLoading(true);

      // Get distinct traveler IDs with trip counts
      const { data: tripsData } = await supabase
        .from("trips")
        .select("user_id");

      if (!tripsData || tripsData.length === 0) {
        setTravelers([]);
        setLoading(false);
        return;
      }

      // Count trips per user
      const tripCounts = new Map<string, number>();
      tripsData.forEach((t) => {
        tripCounts.set(t.user_id, (tripCounts.get(t.user_id) || 0) + 1);
      });

      const travelerIds = [...tripCounts.keys()];

      // Batch fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, email, avatar_url, phone_number, traveler_avg_rating, traveler_total_ratings, traveler_ontime_rate"
        )
        .in("id", travelerIds);

      const result: TravelerProfile[] = (profiles || []).map((p) => ({
        ...p,
        tripCount: tripCounts.get(p.id) || 0,
      }));

      // Sort by trip count desc
      result.sort((a, b) => b.tripCount - a.tripCount);
      setTravelers(result);
      setLoading(false);
    };

    fetchTravelers();
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm) return travelers;
    const term = searchTerm.toLowerCase();
    return travelers.filter(
      (t) =>
        `${t.first_name || ""} ${t.last_name || ""}`.toLowerCase().includes(term) ||
        (t.email || "").toLowerCase().includes(term)
    );
  }, [travelers, searchTerm]);

  const getName = (t: TravelerProfile) =>
    `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.email || "—";

  const getInitials = (t: TravelerProfile) => {
    if (t.first_name && t.last_name) return `${t.first_name[0]}${t.last_name[0]}`.toUpperCase();
    if (t.first_name) return t.first_name.substring(0, 2).toUpperCase();
    if (t.email) return t.email.substring(0, 2).toUpperCase();
    return "V";
  };

  // KPIs
  const totalTravelers = travelers.length;
  const avgRatingGlobal =
    travelers.filter((t) => t.traveler_avg_rating != null).length > 0
      ? travelers.reduce((sum, t) => sum + (t.traveler_avg_rating || 0), 0) /
        travelers.filter((t) => t.traveler_avg_rating != null).length
      : 0;
  const avgOntime =
    travelers.filter((t) => t.traveler_ontime_rate != null).length > 0
      ? travelers.reduce((sum, t) => sum + (t.traveler_ontime_rate || 0), 0) /
        travelers.filter((t) => t.traveler_ontime_rate != null).length
      : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Plane className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{totalTravelers}</p>
            <p className="text-sm text-muted-foreground">Total Viajeros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{avgRatingGlobal.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Rating Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{(avgOntime * 100).toFixed(0)}%</p>
            <p className="text-sm text-muted-foreground">Puntualidad Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar viajero por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Viajeros ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Total Ratings</TableHead>
                <TableHead>Puntualidad</TableHead>
                <TableHead>Viajes</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron viajeros
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={t.avatar_url || undefined} alt={getName(t)} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(t)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{getName(t)}</TableCell>
                    <TableCell className="text-sm">{t.email || "—"}</TableCell>
                    <TableCell>
                      {t.traveler_avg_rating != null ? (
                        <div className="flex items-center gap-1">
                          <StarRating value={Math.round(t.traveler_avg_rating)} readonly size="sm" />
                          <span className="text-sm text-muted-foreground">
                            ({Number(t.traveler_avg_rating).toFixed(1)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin ratings</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{t.traveler_total_ratings || 0}</TableCell>
                    <TableCell>
                      {t.traveler_ontime_rate != null ? (
                        <span className="text-sm font-medium">
                          {(Number(t.traveler_ontime_rate) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{t.tripCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTraveler(t)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Ver Ratings
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedTraveler && (
        <TravelerRatingsDetailModal
          isOpen={!!selectedTraveler}
          onClose={() => setSelectedTraveler(null)}
          travelerId={selectedTraveler.id}
          travelerName={getName(selectedTraveler)}
        />
      )}
    </div>
  );
};

export default AdminTravelersTab;
