import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOperationsData } from '@/hooks/useOperationsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Tag, ArrowLeft, PackageCheck, LogOut, CheckCircle2, RefreshCw, Loader2, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import OperationsReceptionTab from '@/components/operations/OperationsReceptionTab';
import OperationsLabelsTab from '@/components/operations/OperationsLabelsTab';
import OperationsReadyTab from '@/components/operations/OperationsReadyTab';
import OperationsCompletedTab from '@/components/operations/OperationsCompletedTab';
import OperationsSearchTab from '@/components/operations/OperationsSearchTab';
import OperationsIncidentsTab from '@/components/operations/OperationsIncidentsTab';
import LabelCartBar from '@/components/operations/LabelCartBar';

const Operations = () => {
  const { profile, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('reception');
  
  // Centralized data hook - loads once, used by all tabs
  const operationsData = useOperationsData();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = 'https://favoron.app';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {userRole?.role === 'admin' && (
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">Panel de Operaciones</h1>
                <p className="text-sm text-muted-foreground">
                  Recepción, preparación y etiquetas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Global refresh button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={operationsData.refresh}
                disabled={operationsData.loading}
              >
                {operationsData.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden sm:inline">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {userRole?.role === 'admin' ? 'Admin' : 'Operaciones'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="reception" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Recepción</span>
              {operationsData.receptionPackages.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded">
                  {operationsData.receptionPackages.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Preparación</span>
              {operationsData.readyPackages.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded">
                  {operationsData.readyPackages.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Etiquetas</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Completados</span>
              {operationsData.completedPackages.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 px-1.5 rounded">
                  {operationsData.completedPackages.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Incidencias</span>
              {operationsData.incidentPackages.length > 0 && (
                <span className="ml-1 text-xs bg-destructive/20 text-destructive px-1.5 rounded">
                  {operationsData.incidentPackages.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className={activeTab !== 'reception' ? 'hidden' : ''}>
            <OperationsReceptionTab 
              tripGroups={operationsData.receptionTripGroups}
              loading={operationsData.loading}
              onRefresh={operationsData.refresh}
              onRemovePackage={operationsData.removePackage}
              onRemovePackages={operationsData.removePackages}
              onUpdateIncidentFlag={operationsData.updatePackageIncidentFlag}
              onAddToLabelCart={operationsData.addToLabelCart}
              onAddManyToLabelCart={operationsData.addManyToLabelCart}
            />
          </div>

          <div className={activeTab !== 'ready' ? 'hidden' : ''}>
            <OperationsReadyTab 
              packages={operationsData.readyPackages}
              loading={operationsData.loading}
              onRefresh={operationsData.refresh}
              onRemovePackage={operationsData.removePackage}
            />
          </div>

          <div className={activeTab !== 'labels' ? 'hidden' : ''}>
            <OperationsLabelsTab 
              trips={operationsData.labelsTrips}
              loading={operationsData.loading}
              onRefresh={operationsData.refresh}
              labelHistory={operationsData.labelHistory}
              onRestoreFromHistory={operationsData.restoreFromHistory}
              onDeleteFromHistory={operationsData.deleteFromHistory}
            />
          </div>

          <div className={activeTab !== 'completed' ? 'hidden' : ''}>
            <OperationsCompletedTab 
              packages={operationsData.completedPackages}
              loading={operationsData.loading}
              onRefresh={operationsData.refresh}
              onRemovePackage={operationsData.removePackage}
            />
          </div>

          <div className={activeTab !== 'search' ? 'hidden' : ''}>
            <OperationsSearchTab />
          </div>

          <div className={activeTab !== 'incidents' ? 'hidden' : ''}>
            <OperationsIncidentsTab 
              packages={operationsData.incidentPackages}
              loading={operationsData.loading}
              onRefresh={operationsData.refresh}
              onUpdateIncidentFlag={operationsData.updatePackageIncidentFlag}
            />
          </div>
        </Tabs>
      </main>

      <LabelCartBar
        items={operationsData.labelCart}
        onClear={operationsData.clearLabelCart}
        onRemoveItem={operationsData.removeFromLabelCart}
        labelHistory={operationsData.labelHistory}
        onRestoreFromHistory={operationsData.restoreFromHistory}
        onDeleteFromHistory={operationsData.deleteFromHistory}
      />
    </div>
  );
};

export default Operations;
