import React, { useState, useRef, useEffect } from "react";
import { Headphones, X, MessageCircle } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

const WHATSAPP_URL = "https://wa.me/50230616015?text=Hola%2C%20necesito%20ayuda%20con%20Favoron";

const SupportBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed right-10 top-1/2 -translate-y-1/2 z-40",
          "w-[320px] max-sm:w-[calc(100vw-48px)] bg-card border border-border rounded-2xl shadow-xl",
          "transition-all duration-200 origin-right",
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
    </>
  );
};

export default SupportBubble;
