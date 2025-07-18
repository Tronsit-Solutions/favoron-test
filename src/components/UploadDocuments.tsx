
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

  // Only show for payment_confirmed status
  if (currentStatus !== 'payment_confirmed') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Purchase Confirmation Upload - Independent Section */}
      <PurchaseConfirmationUpload
        packageId={packageId}
        currentConfirmation={currentConfirmation}
        onUpload={handleConfirmationUpload}
      />

      {/* Tracking Information - Independent Section */}
      <TrackingInfoForm
        packageId={packageId}
        currentTracking={currentTracking}
        onSubmit={handleTrackingSubmit}
      />

      {/* Progress Summary */}
      {(currentConfirmation || currentTracking) && (
        <div className="p-4 bg-info-muted border border-info-border rounded-lg">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${currentConfirmation ? 'bg-success' : 'bg-muted'}`} />
              <span className={`text-sm ${currentConfirmation ? 'text-success-foreground font-medium' : 'text-muted-foreground'}`}>
                Confirmación de compra
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${currentTracking ? 'bg-success' : 'bg-muted'}`} />
              <span className={`text-sm ${currentTracking ? 'text-success-foreground font-medium' : 'text-muted-foreground'}`}>
                Información de tracking
              </span>
            </div>
          </div>
          {currentConfirmation && currentTracking && (
            <p className="text-sm text-info-foreground mt-3 font-medium text-center">
              🚚 ¡Perfecto! Ambas secciones están completas
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadDocuments;
