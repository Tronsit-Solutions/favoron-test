import React, { useState } from "react";
import { ArrowLeft, MessageCircle, AlertTriangle, Send, ImagePlus, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const WHATSAPP_NUMBER = "30616015";
const WHATSAPP_URL = `https://wa.me/50230616015?text=Hola%2C%20necesito%20ayuda%20con%20Favoron`;
const EDGE_URL = "https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/log-client-error";

const faqs = [
  {
    question: "¿Cómo funciona Favoron?",
    answer: "Favoron conecta shoppers con viajeros. Tú haces tu pedido de productos de cualquier parte del mundo, un viajero los trae en su maleta y te los entregamos en Guatemala. Es simple, seguro y personal.",
  },
  {
    question: "¿Cuánto cuesta el servicio?",
    answer: "El costo depende del tamaño, precio, peso y disponibilidad de viajeros. Al solicitar tu pedido recibirás una cotización detallada con el precio total antes de confirmar. Sin sorpresas.",
  },
  {
    question: "¿Cuánto tarda mi pedido?",
    answer: "Depende de la disponibilidad de viajeros. Normalmente entre 1 y 3 semanas desde que se confirma tu pedido hasta la entrega. Aunque también puede ser menos si la tienda entrega rápido.",
  },
  {
    question: "¿Cómo me registro como viajero?",
    answer: "Crea tu cuenta, completa tu perfil y registra un viaje desde tu dashboard. Nuestro equipo lo revisará y te asignará paquetes para transportar. ¡Gana dinero extra mientras viajas!",
  },
  {
    question: "¿Qué pasa si mi pedido se daña?",
    answer: "Contamos con un proceso de verificación y protección. Si tu producto llega dañado, contáctanos por WhatsApp y revisaremos tu caso para darte una solución.",
  },
  {
    question: "¿Es seguro usar Favoron?",
    answer: "Sí. Verificamos a todos los viajeros, hacemos seguimiento de cada paquete y contamos con un proceso de confirmación en cada etapa. Tu pedido está protegido de principio a fin.",
  },
  {
    question: "¿Qué productos puedo enviar?",
    answer: "Puedes solicitar la mayoría de productos disponibles en tiendas alrededor del mundo: electrónica, ropa, zapatos, cosméticos, suplementos, accesorios y más. Los productos deben caber en la maleta de un viajero. Hay restricciones para productos regulados, líquidos peligrosos y artículos prohibidos por aduanas.",
  },
];

const REPORT_CATEGORIES = [
  { value: "bug", label: "Bug / Error técnico" },
  { value: "incident", label: "Incidencia con pedido" },
  { value: "complaint", label: "Queja" },
  { value: "suggestion", label: "Sugerencia" },
];

interface ProfileHelpSectionProps {
  onBack: () => void;
}

const ProfileHelpSection: React.FC<ProfileHelpSectionProps> = ({ onBack }) => {
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("");
  const [category, setCategory] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!description.trim() || !category) return;
    setSubmitting(true);

    try {
      const payload: Record<string, any> = {
        route: window.location.pathname,
        url: window.location.href,
        message: description.trim(),
        name: "UserReport",
        type: "user_report",
        severity: category === "bug" ? "error" : "warning",
        context: {
          category,
          section: section.trim() || undefined,
          has_screenshot: !!screenshot,
          screenshot_name: screenshot?.name || undefined,
          source: "profile_help_section",
        },
        browser: {
          ua: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          time: new Date().toISOString(),
        },
      };

      try {
        const raw = localStorage.getItem("sb-dfhoduirmqbarjnspbdh-auth-token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.currentSession?.access_token || parsed?.access_token;
          if (token) headers.Authorization = `Bearer ${token}`;
        }
        await fetch(EDGE_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch {
        // Silently fail
      }

      toast({ title: "Reporte enviado", description: "Gracias por tu reporte. Lo revisaremos pronto." });
      setDescription("");
      setSection("");
      setCategory("");
      setScreenshot(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-140px)]">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Button>

        <h2 className="text-lg font-semibold">Centro de Ayuda</h2>

        {/* Report Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reportar un problema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Tipo de reporte *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Descripción *</Label>
              <Textarea
                placeholder="Describe qué pasó y qué esperabas que ocurriera..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Página / sección (opcional)</Label>
              <Input
                placeholder="Ej: Dashboard, Cotización..."
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Captura de pantalla (opcional)</Label>
              <label
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer text-xs text-muted-foreground hover:bg-muted/50 transition-colors",
                  screenshot && "border-primary/50 text-foreground"
                )}
              >
                <ImagePlus className="h-4 w-4 shrink-0" />
                <span className="truncate">{screenshot ? screenshot.name : "Adjuntar imagen"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <Button
              onClick={handleSubmitReport}
              disabled={!description.trim() || !category || submitting}
              className="w-full"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar reporte
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp Support */}
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Soporte por WhatsApp</p>
              <p className="text-xs text-muted-foreground">{WHATSAPP_NUMBER}</p>
            </div>
            <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Escribir
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preguntas Frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default ProfileHelpSection;
