import React, { useState, useRef, useEffect } from "react";
import { Headphones, X, MessageCircle, AlertTriangle, ArrowLeft, Send, ImagePlus, Loader2, Bot } from "lucide-react";
import ChatbotView from "@/components/support/ChatbotView";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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

const WHATSAPP_URL = "https://wa.me/message/CPETP3K4EKYXL1";

const EDGE_URL = "https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/log-client-error";

type View = "menu" | "bug-report" | "customer-service" | "chatbot";

const SupportBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        tabRef.current && !tabRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset view when closing
  useEffect(() => {
    if (!isOpen) {
      setView("menu");
      setDescription("");
      setSection("");
      setScreenshot(null);
    }
  }, [isOpen]);

  const handleSubmitBug = async () => {
    if (!description.trim()) return;
    setSubmitting(true);

    try {
      const payload: Record<string, any> = {
        route: window.location.pathname,
        url: window.location.href,
        message: description.trim(),
        name: "UserReport",
        type: "user_report",
        severity: "warning",
        context: {
          section: section.trim() || undefined,
          has_screenshot: !!screenshot,
          screenshot_name: screenshot?.name || undefined,
        },
        browser: {
          ua: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          time: new Date().toISOString(),
        },
      };

      // Try to get auth token
      try {
        const raw = localStorage.getItem("sb-dfhoduirmqbarjnspbdh-auth-token");
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.currentSession?.access_token || parsed?.access_token;
          if (token) {
            await fetch(EDGE_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload),
              keepalive: true,
            });
          } else {
            await fetch(EDGE_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              keepalive: true,
            });
          }
        } else {
          await fetch(EDGE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          });
        }
      } catch {
        // Silently fail on send
      }

      toast({ title: "Reporte enviado", description: "Gracias por reportar este error. Lo revisaremos pronto." });
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = view === "menu" ? "Soporte" : view === "bug-report" ? "Reportar un error" : view === "chatbot" ? "Asistente virtual" : "Servicio al cliente";

  return (
    <>
      {/* Side tab */}
      <button
        ref={tabRef}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "flex flex-col items-center justify-center gap-1",
          "w-8 h-24 rounded-l-lg",
          "bg-primary text-primary-foreground shadow-md",
          "hover:w-10 transition-all duration-200",
          "cursor-pointer"
        )}
        aria-label="Abrir soporte"
      >
        <Headphones className="h-4 w-4" />
        <span className="text-[10px] font-medium writing-vertical-lr" style={{ writingMode: "vertical-lr" }}>
          Soporte
        </span>
      </button>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed z-50 bg-card border border-border shadow-xl",
          "transition-all duration-200",
          // Desktop: floating panel
          "sm:right-10 sm:top-1/2 sm:-translate-y-1/2 sm:w-[320px] sm:h-[480px] sm:max-h-[70vh] sm:rounded-2xl sm:origin-right",
          // Mobile: bottom sheet
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-full max-sm:max-h-[85vh] max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:origin-bottom",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
          "flex flex-col"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {view !== "menu" && (
              <button onClick={() => setView("menu")} className="p-1 rounded-full hover:bg-muted transition-colors" aria-label="Volver">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <Headphones className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">{headerTitle}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Cerrar soporte"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Menu view */}
        {view === "menu" && (
          <div className="p-4 space-y-3 overflow-y-auto max-sm:max-h-[calc(85vh-57px)]">
            <p className="text-xs text-muted-foreground mb-1">¿En qué podemos ayudarte?</p>
            <button
              onClick={() => setView("chatbot")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/50 text-accent-foreground shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Asistente virtual</p>
                <p className="text-xs text-muted-foreground">Te guío paso a paso</p>
              </div>
            </button>
            <button
              onClick={() => setView("bug-report")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Reportar un error</p>
                <p className="text-xs text-muted-foreground">Algo no funciona como debería</p>
              </div>
            </button>
            <button
              onClick={() => setView("customer-service")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Servicio al cliente</p>
                <p className="text-xs text-muted-foreground">Preguntas frecuentes y WhatsApp</p>
              </div>
            </button>
          </div>
        )}

        {/* Bug report view */}
        {view === "bug-report" && (
          <div className="p-4 space-y-4 overflow-y-auto max-sm:max-h-[calc(85vh-57px)]">
            <div className="space-y-2">
              <Label htmlFor="bug-desc" className="text-xs">Descripción del error *</Label>
              <Textarea
                id="bug-desc"
                placeholder="Describe qué pasó y qué esperabas que ocurriera..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[80px] text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-section" className="text-xs">Página / sección (opcional)</Label>
              <Input
                id="bug-section"
                placeholder="Ej: Dashboard, Cotización..."
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-screenshot" className="text-xs">Captura de pantalla (opcional)</Label>
              <label
                htmlFor="bug-screenshot"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border cursor-pointer text-xs text-muted-foreground hover:bg-muted/50 transition-colors",
                  screenshot && "border-primary/50 text-foreground"
                )}
              >
                <ImagePlus className="h-4 w-4 shrink-0" />
                <span className="truncate">{screenshot ? screenshot.name : "Adjuntar imagen"}</span>
              </label>
              <input
                id="bug-screenshot"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleSubmitBug}
              disabled={!description.trim() || submitting}
              className="w-full"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar reporte
            </Button>
          </div>
        )}

        {/* Chatbot view */}
        {view === "chatbot" && <ChatbotView />}

        {/* Customer service view */}
        {view === "customer-service" && (
          <div className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-3">Preguntas frecuentes</p>
                <Accordion type="single" collapsible className="space-y-0">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-b-0 border-t border-border first:border-t-0">
                      <AccordionTrigger className="text-sm py-3 hover:no-underline text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border shrink-0">
              <a
                href="https://wa.me/50230616015"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-md bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 text-sm font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                +502 3061-6015
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SupportBubble;
