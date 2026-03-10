import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Mail, Phone, Briefcase, Users, Loader2 } from "lucide-react";
import { resolveSignedUrl } from "@/lib/storageUrls";

interface ApplicationDetailModalProps {
  application: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    interest_type: string;
    message: string | null;
    resume_url: string | null;
    resume_filename: string | null;
    status: string;
    admin_notes: string | null;
    created_at: string;
  };
  onClose: () => void;
  onUpdate: () => void;
}

const ApplicationDetailModal = ({ application, onClose, onUpdate }: ApplicationDetailModalProps) => {
  const [status, setStatus] = useState(application.status);
  const [adminNotes, setAdminNotes] = useState(application.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("job_applications")
      .update({ status, admin_notes: adminNotes || null, updated_at: new Date().toISOString() } as any)
      .eq("id", application.id);
    setSaving(false);
    if (error) {
      toast.error("Error al guardar cambios");
    } else {
      toast.success("Aplicación actualizada");
      onUpdate();
    }
  };

  const handleDownload = async () => {
    if (!application.resume_url) return;
    setDownloading(true);
    try {
      const url = await resolveSignedUrl(application.resume_url);
      if (url) window.open(url, "_blank");
    } catch {
      toast.error("Error al descargar archivo");
    }
    setDownloading(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {application.interest_type === "talent" ? <Briefcase className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
            {application.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${application.email}`} className="text-primary hover:underline">{application.email}</a>
            </div>
            {application.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{application.phone}</span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">
              {application.interest_type === "talent" ? "Talento" : "Colaborador"}
            </Badge>
            <Badge variant="secondary">
              {format(new Date(application.created_at), "dd MMM yyyy HH:mm", { locale: es })}
            </Badge>
          </div>

          {/* Message */}
          {application.message && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mensaje</Label>
              <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{application.message}</p>
            </div>
          )}

          {/* Resume */}
          {application.resume_url && (
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              {application.resume_filename || "Descargar archivo"}
            </Button>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="reviewed">Revisado</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notas del equipo sobre este candidato..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailModal;
