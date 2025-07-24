import { Button } from "@/components/ui/button";
interface CTASectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}
const CTASection = ({
  onOpenAuth
}: CTASectionProps) => {
  return <section className="container mx-auto px-4 py-16 text-center">
      <h3 className="text-3xl font-bold mb-6">¿Listo para comenzar?</h3>
      <p className="text-xl text-gray-600 mb-8">
        Únete a nuestra comunidad y comienza a enviar o traer paquetes hoy mismo
      </p>
      <Button size="lg" onClick={() => onOpenAuth("register")} className="text-lg px-8 py-3">
        Crear Cuenta Gratis
      </Button>
      
      <div className="mt-8 text-sm text-gray-500">
        
      </div>
    </section>;
};
export default CTASection;