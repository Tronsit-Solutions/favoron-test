import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface MigrationTableProps {
  updates: Array<{
    user_id: string;
    original_phone: string;
    new_country_code: string;
    new_phone_number: string;
    status?: string;
  }>;
}

export default function MigrationTable({ updates }: MigrationTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          Cambios Propuestos
          <Badge variant="secondary" className="ml-2">
            {updates.length} {updates.length === 50 ? '(mostrando primeros 50)' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">User ID</TableHead>
                <TableHead>Teléfono Original</TableHead>
                <TableHead className="text-center">
                  <ArrowRight className="h-4 w-4 inline" />
                </TableHead>
                <TableHead>Código País</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.map((update, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">
                    {update.user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono">{update.original_phone}</TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{update.new_country_code}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{update.new_phone_number}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="bg-success">
                      {update.status || 'Success'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {updates.length === 50 && (
          <p className="text-sm text-muted-foreground mt-3">
            Mostrando los primeros 50 cambios. La migración procesará todos los perfiles que lo necesiten.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
