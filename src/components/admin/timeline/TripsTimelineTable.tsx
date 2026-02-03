import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Package, Phone, Plane } from 'lucide-react';
import { ActivityItem } from '@/hooks/useActivityTimeline';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface TripsTimelineTableProps {
  activities: ActivityItem[];
  isLoading: boolean;
  visibleCount: number;
  onLoadMore: () => void;
}

const formatWhatsAppLink = (phone: string | null) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/${cleaned}`;
};

const getChannelBadge = (channel: string | null) => {
  switch (channel) {
    case 'tiktok':
      return <Badge className="bg-pink-500/10 text-pink-600 border-pink-200 hover:bg-pink-500/20">TikTok</Badge>;
    case 'instagram_facebook_ads':
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">Meta</Badge>;
    case 'reels':
      return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20">Reels</Badge>;
    case 'friend_referral':
      return <Badge className="bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20">Referidos</Badge>;
    case 'other':
      return <Badge variant="secondary">Otro</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">Sin respuesta</Badge>;
  }
};

const getBadgeVariant = (color: ActivityItem['statusColor']): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (color) {
    case 'success': return 'success';
    case 'warning': return 'warning';
    case 'destructive': return 'destructive';
    case 'default': return 'default';
    default: return 'secondary';
  }
};

export function TripsTimelineTable({ activities, isLoading, visibleCount, onLoadMore }: TripsTimelineTableProps) {
  const visibleActivities = activities.slice(0, visibleCount);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Usuario</TableHead>
            <TableHead className="w-[120px]">WhatsApp</TableHead>
            <TableHead className="w-[100px]">Canal</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead className="w-[100px]">Llegada</TableHead>
            <TableHead className="w-[100px]">Creado</TableHead>
            <TableHead className="w-[140px]">Estado</TableHead>
            <TableHead className="w-[120px]">Paquetes</TableHead>
            <TableHead className="w-[200px]">Detalle Paquetes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              </TableRow>
            ))
          ) : visibleActivities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                No se encontraron viajes con los filtros seleccionados
              </TableCell>
            </TableRow>
          ) : (
            visibleActivities.map((item) => {
              const whatsappLink = formatWhatsAppLink(item.userPhone);
              return (
                <TableRow key={`trip-${item.id}`}>
                  <TableCell>
                    <div className="font-medium text-sm">{item.userName}</div>
                    {item.userEmail && (
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {item.userEmail}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {whatsappLink ? (
                      <a 
                        href={whatsappLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {item.userPhone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getChannelBadge(item.acquisitionChannel)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Plane className="h-3 w-3 text-muted-foreground" />
                      {item.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.arrivalDate ? (
                      <span className="text-sm">
                        {format(new Date(item.arrivalDate), 'dd MMM yy', { locale: es })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.createdAt), 'dd MMM yy', { locale: es })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(item.statusColor)}>
                      {item.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div>{item.confirmedPackages || 0} confirmados</div>
                      <div>{item.completedPackages || 0} completados</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.confirmedPackageDescriptions && item.confirmedPackageDescriptions.length > 0 ? (
                      <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                        {item.confirmedPackageDescriptions.map((desc, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{desc}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin paquetes</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {visibleActivities.length < activities.length && (
        <div className="p-4 text-center border-t">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
          >
            Cargar más ({activities.length - visibleActivities.length} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
