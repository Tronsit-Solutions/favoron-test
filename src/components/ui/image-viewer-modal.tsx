import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  filename?: string;
}

export const ImageViewerModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title = "Imagen",
  filename = "image"
}: ImageViewerModalProps) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen && imageUrl) {
      checkAndRefreshUrl();
    }
  }, [isOpen, imageUrl]);

  const checkAndRefreshUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If it's a Supabase storage URL, try to generate a fresh signed URL
      if (imageUrl.includes('supabase') && imageUrl.includes('/storage/')) {
        console.log('Refreshing Supabase storage URL:', imageUrl);
        
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/storage/v1/object/');
        if (urlParts.length > 1) {
          const pathPart = urlParts[1];
          const bucketAndPath = pathPart.split('/');
          if (bucketAndPath.length > 1) {
            const bucket = bucketAndPath[0];
            const filePath = bucketAndPath.slice(1).join('/').split('?')[0]; // Remove query params
            
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 3600); // 1 hour expiry
            
            if (data?.signedUrl) {
              console.log('Successfully refreshed URL');
              setCurrentImageUrl(data.signedUrl);
            } else {
              console.error('Failed to refresh URL:', error);
              setCurrentImageUrl(imageUrl); // Fallback to original
            }
          }
        }
      } else {
        setCurrentImageUrl(imageUrl);
      }
    } catch (err) {
      console.error('Error refreshing image URL:', err);
      setCurrentImageUrl(imageUrl); // Fallback to original
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImageUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading image:', err);
      setError('No se pudo descargar la imagen');
    }
  };

  const handleImageError = () => {
    setError('No se pudo cargar la imagen');
  };

  const resetZoom = () => setZoom(1);
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetZoom}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Cargando imagen...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-destructive text-center">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkAndRefreshUrl}
                  className="mt-2"
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={currentImageUrl}
                alt={title}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.2s ease-in-out'
                }}
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={handleImageError}
                onDoubleClick={resetZoom}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};