
import PurchaseConfirmationUpload from "@/components/PurchaseConfirmationUpload";
import TrackingInfoForm from "@/components/TrackingInfoForm";

interface UploadDocumentsProps {
  packageId: string;
  currentStatus: string;
  currentConfirmation?: any;
  currentTracking?: any;
  onUpload: (type: 'confirmation' | 'tracking', data: any) => void;
}

const UploadDocuments = ({ 
  packageId, 
  currentStatus, 
  currentConfirmation,
  currentTracking,
  onUpload 
}: UploadDocumentsProps) => {

  const handleConfirmationUpload = (data: any) => {
    onUpload('confirmation', data);
  };

  const handleTrackingSubmit = (data: any) => {
    onUpload('tracking', data);
  };

  // Show sections based on individual completion status, not package status
  const showConfirmationSection = !currentConfirmation && (currentStatus === 'pending_purchase' || currentStatus === 'payment_confirmed' || currentStatus === 'paid' || currentStatus === 'in_transit');
  const showTrackingSection = !currentTracking && (currentStatus === 'pending_purchase' || currentStatus === 'payment_confirmed' || currentStatus === 'paid' || currentStatus === 'in_transit');
  
  // If both sections are completed, don't show the component
  if (!showConfirmationSection && !showTrackingSection) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          📋 Documentos Requeridos
        </h3>
        <p className="text-sm text-muted-foreground">
          Para completar tu pedido, necesitamos que subas los siguientes documentos:
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 p-3 bg-card rounded-lg border">
          <div className="flex items-center space-x-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentConfirmation ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
            }`}>
              {currentConfirmation ? '✓' : '1'}
            </div>
            <span className={`text-sm font-medium ${
              currentConfirmation ? 'text-success' : 'text-foreground'
            }`}>
              Comprobante
            </span>
          </div>
          
          <div className={`h-0.5 w-8 ${currentConfirmation ? 'bg-success' : 'bg-border'}`} />
          
          <div className="flex items-center space-x-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentTracking ? 'bg-success text-success-foreground' : 
              currentConfirmation ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {currentTracking ? '✓' : '2'}
            </div>
            <span className={`text-sm font-medium ${
              currentTracking ? 'text-success' : 
              currentConfirmation ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              Tracking
            </span>
          </div>
        </div>
      </div>

      {/* Upload Sections */}
      <div className="space-y-4">
        {/* Step 1: Purchase Confirmation Upload */}
        {showConfirmationSection && (
          <div className="border-2 border-dashed border-primary/30 rounded-lg p-1">
            <div className="bg-primary/5 rounded-md">
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-t-md">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <h4 className="font-semibold text-foreground">Comprobante de Compra</h4>
                </div>
                <span className="text-xs text-primary font-medium">REQUERIDO</span>
              </div>
              <div className="p-3">
                <PurchaseConfirmationUpload
                  packageId={packageId}
                  currentConfirmation={currentConfirmation}
                  onUpload={handleConfirmationUpload}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tracking Information */}
        {showTrackingSection && (
          <div className={`border-2 border-dashed rounded-lg p-1 ${
            currentConfirmation ? 'border-primary/30' : 'border-muted/50'
          }`}>
            <div className={`rounded-md ${currentConfirmation ? 'bg-primary/5' : 'bg-muted/20'}`}>
              <div className={`flex items-center justify-between p-3 rounded-t-md ${
                currentConfirmation ? 'bg-primary/10' : 'bg-muted/30'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentConfirmation ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </div>
                  <h4 className={`font-semibold ${
                    currentConfirmation ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    Información de Tracking
                  </h4>
                </div>
                <span className={`text-xs font-medium ${
                  currentConfirmation ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {currentConfirmation ? 'SIGUIENTE' : 'PENDIENTE'}
                </span>
              </div>
              <div className="p-3">
                {!currentConfirmation && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">
                      ⏳ Completa el paso 1 primero
                    </p>
                  </div>
                )}
                {currentConfirmation && (
                  <TrackingInfoForm
                    packageId={packageId}
                    currentTracking={currentTracking}
                    onSubmit={handleTrackingSubmit}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {currentConfirmation && currentTracking && (
        <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="text-success text-2xl mb-2">🎉</div>
          <h4 className="font-semibold text-success mb-1">¡Documentos Completos!</h4>
          <p className="text-sm text-success/80">
            Ambos documentos han sido subidos correctamente. Tu pedido está en proceso.
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadDocuments;
