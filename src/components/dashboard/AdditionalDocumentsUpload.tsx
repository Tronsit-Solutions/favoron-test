
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateFile } from '@/lib/validators';
import type { Package } from '@/types';

interface AdditionalDocumentsUploadProps {
  pkg: Package;
  onUploadComplete: (documentData: any) => void;
}

interface UploadedDocument {
  id: string;
  filename: string;
  description: string;
  uploadDate: string;
  fileType: string;
  fileSize: number;
}

const AdditionalDocumentsUpload: React.FC<AdditionalDocumentsUploadProps> = ({
  pkg,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentDescription, setDocumentDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputEvent>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: "Error",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentDescription.trim()) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo y agrega una descripción",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Simulate upload process - in real implementation, this would upload to storage
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDocument: UploadedDocument = {
        id: Date.now().toString(),
        filename: selectedFile.name,
        description: documentDescription,
        uploadDate: new Date().toISOString(),
        fileType: selectedFile.type,
        fileSize: selectedFile.size
      };

      setUploadedDocuments(prev => [...prev, newDocument]);
      
      // Update the package with additional notes about the uploaded document
      const updatedNotes = pkg.additional_notes 
        ? `${pkg.additional_notes}\n\nDocumento subido: ${selectedFile.name} - ${documentDescription}`
        : `Documento subido: ${selectedFile.name} - ${documentDescription}`;
      
      onUploadComplete({ additional_notes: updatedNotes });
      
      setSelectedFile(null);
      setDocumentDescription('');
      
      toast({
        title: "¡Éxito!",
        description: "Documento adicional subido correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Subir Documentos Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-description">Descripción del documento</Label>
            <Textarea
              id="document-description"
              placeholder="Ej: Factura del producto, documento de aduana, foto del producto..."
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-file">Seleccionar archivo</Label>
            <Input
              id="additional-file"
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
              className="cursor-pointer"
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{selectedFile.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !documentDescription.trim() || isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Subiendo...' : 'Subir Documento'}
          </Button>
        </CardContent>
      </Card>

      {uploadedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Documentos Subidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pkg.additional_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notas Adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {pkg.additional_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdditionalDocumentsUpload;
