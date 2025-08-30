
import { Button } from '@/components/ui/button';
import { File, Download } from 'lucide-react';
import { isImageFile } from '@/utils/chatHelpers';

interface FileAttachmentProps {
  fileUrl: string;
  fileName?: string | null;
  fileType?: string | null;
  onDownload: (url: string, filename: string) => void;
}

export const FileAttachment = ({ fileUrl, fileName, fileType, onDownload }: FileAttachmentProps) => {
  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDownload(fileUrl, fileName || 'archivo');
  };

  if (isImageFile(fileType)) {
    return (
      <div className="relative group w-full max-w-xs">
        <img 
          src={fileUrl} 
          alt={fileName || 'Imagen'} 
          className="w-full max-h-48 rounded-lg object-cover border shadow-sm cursor-pointer transition-transform hover:scale-[1.02]"
          loading="lazy"
          onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
        />
        {/* Overlay with download button */}
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
        {fileName && (
          <p className="text-xs text-muted-foreground mt-1 px-1 truncate">
            {fileName}
          </p>
        )}
      </div>
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
