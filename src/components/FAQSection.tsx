import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "¿Cómo funciona Favoron?",
    answer: "Favoron conecta compradores con viajeros. Tú haces tu pedido de productos en EE.UU., un viajero los trae en su maleta y te los entregamos en Guatemala. Es simple, seguro y personal.",
  },
  {
    question: "¿Cuánto cuesta el servicio?",
    answer: "Cobramos una comisión de servicio sobre el valor de tus productos. Al solicitar tu pedido recibirás una cotización detallada con el precio total antes de confirmar. Sin sorpresas.",
  },
  {
    question: "¿Cuánto tarda mi pedido?",
    answer: "Depende de la disponibilidad de viajeros. Normalmente entre 1 y 3 semanas desde que se confirma tu pedido hasta la entrega.",
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
    answer: "Puedes solicitar la mayoría de productos disponibles en tiendas de EE.UU.: electrónica, ropa, zapatos, cosméticos, suplementos, accesorios y más. Hay restricciones para productos regulados, líquidos peligrosos y artículos prohibidos por aduanas.",
  },
];

const FAQSection = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/40 to-white" />
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Preguntas Frecuentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Resuelve tus dudas antes de empezar
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border/60 rounded-xl px-5 bg-card/60 backdrop-blur-sm shadow-sm data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-base font-medium hover:no-underline text-left py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
