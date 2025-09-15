import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { 
  Plus, 
  Check, 
  X, 
  Settings, 
  Eye, 
  EyeOff, 
  Package,
  Trash2
} from 'lucide-react';
import { useCustomerPhotos } from '@/hooks/useCustomerPhotos';
import { AdminPhotoModal } from '@/components/AdminPhotoModal';
import { anonymizeCustomerName, sanitizeProductDescription, isPhotoSafeForPublicDisplay } from '@/lib/privacy';
import Autoplay from "embla-carousel-autoplay";

interface CustomerPhotosSectionProps {
  isAdmin?: boolean;
}

export const CustomerPhotosSection = ({ isAdmin = false }: CustomerPhotosSectionProps) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Standard loading - no defer for now to fix TypeScript error
  const { photos, loading, uploadPhoto, updatePhotoStatus, deletePhoto } = useCustomerPhotos(isAdmin);

  const approvedPhotos = photos.filter(photo => photo.status === 'approved');
  const pendingPhotos = photos.filter(photo => photo.status === 'pending');

  const handleDeletePhoto = async (photoId: string, imageUrl: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta foto? Esta acción no se puede deshacer.')) {
      await deletePhoto(photoId, imageUrl);
    }
  };

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-muted rounded w-32"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
            <div className="aspect-[4/3] bg-muted rounded-lg max-w-xl mx-auto"></div>
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
    <section className="py-8">
      <div className="container mx-auto px-4">
        {isAdmin ? (
          <>
            {/* Compact Admin Dashboard */}
            <div className="mb-6">
              {/* Compact Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Fotos de Clientes</h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{approvedPhotos.length} Aprobadas</span>
                      {pendingPhotos.length > 0 && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          {pendingPhotos.length} Pendientes
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsModalOpen(true)}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                  
                  {pendingPhotos.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAdminPanel(!showAdminPanel)}
                      className="h-8"
                    >
                      {showAdminPanel ? <EyeOff className="h-3 w-3 mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                      {showAdminPanel ? 'Ocultar' : 'Gestionar'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Pending Photos - Always Show if Exist */}
              {pendingPhotos.length > 0 && (
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        {pendingPhotos.length} foto{pendingPhotos.length !== 1 ? 's' : ''} esperando aprobación
                      </span>
                    </div>
                    {!showAdminPanel && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setShowAdminPanel(true)}
                        className="h-6 text-xs text-amber-700 dark:text-amber-300"
                      >
                        Revisar →
                      </Button>
                    )}
                  </div>
                  
                  {showAdminPanel && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {pendingPhotos.map((photo) => (
                        <Card key={photo.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={photo.image_url}
                                alt={photo.product_description}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            <div className="p-2 space-y-2">
                              <div className="text-xs">
                                <p className="font-medium truncate">{photo.customer_name || 'Anónimo'}</p>
                                <p className="text-muted-foreground line-clamp-1">
                                  {photo.product_description}
                                </p>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => updatePhotoStatus(photo.id, 'approved')}
                                  className="flex-1 h-6 text-xs bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updatePhotoStatus(photo.id, 'rejected')}
                                  className="flex-1 h-6 text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact Approved Photos Carousel */}
            {approvedPhotos.length > 0 && (
              <div className="mb-6 max-w-xl mx-auto">
                <Carousel
                  plugins={[
                    Autoplay({
                      delay: 4000,
                    }),
                  ]}
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                >
                  <CarouselContent>
                     {approvedPhotos.map((photo) => (
                       <CarouselItem key={photo.id}>
                         <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-md">
                           <img
                             src={photo.image_url}
                             alt={photo.product_description}
                             className="w-full h-full object-cover"
                           />
                           {/* Small Delete Button */}
                           <Button
                             variant="destructive"
                             size="sm"
                             className="absolute top-2 right-2 h-6 w-6 p-0 opacity-80 hover:opacity-100"
                             onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
                           >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="h-8 w-8" />
                  <CarouselNext className="h-8 w-8" />
                </Carousel>
              </div>
            )}

            {/* Admin Empty State */}
            {approvedPhotos.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No hay fotos de clientes aún
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comienza agregando la primera foto de un cliente feliz
                </p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Foto
                </Button>
              </div>
            )}

            <AdminPhotoModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onUpload={uploadPhoto}
            />
          </>
        ) : (
          /* Simple photo carousel for non-admin users */
          approvedPhotos.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 4000,
                  }),
                ]}
                opts={{
                  align: "start",
                  loop: true,
                }}
              >
                <CarouselContent>
                  {approvedPhotos.slice(0, 10).filter(isPhotoSafeForPublicDisplay).map((photo) => (
                    <CarouselItem key={photo.id}>
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group">
                        <img
                          src={photo.image_url}
                          alt={sanitizeProductDescription(photo.product_description)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Semi-transparent overlay with gradient */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-8">
                          <div className="text-white">
                            <h3 className="text-sm md:text-base font-semibold mb-1 drop-shadow-sm">
                              {sanitizeProductDescription(photo.product_description)}
                            </h3>
                            <p className="text-xs md:text-sm text-white/90 drop-shadow-sm">
                              Cliente: {anonymizeCustomerName(photo.customer_name)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )
        )}
      </div>
    </section>
  );
};