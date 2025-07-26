
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
    <div className="space-y-4">
      {/* Purchase Confirmation Upload - Show only if not completed */}
      {showConfirmationSection && (
        <PurchaseConfirmationUpload
          packageId={packageId}
          currentConfirmation={currentConfirmation}
          onUpload={handleConfirmationUpload}
        />
      )}

      {/* Tracking Information - Show only if not completed */}
      {showTrackingSection && (
        <TrackingInfoForm
          packageId={packageId}
          currentTracking={currentTracking}
          onSubmit={handleTrackingSubmit}
        />
      )}

      {/* Progress Summary - Show if at least one section is visible */}
      {(showConfirmationSection || showTrackingSection) && (currentConfirmation || currentTracking) && (
        <div className="p-4 bg-info-muted border border-info-border rounded-lg">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${currentConfirmation ? 'bg-success' : 'bg-muted'}`} />
              <span className={`text-sm ${currentConfirmation ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
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
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-3 font-medium text-center">
              🚚 ¡Perfecto! Ambas secciones están completas
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadDocuments;
