import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, CheckCircle, Briefcase, Users, Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  full_name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  interest_type: z.enum(["talent", "collaborator"]),
  message: z.string().trim().max(2000, "Máximo 2000 caracteres").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

const WorkWithUs = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interest_type: "talent",
    },
  });

  const interestType = watch("interest_type");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("El archivo no puede superar 10MB");
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      toast.error("Solo se aceptan archivos PDF, JPG, PNG o WebP");
      return;
    }
    setFile(selected);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      let resume_url: string | null = null;
      let resume_filename: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("job-applications")
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        resume_url = `job-applications/${filePath}`;
        resume_filename = file.name;
      }

      const { error } = await supabase.from("job_applications").insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        interest_type: data.interest_type,
        message: data.message || null,
        resume_url,
        resume_filename,
      } as any);

      if (error) throw error;
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Error submitting application:", err);
      toast.error("Error al enviar. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Link to="/"><img src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" alt="Favorón" className="h-8 sm:h-10 w-auto" /></Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-success mx-auto" />
              <h2 className="text-2xl font-bold">¡Aplicación enviada!</h2>
              <p className="text-muted-foreground">
                Gracias por tu interés en Favorón. Revisaremos tu información y te contactaremos pronto.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link to="/"><img src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" alt="Favorón" className="h-8 sm:h-10 w-auto" /></Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Trabaja con nosotros</h1>
          <p className="text-muted-foreground text-lg">
            ¿Quieres ser parte del equipo Favorón o colaborar con nosotros? Cuéntanos sobre ti.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tu información</CardTitle>
            <CardDescription>Completa el formulario y adjunta tu CV si lo deseas.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Interest Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">¿Qué te interesa?</Label>
                <RadioGroup
                  value={interestType}
                  onValueChange={(v) => setValue("interest_type", v as "talent" | "collaborator")}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <label
                    htmlFor="talent"
                    className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      interestType === "talent" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="talent" id="talent" />
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Trabajar en Favorón</p>
                      <p className="text-xs text-muted-foreground">Únete a nuestro equipo</p>
                    </div>
                  </label>
                  <label
                    htmlFor="collaborator"
                    className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                      interestType === "collaborator" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="collaborator" id="collaborator" />
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Colaborar</p>
                      <p className="text-xs text-muted-foreground">Alianzas y proyectos</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo *</Label>
                <Input id="full_name" {...register("full_name")} placeholder="Tu nombre completo" />
                {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="tu@email.com" />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input id="phone" {...register("phone")} placeholder="+502 1234 5678" />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Cuéntanos sobre ti (opcional)</Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  placeholder="¿Por qué te interesa trabajar o colaborar con Favorón?"
                  rows={4}
                />
                {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>CV o documento (opcional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    {file ? (
                      <p className="text-sm font-medium text-primary">{file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Arrastra o haz clic para subir</p>
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG — Máx. 10MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar aplicación"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default WorkWithUs;
