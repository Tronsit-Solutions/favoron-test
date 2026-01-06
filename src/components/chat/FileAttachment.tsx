import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { File, Download, ImageOff, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { isImageFile } from '@/utils/chatHelpers';
import { resolveSignedUrl } from '@/lib/storageUrls';
import { ImageViewerModal } from '@/components/ui/image-viewer-modal';

interface FileAttachmentProps {
  fileUrl: string;
  fileName?: string | null;
  fileType?: string | null;
  onDownload: (url: string, filename: string) => void;
}

export const FileAttachment = ({ fileUrl, fileName, fileType, onDownload }: FileAttachmentProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Generate signed URL for images on mount
  useEffect(() => {
    if (isImageFile(fileType) && fileUrl) {
      setIsLoading(true);
      setHasError(false);
      resolveSignedUrl(fileUrl)
        .then(url => {
          if (url) {
            setSignedUrl(url);
          } else {
            setHasError(true);
          }
        })
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    }
  }, [fileUrl, fileType]);

  const handleRetry = () => {
    if (fileUrl) {
      setIsLoading(true);
      setHasError(false);
      resolveSignedUrl(fileUrl)
        .then(url => {
          if (url) {
            setSignedUrl(url);
          } else {
            setHasError(true);
          }
        })
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false));
    }
  };

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const urlToDownload = signedUrl || fileUrl;
    onDownload(urlToDownload, fileName || 'archivo');
  };

  if (isImageFile(fileType)) {
    const isReady = !isLoading && signedUrl && !hasError;
    
    return (
      <>
        <div className="relative group w-full max-w-xs">
          {isLoading ? (
            <Skeleton className="w-full h-32 rounded-lg" />
          ) : hasError ? (
            <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center border">
              <div className="text-center text-muted-foreground">
                <ImageOff className="h-6 w-6 mx-auto mb-1" />
                <p className="text-xs mb-2">No se pudo cargar</p>
                <div className="flex gap-1 justify-center">
                  <Button size="sm" variant="ghost" onClick={handleRetry} className="h-6 px-2 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reintentar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDownload} className="h-6 px-2 text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>
          ) : isReady ? (
            <img 
              src={signedUrl} 
              alt={fileName || 'Imagen'} 
              className="w-full max-h-48 rounded-lg object-cover border shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
              loading="lazy"
              onClick={() => setViewerOpen(true)}
              onError={() => setHasError(true)}
            />
          ) : (
            <Skeleton className="w-full h-32 rounded-lg" />
          )}
          {/* Overlay with download button */}
          {isReady && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 border-0"
              >
                <Download className="h-3 w-3 text-white" />
              </Button>
            </div>
          )}
          {fileName && (
            <p className="text-xs text-muted-foreground mt-1 px-1 truncate">
              {fileName}
            </p>
          )}
        </div>
        
        {isReady && (
          <ImageViewerModal
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            imageUrl={signedUrl}
            title={fileName || 'Imagen'}
            filename={fileName || 'image'}
          />
        )}
      </>
    );
  }

  // For non-image files, show as document
  return (
    <div className="p-2 bg-background rounded-lg border shadow-sm w-full">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
            <File className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {fileName || 'Archivo'}
            </p>
            {fileType && (
              <p className="text-xs text-muted-foreground truncate">
                {fileType}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="shrink-0 hover:bg-primary/10 h-7 px-2"
        >
          <Download className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Descargar</span>
        </Button>
      </div>
    </div>
  );
};
