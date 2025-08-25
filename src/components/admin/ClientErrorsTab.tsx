import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCcw, Search } from "lucide-react";

interface ClientErrorRow {
  id: string;
  created_at: string;
  message: string;
  name?: string | null;
  type?: string | null;
  severity?: string | null;
  route?: string | null;
  url?: string | null;
  referrer?: string | null;
  stack?: string | null;
  user_id?: string | null;
  browser?: any | null;
  context?: any | null;
}

const severityColor = (s?: string | null) => {
  switch ((s || '').toLowerCase()) {
    case 'fatal':
    case 'error': return 'destructive';
    case 'warning': return 'warning';
    case 'info':
    default: return 'secondary';
  }
};

const formatDate = (iso: string) => new Date(iso).toLocaleString('es-GT');

const ClientErrorsTab = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ClientErrorRow[]>([]);
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [severity, setSeverity] = useState<string>("");

  const fetchErrors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('client_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      const { data, error } = await query;
      if (error) throw error;
      setErrors((data || []) as any);
    } catch (e) {
      console.error('Failed to fetch client errors', e);
      setErrors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const filtered = useMemo(() => {
    return errors.filter(e => {
      const matchesSearch = search
        ? (e.message?.toLowerCase().includes(search.toLowerCase()) ||
           e.stack?.toLowerCase().includes(search.toLowerCase()) ||
           e.route?.toLowerCase().includes(search.toLowerCase()))
        : true;
      const matchesRoute = routeFilter ? (e.route || '').includes(routeFilter) : true;
      const matchesSeverity = severity ? (e.severity || '').toLowerCase() === severity.toLowerCase() : true;
      return matchesSearch && matchesRoute && matchesSeverity;
    });
  }, [errors, search, routeFilter, severity]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl">Errores del cliente</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por mensaje, ruta o stack"
                className="pl-9"
              />
            </div>
            <Input
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              placeholder="Filtrar por ruta (ej. /checkout)"
            />
            <Input
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              placeholder="Severidad (error, warning, info)"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filtered.length} de {errors.length} registros
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Fecha</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Navegador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> Cargando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No hay errores que coincidan con tu búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => {
                    const ua = typeof e.browser === 'object' && e.browser?.userAgent ? String(e.browser.userAgent) : '';
                    const shortMsg = e.message?.slice(0, 120) || '';
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="align-top whitespace-nowrap">{formatDate(e.created_at)}</TableCell>
                        <TableCell className="align-top">
                          <div className="font-medium">{shortMsg}{e.message && e.message.length > 120 ? '…' : ''}</div>
                          {e.stack && (
                            <pre className="mt-1 text-xs max-h-28 overflow-auto whitespace-pre-wrap text-muted-foreground">
                              {e.stack}
                            </pre>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div>{e.route || '-'}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[240px]">{e.url || ''}</div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge variant={severityColor(e.severity)}>{e.severity || 'info'}</Badge>
                        </TableCell>
                        <TableCell className="align-top text-xs">
                          {e.user_id ? (
                            <span className="font-mono">{e.user_id.slice(0,8)}…</span>
                          ) : (
                            <span className="text-muted-foreground">anónimo</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-xs">
                          {ua ? ua.slice(0,80) + (ua.length > 80 ? '…' : '') : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientErrorsTab;
