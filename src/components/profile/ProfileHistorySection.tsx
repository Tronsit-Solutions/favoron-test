import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PackageHistory from "./PackageHistory";
import TripHistory from "./TripHistory";

interface ProfileHistorySectionProps {
  packages: any[];
  trips: any[];
  onBack: () => void;
}

const ProfileHistorySection = ({ packages, trips, onBack }: ProfileHistorySectionProps) => {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Volver al perfil
      </Button>

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages">Pedidos</TabsTrigger>
          <TabsTrigger value="trips">Viajes</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          <PackageHistory packages={packages} trips={trips} />
        </TabsContent>

        <TabsContent value="trips">
          <TripHistory trips={trips} packages={packages} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileHistorySection;
