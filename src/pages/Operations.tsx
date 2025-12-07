import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Tag, ArrowLeft, PackageCheck, LogOut } from 'lucide-react';
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

const Operations = () => {
  const { profile, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('reception');

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
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="reception" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Recepción</span>
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Preparación</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Etiquetas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reception">
            {activeTab === 'reception' && <OperationsReceptionTab />}
          </TabsContent>

          <TabsContent value="ready">
            {activeTab === 'ready' && <OperationsReadyTab />}
          </TabsContent>

          <TabsContent value="labels">
            {activeTab === 'labels' && <OperationsLabelsTab />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Operations;
