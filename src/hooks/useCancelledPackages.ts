import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CANCELLED_STATUSES = ["cancelled", "quote_expired", "quote_rejected", "deadline_expired"];

export interface CancelledPackageRow {
  package_id: string;
  status: string;
  item_description: string;
  products_data: any;
  user_id: string;
  user_name: string;
  user_phone: string | null;
  user_country_code: string | null;
  estimated_price: number | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  quote_rejection: any;
  traveler_rejection: any;
  package_destination: string;
  purchase_origin: string;
  delivery_deadline: string;
  traveler_name: string | null;
  computed_reason: string;
  internal_notes: string | null;
}

export interface CancelledStats {
  total: number;
  cancelled: number;
  quote_expired: number;
  quote_rejected: number;
  deadline_expired: number;
}

export function useCancelledPackages() {
  const [rows, setRows] = useState<CancelledPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CancelledStats>({ total: 0, cancelled: 0, quote_expired: 0, quote_rejected: 0, deadline_expired: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: packages, error: pkgErr } = await supabase
        .from("packages")
        .select("id, status, item_description, products_data, user_id, estimated_price, created_at, updated_at, rejection_reason, quote_rejection, traveler_rejection, package_destination, purchase_origin, delivery_deadline, matched_trip_id, internal_notes")
        .in("status", CANCELLED_STATUSES)
        .order("updated_at", { ascending: false });

      if (pkgErr) throw pkgErr;
      if (!packages || packages.length === 0) {
        setRows([]);
        setStats({ total: 0, cancelled: 0, quote_expired: 0, quote_rejected: 0, deadline_expired: 0 });
        setLoading(false);
        return;
      }

      // Resolve traveler IDs from trips
      const travelerMap: Record<string, string> = {};
      const tripIds = [...new Set(packages.map(p => p.matched_trip_id).filter(Boolean))];
      if (tripIds.length > 0) {
        const { data: trips } = await supabase
          .from("trips")
          .select("id, user_id")
          .in("id", tripIds as string[]);
        if (trips) trips.forEach(t => { travelerMap[t.id] = t.user_id; });
      }

      // Collect all user IDs (shoppers + travelers)
      const allUserIds = new Set<string>();
      packages.forEach(p => {
        allUserIds.add(p.user_id);
        const travelerId = p.matched_trip_id ? travelerMap[p.matched_trip_id] : null;
        if (travelerId) allUserIds.add(travelerId);
      });

      // Fetch profiles
      const profileMap: Record<string, { name: string; phone: string | null; country_code: string | null }> = {};
      if (allUserIds.size > 0) {
        const userIdArray = [...allUserIds];
        const BATCH_SIZE = 200;
        for (let i = 0; i < userIdArray.length; i += BATCH_SIZE) {
          const batch = userIdArray.slice(i, i + BATCH_SIZE);
          const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, phone_number, country_code")
            .in("id", batch);
          if (error) console.warn("Profile fetch error (cancelled pkgs):", error);
          if (profiles) {
            profiles.forEach(pr => {
              profileMap[pr.id] = {
                name: `${pr.first_name || ""} ${pr.last_name || ""}`.trim() || "Sin nombre",
                phone: pr.phone_number,
                country_code: pr.country_code,
              };
            });
          }
        }
        if (Object.keys(profileMap).length === 0) {
          console.warn("No profiles resolved — RLS may be blocking access. User IDs attempted:", userIdArray.length);
        }
      }

      // Build rows
      const result: CancelledPackageRow[] = packages.map(p => {
        const shopperProfile = profileMap[p.user_id] || { name: "Sin nombre", phone: null, country_code: null };
        const travelerId = p.matched_trip_id ? travelerMap[p.matched_trip_id] : null;
        const travelerProfile = travelerId ? profileMap[travelerId] : null;

        // Compute reason
        let reason = "Sin razón registrada";
        if (p.rejection_reason) {
          reason = `Shopper: ${p.rejection_reason}`;
        } else if (p.traveler_rejection && typeof p.traveler_rejection === "object" && ((p.traveler_rejection as any).rejection_reason || (p.traveler_rejection as any).reason)) {
          reason = `Viajero: ${(p.traveler_rejection as any).rejection_reason || (p.traveler_rejection as any).reason}`;
        } else if (p.quote_rejection && typeof p.quote_rejection === "object" && (p.quote_rejection as any).reason) {
          reason = `Cotización: ${(p.quote_rejection as any).reason}`;
        }

        return {
          package_id: p.id,
          status: p.status,
          item_description: p.item_description,
          products_data: p.products_data,
          user_id: p.user_id,
          user_name: shopperProfile.name,
          user_phone: shopperProfile.phone,
          user_country_code: shopperProfile.country_code,
          estimated_price: p.estimated_price,
          created_at: p.created_at,
          updated_at: p.updated_at,
          rejection_reason: p.rejection_reason,
          quote_rejection: p.quote_rejection,
          traveler_rejection: p.traveler_rejection,
          package_destination: p.package_destination,
          purchase_origin: p.purchase_origin,
          delivery_deadline: p.delivery_deadline,
          traveler_name: travelerProfile?.name || null,
          computed_reason: reason,
          internal_notes: p.internal_notes as string | null,
        };
      });

      // Stats
      setStats({
        total: result.length,
        cancelled: result.filter(r => r.status === "cancelled").length,
        quote_expired: result.filter(r => r.status === "quote_expired").length,
        quote_rejected: result.filter(r => r.status === "quote_rejected").length,
        deadline_expired: result.filter(r => r.status === "deadline_expired").length,
      });

      setRows(result);
    } catch (err: any) {
      console.error("Cancelled packages fetch error:", err);
      toast.error("Error cargando paquetes cancelados/expirados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = rows
    .filter(r => statusFilter === "all" || r.status === statusFilter)
    .filter(r => !searchTerm || r.user_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const updateNotes = useCallback(async (packageId: string, notes: string) => {
    const { error } = await supabase
      .from("packages")
      .update({ internal_notes: notes || null })
      .eq("id", packageId);
    if (error) {
      toast.error("Error guardando nota");
      throw error;
    }
    setRows(prev => prev.map(r => r.package_id === packageId ? { ...r, internal_notes: notes || null } : r));
  }, []);

  return { rows: filteredRows, allRows: rows, loading, stats, statusFilter, setStatusFilter, searchTerm, setSearchTerm, updateNotes };
}
