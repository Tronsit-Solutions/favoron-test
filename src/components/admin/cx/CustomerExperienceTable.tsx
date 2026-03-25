import { useState } from "react";
import { format, isToday, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Phone, Save, MessageSquare, Eye, CalendarClock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/ui/star-rating";
import { CXPackageRow } from "@/hooks/useCustomerExperience";
import { Skeleton } from "@/components/ui/skeleton";
import CXPackageDetailModal from "./CXPackageDetailModal";

interface Props {
  rows: CXPackageRow[];
  loading: boolean;
  userType: "shopper" | "traveler";
  onSave: (row: CXPackageRow, updates: { call_status?: string; rating?: number | null; notes?: string | null; call_date?: string | null; scheduled_date?: string | null; call_time?: string | null }) => Promise<void>;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  scheduled: { label: "Agendado", variant: "outline" },
  contacted: { label: "Contactado", variant: "outline" },
  no_answer: { label: "No contestó", variant: "destructive" },
  completed: { label: "Completado", variant: "default" },
};

export default function CustomerExperienceTable({ rows, loading, userType, onSave }: Props) {
  const [editState, setEditState] = useState<Record<string, Partial<CXPackageRow>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<CXPackageRow | null>(null);

  const getEdit = (pkgId: string) => editState[pkgId] || {};

  const setEdit = (pkgId: string, field: string, value: any) => {
    setEditState((prev) => ({
      ...prev,
      [pkgId]: { ...prev[pkgId], [field]: value },
    }));
  };

  const handleSave = async (row: CXPackageRow) => {
    const edits = getEdit(row.package_id);
    if (Object.keys(edits).length === 0) return;
    setSavingId(row.package_id);
    await onSave(row, {
      call_status: edits.call_status as string | undefined,
      rating: edits.rating !== undefined ? edits.rating : undefined,
      notes: edits.notes !== undefined ? edits.notes : undefined,
      call_date: edits.call_date !== undefined ? edits.call_date : undefined,
      scheduled_date: edits.scheduled_date !== undefined ? edits.scheduled_date : undefined,
      call_time: edits.call_time !== undefined ? (edits.call_time as string | null) : undefined,
    });
    setEditState((prev) => {
      const next = { ...prev };
      delete next[row.package_id];
      return next;
    });
    setSavingId(null);
  };

  const getProductName = (row: CXPackageRow) => {
    if (row.products_data && Array.isArray(row.products_data) && row.products_data.length > 0) {
      return row.products_data[0].name || row.item_description;
    }
    return row.item_description;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay registros para mostrar.</p>;
  }

  return (
    <>
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">Fecha</TableHead>
            <TableHead className="min-w-[120px]">Usuario</TableHead>
            <TableHead className="min-w-[80px]">Pedido</TableHead>
            <TableHead className="min-w-[130px]">Estado</TableHead>
            <TableHead className="min-w-[120px]">Rating</TableHead>
            <TableHead className="min-w-[50px]">Notas</TableHead>
            <TableHead className="min-w-[130px]">Agendar</TableHead>
            <TableHead className="min-w-[100px]">Hora</TableHead>
            <TableHead className="min-w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const edits = getEdit(row.package_id);
            const currentStatus = (edits.call_status as string) ?? row.call_status;
            const currentRating = edits.rating !== undefined ? (edits.rating as number | null) : row.rating;
            const currentNotes = edits.notes !== undefined ? (edits.notes as string | null) : row.notes;
            const currentCallDate = edits.call_date !== undefined ? (edits.call_date as string | null) : row.call_date;
            const currentScheduledDate = edits.scheduled_date !== undefined ? (edits.scheduled_date as string | null) : row.scheduled_date;
            const currentCallTime = edits.call_time !== undefined ? (edits.call_time as string | null) : row.call_time;
            const hasEdits = Object.keys(edits).length > 0;
            const cfg = statusConfig[currentStatus] || statusConfig.pending;
            const scheduledToday = currentScheduledDate && isToday(new Date(currentScheduledDate));
            const scheduledFuture = currentScheduledDate && isFuture(new Date(currentScheduledDate)) && !scheduledToday;

            return (
              <TableRow key={row.package_id} className={cn(scheduledToday && "bg-amber-50 dark:bg-amber-950/20")}>
                <TableCell className="text-sm">
                  {format(new Date(row.completed_at), "dd MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">{row.target_user_name}</span>
                    {row.target_user_phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {row.target_user_phone}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setDetailRow(row)}
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </TableCell>
                <TableCell>
                  <Select
                    value={currentStatus}
                    onValueChange={(v) => setEdit(row.package_id, "call_status", v)}
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <Badge variant={cfg.variant} className="text-xs">
                        {cfg.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <StarRating
                    value={currentRating || 0}
                    onChange={(v) => setEdit(row.package_id, "rating", v)}
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <Popover open={notesOpen === row.package_id} onOpenChange={(open) => setNotesOpen(open ? row.package_id : null)}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                        <MessageSquare className="h-4 w-4" />
                        {(currentNotes) && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
                      <Textarea
                        placeholder="Notas de la llamada..."
                        value={currentNotes || ""}
                        onChange={(e) => setEdit(row.package_id, "notes", e.target.value)}
                        rows={3}
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1", scheduledToday && "border-amber-500 text-amber-700 dark:text-amber-400", scheduledFuture && "border-primary/50 text-primary", !currentScheduledDate && "text-muted-foreground")}>
                        <CalendarClock className="h-3 w-3" />
                        {currentScheduledDate ? format(new Date(currentScheduledDate), "dd/MM/yy") : "Agendar"}
                        {scheduledToday && <span className="ml-1 text-[10px] font-bold">HOY</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={currentScheduledDate ? new Date(currentScheduledDate) : undefined}
                        onSelect={(d) => {
                          setEdit(row.package_id, "scheduled_date", d ? d.toISOString() : null);
                          if (d && currentStatus === "pending") {
                            setEdit(row.package_id, "call_status", "scheduled");
                          }
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-8 text-xs", !currentCallDate && "text-muted-foreground")}>
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {currentCallDate ? format(new Date(currentCallDate), "dd/MM/yy") : "Fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={currentCallDate ? new Date(currentCallDate) : undefined}
                        onSelect={(d) => setEdit(row.package_id, "call_date", d ? d.toISOString() : null)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  {hasEdits && (
                    <Button
                      size="icon"
                      variant="default"
                      className="h-8 w-8"
                      onClick={() => handleSave(row)}
                      disabled={savingId === row.package_id}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>

    <CXPackageDetailModal
      row={detailRow}
      open={!!detailRow}
      onOpenChange={(open) => !open && setDetailRow(null)}
      userType={userType}
    />
    </>
  );
}

