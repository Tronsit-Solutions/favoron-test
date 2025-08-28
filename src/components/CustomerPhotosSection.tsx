import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Check, 
  X, 
  Settings, 
  Eye, 
  EyeOff, 
  Heart,
  Users,
  Package
} from 'lucide-react';
import { useCustomerPhotos } from '@/hooks/useCustomerPhotos';
import { AdminPhotoModal } from '@/components/AdminPhotoModal';

interface CustomerPhotosSectionProps {
  isAdmin?: boolean;
}

export const CustomerPhotosSection = ({ isAdmin = false }: CustomerPhotosSectionProps) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { photos, loading, uploadPhoto, updatePhotoStatus, deletePhoto } = useCustomerPhotos(isAdmin);

  const approvedPhotos = photos.filter(photo => photo.status === 'approved');
  const pendingPhotos = photos.filter(photo => photo.status === 'pending');

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="text-center space-y-4">
              <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no approved photos and not admin, don't render the section
  if (approvedPhotos.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-r from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Nuestros Clientes Felices
            </span>
            <Heart className="h-5 w-5 text-destructive" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Favorones Reales
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mira lo que nuestros clientes han logrado traer con la ayuda de nuestros viajeros
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur px-4 py-2 rounded-full border">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{approvedPhotos.length} Favorones Compartidos</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur px-4 py-2 rounded-full border">
              <Users className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">Clientes Satisfechos</span>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Foto
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
              >
                {showAdminPanel ? <EyeOff className="h-4 w-4 mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                {showAdminPanel ? 'Ocultar Panel Admin' : 'Mostrar Panel Admin'}
              </Button>

              {pendingPhotos.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {pendingPhotos.length} Pendientes
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Approved Photos Grid */}
        {approvedPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {approvedPhotos.map((photo) => (
              <Card key={photo.id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-0 relative">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.image_url}
                      alt={photo.product_description}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-semibold text-sm mb-1">
                        {photo.customer_name || 'Cliente Favorón'}
                      </h3>
                      <p className="text-xs opacity-90 line-clamp-2">
                        {photo.product_description}
                      </p>
                    </div>
                  </div>

                  {/* Admin controls overlay */}
                  {isAdmin && showAdminPanel && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePhoto(photo.id, photo.image_url)}
                        className="h-8 w-8 p-0 bg-destructive/80 hover:bg-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Admin Panel for Pending Photos */}
        {isAdmin && showAdminPanel && pendingPhotos.length > 0 && (
          <div className="bg-muted/50 backdrop-blur rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Fotos Pendientes de Aprobación
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pendingPhotos.map((photo) => (
                <Card key={photo.id} className="group overflow-hidden">
                  <CardContent className="p-0 relative">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={photo.image_url}
                        alt={photo.product_description}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-3 space-y-2">
                      <div className="text-sm">
                        <p className="font-medium">{photo.customer_name || 'Anónimo'}</p>
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {photo.product_description}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updatePhotoStatus(photo.id, 'approved')}
                          className="flex-1 h-8 bg-success hover:bg-success/90"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updatePhotoStatus(photo.id, 'rejected')}
                          className="flex-1 h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {approvedPhotos.length === 0 && !isAdmin && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Pronto tendremos fotos de nuestros clientes felices
            </h3>
          </div>
        )}

        {/* Admin Empty State */}
        {approvedPhotos.length === 0 && isAdmin && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay fotos de clientes aún
            </h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando la primera foto de un cliente feliz
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primera Foto
            </Button>
          </div>
        )}
      </div>

      {/* Admin Photo Upload Modal */}
      <AdminPhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={uploadPhoto}
      />
    </section>
  );
};