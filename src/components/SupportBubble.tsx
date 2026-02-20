import React, { useState, useRef, useEffect } from "react";
import { Headphones, X, MessageCircle } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "¿Cómo funciona Favoron?",
    answer: "Favoron conecta compradores con viajeros. Tú haces tu pedido de productos en EE.UU., un viajero los trae en su maleta y te los entregamos en Guatemala.",
  },
  {
    question: "¿Cuánto cuesta el servicio?",
    answer: "Cobramos una comisión de servicio sobre el valor de tus productos. Al solicitar tu pedido recibirás una cotización detallada con el precio total antes de confirmar.",
  },
  {
    question: "¿Cuánto tarda mi pedido?",
    answer: "Depende de la disponibilidad de viajeros. Normalmente entre 1 y 3 semanas desde que se confirma tu pedido hasta la entrega.",
  },
  {
    question: "¿Cómo me registro como viajero?",
    answer: "Crea tu cuenta, completa tu perfil y registra un viaje desde tu dashboard. Nuestro equipo lo revisará y te asignará paquetes para transportar.",
  },
  {
    question: "¿Qué pasa si mi pedido se daña?",
    answer: "Contamos con un proceso de verificación y protección. Si tu producto llega dañado, contáctanos por WhatsApp y revisaremos tu caso para darte una solución.",
  },
];

const WHATSAPP_URL = "https://wa.me/50230616015?text=Hola%2C%20necesito%20ayuda%20con%20Favoron";

const SupportBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        bubbleRef.current && !bubbleRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "w-[320px] max-sm:w-[calc(100vw-32px)] max-sm:right-0 bg-card border border-border rounded-2xl shadow-xl transition-all duration-200 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Soporte</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Cerrar soporte"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* FAQ */}
        <ScrollArea className="max-h-[300px]">
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

        {/* WhatsApp CTA */}
        <div className="p-4 border-t border-border">
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Escríbenos por WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {/* Floating bubble */}
      <button
        ref={bubbleRef}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105",
          isOpen && "rotate-0"
        )}
        aria-label="Abrir soporte"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default SupportBubble;
