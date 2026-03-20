import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isProfileComplete } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PersonalInfoForm from "@/components/profile/PersonalInfoForm";
import { Progress } from "@/components/ui/progress";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSimulation = searchParams.get("simulate") === "true";
  const { user, profile, loading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    countryCode: "+502",
    idNumber: "",
    avatarUrl: null as string | null,
  });
  const [saving, setSaving] = useState(false);

  // Pre-fill from profile (clear phone/doc in simulation mode)
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        username: profile.username || "",
        phoneNumber: isSimulation ? "" : (profile.phone_number || ""),
        countryCode: profile.country_code || "+502",
        idNumber: "",
        avatarUrl: profile.avatar_url || null,
      });
    }
  }, [profile, isSimulation]);

  // If profile is already complete and NOT simulating, redirect to dashboard
  useEffect(() => {
    if (!isSimulation && profile && isProfileComplete(profile)) {
      navigate("/dashboard", { replace: true });
    }
  }, [profile, navigate, isSimulation]);

  const filledCount = [formData.firstName, formData.lastName, formData.phoneNumber].filter(
    (v) => v && v.trim().length > 0
  ).length;
  const progress = Math.round((filledCount / 3) * 100);

  const handleSave = async () => {
    if (!user) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("El número de WhatsApp es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          username: formData.username.trim() || null,
          phone_number: formData.phoneNumber.trim(),
          country_code: formData.countryCode,
          document_number: formData.idNumber.trim() || null,
          avatar_url: formData.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("¡Perfil completado exitosamente!");
      // Small delay so profile refreshes before redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast.error("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background py-4 px-6">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img
            src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png"
            alt="Favorón Logo"
            className="h-7 w-auto"
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Completa tu perfil
            </h1>
            <p className="text-muted-foreground text-sm">
              Necesitamos algunos datos antes de que puedas usar la plataforma.
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Form */}
          <div className="border rounded-lg p-6 bg-card space-y-4">
            <PersonalInfoForm
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              showSaveButton={false}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando..." : "Continuar al Dashboard"}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Los campos de nombre, apellido y WhatsApp son obligatorios.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CompleteProfile;
