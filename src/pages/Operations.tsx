import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Tag, Truck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import OperationsReceptionTab from '@/components/operations/OperationsReceptionTab';
import OperationsLabelsTab from '@/components/operations/OperationsLabelsTab';
import OperationsLastMileTab from '@/components/operations/OperationsLastMileTab';

const Operations = () => {
  const { profile, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('reception');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Panel de Operaciones</h1>
                <p className="text-sm text-muted-foreground">
                  Recepción, etiquetas y última milla
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {profile?.first_name} {profile?.last_name}
              <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                {userRole?.role === 'admin' ? 'Admin' : 'Operaciones'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="reception" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Recepción</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Etiquetas</span>
            </TabsTrigger>
            <TabsTrigger value="lastmile" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Última Milla</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reception">
            <OperationsReceptionTab />
          </TabsContent>

          <TabsContent value="labels">
            <OperationsLabelsTab />
          </TabsContent>

          <TabsContent value="lastmile">
            <OperationsLastMileTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Operations;
