import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import MigrationSummary from './MigrationSummary';
import MigrationTable from './MigrationTable';
import ErrorsTable from './ErrorsTable';

type MigrationStatus = 'idle' | 'running-dry' | 'dry-complete' | 'running-real' | 'complete';

interface MigrationResult {
  success: boolean;
  dry_run: boolean;
  summary: {
    total_profiles: number;
    already_migrated: number;
    to_update: number;
    errors: number;
  };
  updates: Array<{
    user_id: string;
    original_phone: string;
    new_country_code: string;
    new_phone_number: string;
    status?: string;
  }>;
  errors: Array<{
    user_id: string;
    original_phone: string;
    error: string;
  }>;
}

interface PreMigrationStats {
  total_with_phone: number;
  sin_country_code: number;
  con_signo_mas: number;
}

export default function PhoneMigrationPanel() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>('idle');
  const [results, setResults] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preStats, setPreStats] = useState<PreMigrationStats | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchPreMigrationStats();
  }, []);

  const fetchPreMigrationStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('admin_view_all_users' as any)
        .select('phone_number, country_code');
      
      if (error) throw error;

      const stats = data.reduce((acc: PreMigrationStats, user: any) => {
        if (user.phone_number) {
          acc.total_with_phone++;
          if (!user.country_code) acc.sin_country_code++;
          if (user.phone_number.includes('+')) acc.con_signo_mas++;
        }
        return acc;
      }, { total_with_phone: 0, sin_country_code: 0, con_signo_mas: 0 });

      setPreStats(stats);
    } catch (err) {
      console.error('Error fetching pre-migration stats:', err);
    }
  };

  const handleDryRun = async () => {
    setMigrationStatus('running-dry');
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('migrate-phone-numbers', {
        body: { dry_run: true }
      });

      if (error) throw error;

      setResults(data as MigrationResult);
      setMigrationStatus('dry-complete');
      toast.success('Previsualización completada. Revisa los cambios propuestos.');
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar dry-run');
      setMigrationStatus('idle');
      toast.error('Error al previsualizar cambios');
      console.error('Dry-run error:', err);
    }
  };

  const handleRealMigration = async () => {
    setShowConfirmDialog(false);
    setMigrationStatus('running-real');
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('migrate-phone-numbers', {
        body: { dry_run: false }
      });

      if (error) throw error;

      setResults(data as MigrationResult);
      setMigrationStatus('complete');
      toast.success('Migración completada exitosamente');
      
      // Refresh pre-migration stats
      await fetchPreMigrationStats();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar migración');
      setMigrationStatus('dry-complete');
      toast.error('Error al ejecutar migración');
      console.error('Migration error:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migración de Números de Teléfono</CardTitle>
        <CardDescription>
          Separar country_code de phone_number en perfiles existentes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Warning Banner */}
        <div className="bg-warning/10 border border-warning rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-warning">⚠️ ADVERTENCIA</p>
              <p className="text-muted-foreground">
                Esta migración modificará los datos de phone_number y country_code en la tabla profiles. 
                Los cambios son permanentes.
              </p>
              <p className="text-muted-foreground">
                ✅ <strong>Recomendación:</strong> Ejecutar primero el Dry Run para revisar los cambios 
                propuestos antes de aplicar la migración real.
              </p>
            </div>
          </div>
        </div>

        {/* Pre-Migration Statistics */}
        {preStats && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total con teléfono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{preStats.total_with_phone}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sin country_code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{preStats.sin_country_code}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Con signo "+"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{preStats.con_signo_mas}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleDryRun}
            disabled={migrationStatus === 'running-dry' || migrationStatus === 'running-real'}
            variant="outline"
            size="lg"
          >
            {migrationStatus === 'running-dry' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Previsualizar Cambios (Dry Run)
              </>
            )}
          </Button>
          
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={migrationStatus !== 'dry-complete'}
            variant="destructive"
            size="lg"
          >
            {migrationStatus === 'running-real' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ejecutando migración...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ejecutar Migración Real
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            <MigrationSummary summary={results.summary} isDryRun={results.dry_run} />
            
            {results.updates.length > 0 && (
              <MigrationTable updates={results.updates.slice(0, 50)} />
            )}
            
            {results.errors.length > 0 && (
              <ErrorsTable errors={results.errors} />
            )}

            {migrationStatus === 'complete' && (
              <div className="bg-success/10 border border-success rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="font-medium text-success">✅ Migración completada exitosamente</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Ejecutar migración real?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción modificará permanentemente {results?.summary.to_update || 0} perfiles en la base de datos.
                Los cambios no se pueden revertir automáticamente.
                
                <div className="mt-4 p-3 bg-warning/10 border border-warning rounded">
                  <p className="text-sm font-medium text-warning">
                    ⚠️ Asegúrate de haber revisado los cambios propuestos en el Dry Run.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRealMigration} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirmar y Ejecutar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
