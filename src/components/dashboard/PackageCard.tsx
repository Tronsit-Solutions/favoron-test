
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";
import OrderStepsFlow from "@/components/dashboard/OrderStepsFlow";
import PackageHeader from "@/components/dashboard/PackageHeader";
import PackageProductDisplay from "@/components/dashboard/PackageProductDisplay";
import PackageQuoteInfo from "@/components/dashboard/PackageQuoteInfo";
import PackageActionButtons from "@/components/dashboard/PackageActionButtons";

interface PackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'user' | 'admin') => void;
  onConfirmAddress: (pkg: any) => void;
  onUploadDocument: (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
  onEditPackage?: (packageData: any) => void;
  viewMode?: 'user';
}

const PackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote, 
  onConfirmAddress, 
  onUploadDocument,
  onEditPackage,
  viewMode = 'user'
}: PackageCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  
  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
    setShowPaymentUpload(false);
  };

  const handleEditSubmit = (editedData: any) => {
    if (onEditPackage) {
      onEditPackage(editedData);
    }
    setShowEditModal(false);
  };

  // Special layout for payment pending state
  if (pkg.status === 'quote_accepted' && viewMode === 'user') {
    return (
      <Card key={pkg.id} className="border-warning-border bg-warning-muted/30">
        <PackageHeader pkg={pkg} getStatusBadge={getStatusBadge} />
        <CardContent>
          {/* PAYMENT SECTION - PROMINENT AND VISIBLE */}
          <div className="mb-6 space-y-4">
            {/* Payment Instructions */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-semibold text-primary mb-2">💵 Instrucciones de pago</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Por favor realiza el pago correspondiente a tu cotización a la siguiente cuenta:
                </p>
              </div>
              
              <div className="bg-background/80 rounded-md p-3 border border-border mb-4">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre de la cuenta:</span>
                    <span className="text-black font-semibold">Favorón S.A.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Número de cuenta:</span>
                    <span className="text-black font-semibold font-mono">84V050N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Banco:</span>
                    <span className="text-black font-semibold">Banco Industrial</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="font-medium">Monto:</span>
                    <span className="text-black font-bold text-lg">
                      ${pkg.quote && typeof pkg.quote === 'object' ? parseFloat((pkg.quote as any).totalPrice || '0').toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Una vez realizado el pago, sube tu comprobante para continuar con el proceso.
              </p>
            </div>
            
            {/* Payment Upload */}
            <PaymentUpload 
              packageId={pkg.id}
              onUpload={handlePaymentUpload}
              currentPaymentReceipt={pkg.paymentReceipt}
              isPaymentApproved={['payment_confirmed', 'in_transit', 'delivered'].includes(pkg.status)}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <PackageProductDisplay 
                products={pkg.products}
                itemDescription={pkg.itemDescription}
                itemLink={pkg.itemLink}
                estimatedPrice={pkg.estimatedPrice}
              />
              
              <PackageQuoteInfo quote={pkg.quote} />
              
              <PackageActionButtons
                pkg={pkg}
                viewMode={viewMode}
                onQuote={onQuote}
                onEditClick={() => setShowEditModal(true)}
                onEditPackage={onEditPackage}
              />

              {pkg.additionalNotes && (
                <div className="text-sm">
                  <strong>Notas adicionales:</strong> {pkg.additionalNotes}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
              </p>
            </div>

            <div className="space-y-4">
              <PackageStatusTimeline currentStatus={pkg.status} />
            </div>
          </div>
        </CardContent>
        
        <EditPackageModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          packageData={pkg}
        />
      </Card>
    );
  }

  return (
    <Card key={pkg.id}>
      <PackageHeader pkg={pkg} getStatusBadge={getStatusBadge} />
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <PackageProductDisplay 
              products={pkg.products}
              itemDescription={pkg.itemDescription}
              itemLink={pkg.itemLink}
              estimatedPrice={pkg.estimatedPrice}
            />
            
            <PackageQuoteInfo quote={pkg.quote} />

            <OrderStepsFlow 
              pkg={pkg}
              viewMode={viewMode}
              onUploadDocument={onUploadDocument}
            />

            <PackageActionButtons
              pkg={pkg}
              viewMode={viewMode}
              onQuote={onQuote}
              onEditClick={() => setShowEditModal(true)}
              onEditPackage={onEditPackage}
            />

            {pkg.additionalNotes && (
              <div className="text-sm">
                <strong>Notas adicionales:</strong> {pkg.additionalNotes}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
            </p>
          </div>

          <div className="space-y-4">
            <PackageStatusTimeline currentStatus={pkg.status} />
          </div>
        </div>
      </CardContent>
      
      <EditPackageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        packageData={pkg}
      />
    </Card>
  );
};

export default PackageCard;
