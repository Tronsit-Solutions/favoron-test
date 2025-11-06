import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';

interface MigrationSummaryProps {
  summary: {
    total_profiles: number;
    already_migrated: number;
    to_update: number;
    errors: number;
  };
  isDryRun: boolean;
}

export default function MigrationSummary({ summary, isDryRun }: MigrationSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Resumen de {isDryRun ? 'Previsualización' : 'Migración'}
          {isDryRun && (
            <Badge variant="outline" className="ml-2">Dry Run</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Perfiles</p>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{summary.total_profiles}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Ya Migrados</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold text-success">{summary.already_migrated}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isDryRun ? 'A Actualizar' : 'Actualizados'}
            </p>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-primary">{summary.to_update}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Errores</p>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{summary.errors}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
