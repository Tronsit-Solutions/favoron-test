import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CXPackageRow {
  package_id: string;
  completed_at: string;
  item_description: string;
  products_data: any;
  target_user_id: string;
  target_user_name: string;
  target_user_phone: string | null;
  // Package details
  estimated_price: number | null;
  delivery_deadline: string;
  additional_notes: string | null;
  created_at: string;
  label_number: number | null;
  delivery_method: string | null;
  package_destination: string;
  // Counterpart user (traveler for shopper tab, shopper for traveler tab)
  counterpart_name: string | null;
  // CX call data (may be null if no call record yet)
  cx_id: string | null;
  call_status: string;
  rating: number | null;
  notes: string | null;
  call_date: string | null;
  scheduled_date: string | null;
}

export interface CXStats {
  total: number;
  pending: number;
  completed: number;
  scheduled: number;
  avgRating: number | null;
}

export function useCustomerExperience(userType: "shopper" | "traveler") {
  const [rows, setRows] = useState<CXPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CXStats>({ total: 0, pending: 0, completed: 0, avgRating: null });
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Fetch completed packages
      let pkgQuery = supabase
        .from("packages")
        .select("id, updated_at, item_description, products_data, user_id, matched_trip_id, estimated_price, delivery_deadline, additional_notes, created_at, label_number, delivery_method, package_destination")
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      const { data: packages, error: pkgErr } = await pkgQuery;
      if (pkgErr) throw pkgErr;
      if (!packages || packages.length === 0) {
        setRows([]);
        setStats({ total: 0, pending: 0, completed: 0, avgRating: null });
        setLoading(false);
        return;
      }

      // 2) Resolve trip -> traveler user_id (needed for both tabs)
      let travelerMap: Record<string, string> = {};
      const tripIds = [...new Set(packages.map((p) => p.matched_trip_id).filter(Boolean))];
      if (tripIds.length > 0) {
        const { data: trips } = await supabase
          .from("trips")
          .select("id, user_id")
          .in("id", tripIds as string[]);
        if (trips) {
          trips.forEach((t) => {
            travelerMap[t.id] = t.user_id;
          });
        }
      }

      // 3) Determine target user IDs + counterpart IDs
      const targetUserIds = new Set<string>();
      const counterpartUserIds = new Set<string>();
      const packageRows = packages.map((p) => {
        const targetId = userType === "shopper" ? p.user_id : travelerMap[p.matched_trip_id!];
        const counterpartId = userType === "shopper" ? travelerMap[p.matched_trip_id!] : p.user_id;
        if (targetId) targetUserIds.add(targetId);
        if (counterpartId) counterpartUserIds.add(counterpartId);
        return { ...p, target_user_id: targetId, counterpart_user_id: counterpartId };
      }).filter((p) => p.target_user_id);

      // 4) Fetch profiles for both target and counterpart users
      const allProfileIds = [...new Set([...targetUserIds, ...counterpartUserIds])];
      const profileMap: Record<string, { name: string; phone: string | null }> = {};
      if (allProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, phone_number")
          .in("id", allProfileIds);
        if (profiles) {
          profiles.forEach((pr) => {
            profileMap[pr.id] = {
              name: `${pr.first_name || ""} ${pr.last_name || ""}`.trim() || "Sin nombre",
              phone: pr.phone_number,
            };
          });
        }
      }

      // 5) Fetch existing CX calls
      const pkgIds = packageRows.map((p) => p.id);
      const { data: cxCalls } = await supabase
        .from("customer_experience_calls")
        .select("*")
        .eq("user_type", userType)
        .in("package_id", pkgIds);

      const cxMap: Record<string, any> = {};
      if (cxCalls) {
        cxCalls.forEach((c: any) => {
          cxMap[c.package_id] = c;
        });
      }

      // 6) Build rows
      const result: CXPackageRow[] = packageRows.map((p) => {
        const cx = cxMap[p.id];
        const profile = profileMap[p.target_user_id] || { name: "Sin nombre", phone: null };
        const counterpart = p.counterpart_user_id ? profileMap[p.counterpart_user_id] : null;
        return {
          package_id: p.id,
          completed_at: p.updated_at,
          item_description: p.item_description,
          products_data: p.products_data,
          target_user_id: p.target_user_id,
          target_user_name: profile.name,
          target_user_phone: profile.phone,
          estimated_price: p.estimated_price,
          delivery_deadline: p.delivery_deadline,
          additional_notes: p.additional_notes,
          created_at: p.created_at,
          label_number: p.label_number,
          delivery_method: p.delivery_method,
          package_destination: p.package_destination,
          counterpart_name: counterpart?.name || null,
          cx_id: cx?.id || null,
          call_status: cx?.call_status || "pending",
          rating: cx?.rating || null,
          notes: cx?.notes || null,
          call_date: cx?.call_date || null,
        };
      });

      // 7) Stats
      const completedCalls = result.filter((r) => r.call_status === "completed");
      const ratings = completedCalls.map((r) => r.rating).filter(Boolean) as number[];
      setStats({
        total: result.length,
        pending: result.filter((r) => r.call_status === "pending").length,
        completed: completedCalls.length,
        avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      });

      setRows(result);
    } catch (err: any) {
      console.error("CX fetch error:", err);
      toast.error("Error cargando datos de Customer Experience");
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const recalcStats = (updatedRows: CXPackageRow[]) => {
    const completedCalls = updatedRows.filter((r) => r.call_status === "completed");
    const ratings = completedCalls.map((r) => r.rating).filter(Boolean) as number[];
    setStats({
      total: updatedRows.length,
      pending: updatedRows.filter((r) => r.call_status === "pending").length,
      completed: completedCalls.length,
      avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    });
  };

  const saveCXCall = async (row: CXPackageRow, updates: { call_status?: string; rating?: number | null; notes?: string | null; call_date?: string | null }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const payload = {
        package_id: row.package_id,
        user_type: userType,
        target_user_id: row.target_user_id,
        call_status: updates.call_status ?? row.call_status,
        rating: updates.rating !== undefined ? updates.rating : row.rating,
        notes: updates.notes !== undefined ? updates.notes : row.notes,
        call_date: updates.call_date !== undefined ? updates.call_date : row.call_date,
        updated_at: new Date().toISOString(),
        created_by: user.id,
      };

      let newCxId = row.cx_id;

      if (row.cx_id) {
        const { error } = await supabase
          .from("customer_experience_calls")
          .update(payload)
          .eq("id", row.cx_id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("customer_experience_calls")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        newCxId = data.id;
      }

      // Optimistic local update
      setRows(prev => {
        const updated = prev.map(r =>
          r.package_id === row.package_id
            ? {
                ...r,
                call_status: payload.call_status,
                rating: payload.rating,
                notes: payload.notes,
                call_date: payload.call_date,
                cx_id: newCxId,
              }
            : r
        );
        recalcStats(updated);
        return updated;
      });

      toast.success("Guardado exitosamente");
    } catch (err: any) {
      console.error("CX save error:", err);
      toast.error("Error al guardar: " + err.message);
    }
  };

  const filteredRows = statusFilter === "all" ? rows : rows.filter((r) => r.call_status === statusFilter);

  return { rows: filteredRows, allRows: rows, loading, stats, saveCXCall, statusFilter, setStatusFilter, refetch: fetchData };
}
