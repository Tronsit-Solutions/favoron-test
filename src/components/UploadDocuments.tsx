
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
    <div className="space-y-2">
      {/* Header Section */}
      <div className="p-2 bg-muted/20 rounded-md border">
        <div className="flex items-center space-x-2 mb-1">
          <div className="h-4 w-4 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-xs">📋</span>
          </div>
          <h3 className="text-sm font-medium text-foreground">
            Documentos Requeridos
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Para completar tu pedido, necesitamos que subas los siguientes documentos:
        </p>
      </div>


      {/* Upload Sections */}
      <div className="space-y-2">
        {/* Step 1: Purchase Confirmation Upload */}
        {showConfirmationSection && (
          <div className="border border-primary/30 rounded-lg">
            <div className="bg-primary/5 rounded-md">
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-t-md">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <h4 className="font-semibold text-foreground">Comprobante de Compra</h4>
                </div>
                <span className="text-xs text-primary font-medium">REQUERIDO</span>
              </div>
              <div className="p-2">
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
          <div className="border border-primary/30 rounded-lg">
            <div className="bg-primary/5 rounded-md">
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-t-md">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <h4 className="font-semibold text-foreground">Información de Tracking</h4>
                </div>
                <span className="text-xs text-primary font-medium">REQUERIDO</span>
              </div>
              <div className="p-2">
                <TrackingInfoForm
                  packageId={packageId}
                  currentTracking={currentTracking}
                  onSubmit={handleTrackingSubmit}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {currentConfirmation && currentTracking && (
        <div className="text-center p-3 bg-success/10 border border-success/20 rounded-lg">
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
