import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ErrorsTableProps {
  errors: Array<{
    user_id: string;
    original_phone: string;
    error: string;
  }>;
}

export default function ErrorsTable({ errors }: ErrorsTableProps) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Errores Encontrados
          <Badge variant="destructive" className="ml-2">{errors.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-destructive rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User ID</TableHead>
                <TableHead>Teléfono Original</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">
                    {error.user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono">{error.original_phone}</TableCell>
                  <TableCell>
                    <span className="text-sm text-destructive">{error.error}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <p className="text-sm text-muted-foreground mt-3">
          Estos perfiles requieren revisión manual. Los números no pudieron parsearse automáticamente.
        </p>
      </CardContent>
    </Card>
  );
}
