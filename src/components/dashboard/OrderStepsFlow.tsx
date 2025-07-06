import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Lock, MapPin, DollarSign, FileText, Package, Upload, Edit } from "lucide-react";
import PaymentUpload from "@/components/PaymentUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderStepsFlowProps {
  pkg: any;
  viewMode: 'shopper' | 'traveler';
  onUploadDocument: (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
}

const OrderStepsFlow = ({ pkg, viewMode, onUploadDocument }: OrderStepsFlowProps) => {
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  const [showPurchaseUpload, setShowPurchaseUpload] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(pkg.trackingInfo?.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(pkg.trackingInfo?.trackingUrl || '');
  const [trackingNotes, setTrackingNotes] = useState(pkg.trackingInfo?.notes || '');

  // Determine current step based on package status
  const getCurrentStep = () => {
    if (pkg.status === 'quote_accepted') return 1; // Payment step
    if (pkg.status === 'payment_pending') return 1; // Payment step (waiting approval)
    if (pkg.status === 'payment_confirmed') return 2; // Shipping info + upload documents
    if (pkg.status === 'in_transit' || pkg.status === 'delivered') return 3; // Completed
    return 0; // Before quote acceptance
  };

  const currentStep = getCurrentStep();
  const isPaymentApproved = pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered';

  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
    setShowPaymentUpload(false);
  };

  const handlePurchaseUpload = () => {
    const purchaseData = {
      filename: `purchase_confirmation_${pkg.id}_${Date.now()}.pdf`,
      uploadedAt: new Date().toISOString(),
      type: 'confirmation'
    };
    onUploadDocument(pkg.id, 'confirmation', purchaseData);
    setShowPurchaseUpload(false);
  };

  const handleTrackingSubmit = () => {
    if (!trackingNumber.trim()) return;
    
    const trackingData = {
      trackingNumber: trackingNumber.trim(),
      trackingUrl: trackingUrl.trim() || null,
      notes: trackingNotes.trim() || null,
      timestamp: new Date().toISOString()
    };
    onUploadDocument(pkg.id, 'tracking', trackingData);
    setShowTrackingForm(false);
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'active';
    return 'locked';
  };

  const getStepIcon = (step: number, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'active') return <Clock className="h-5 w-5 text-blue-600" />;
    return <Lock className="h-5 w-5 text-gray-400" />;
  };

  if (viewMode !== 'shopper' || pkg.status === 'pending_approval') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Payment Upload */}
      <Card className={`${
        getStepStatus(1) === 'completed' ? 'border-green-200 bg-green-50/30' :
        getStepStatus(1) === 'active' ? 'border-blue-200 bg-blue-50/30' :
        'border-gray-200 bg-gray-50/30'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStepIcon(1, getStepStatus(1))}
              <span>Paso 1: Comprobante de Pago</span>
            </div>
            <Badge variant={getStepStatus(1) === 'completed' ? 'default' : getStepStatus(1) === 'active' ? 'secondary' : 'outline'}>
              {getStepStatus(1) === 'completed' ? 'Completado' : 
               getStepStatus(1) === 'active' ? 'Activo' : 'Bloqueado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {getStepStatus(1) === 'locked' ? (
            <p className="text-sm text-gray-600">Acepta la cotización para desbloquear este paso</p>
          ) : (
            <>
              <div className="space-y-2">
                {pkg.paymentReceipt ? (
                  <div className="flex items-center justify-between p-3 bg-green-100 border border-green-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Comprobante subido
                      </p>
                      <p className="text-xs text-green-600">
                        📄 {pkg.paymentReceipt.filename || 'payment_receipt.pdf'}
                      </p>
                      <p className="text-xs text-green-600">
                        Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                    {!isPaymentApproved && (
                      <Button size="sm" variant="outline" onClick={() => setShowPaymentUpload(true)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Sube tu comprobante de pago para continuar</p>
                    <Button size="sm" onClick={() => setShowPaymentUpload(true)}>
                      <Upload className="h-3 w-3 mr-1" />
                      Subir Comprobante
                    </Button>
                  </div>
                )}
                
                {pkg.paymentReceipt && (
                  <>
                    {isPaymentApproved ? (
                      <div className="p-2 bg-blue-100 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">✅ Pago aprobado por administrador</p>
                      </div>
                    ) : (
                      <div className="p-2 bg-yellow-100 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">⏳ Esperando aprobación del administrador</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {showPaymentUpload && (
                <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                  <PaymentUpload 
                    packageId={pkg.id}
                    onUpload={handlePaymentUpload}
                    currentPaymentReceipt={pkg.paymentReceipt}
                    isPaymentApproved={isPaymentApproved}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPaymentUpload(false)}
                    className="mt-2"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Shipping Address & Documents Upload */}
      <Card className={`${
        getStepStatus(2) === 'completed' ? 'border-green-200 bg-green-50/30' :
        getStepStatus(2) === 'active' ? 'border-blue-200 bg-blue-50/30' :
        'border-gray-200 bg-gray-50/30'
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStepIcon(2, getStepStatus(2))}
              <span>Paso 2: Información de Envío y Documentos</span>
            </div>
            <Badge variant={getStepStatus(2) === 'completed' ? 'default' : getStepStatus(2) === 'active' ? 'secondary' : 'outline'}>
              {getStepStatus(2) === 'completed' ? 'Completado' : 
               getStepStatus(2) === 'active' ? 'Activo' : 'Bloqueado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getStepStatus(2) === 'locked' ? (
            <p className="text-sm text-gray-600">El administrador debe aprobar tu pago para desbloquear este paso</p>
          ) : (
            <>
              {/* Shipping Address */}
              {pkg.travelerAddress && (
                <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm font-medium text-green-800">Dirección de entrega confirmada:</p>
                  </div>
                  <div className="text-sm text-green-700 ml-6">
                    <p>{pkg.travelerAddress.streetAddress}</p>
                    <p>{pkg.travelerAddress.cityArea}</p>
                    {pkg.travelerAddress.hotelAirbnbName && (
                      <p>{pkg.travelerAddress.hotelAirbnbName}</p>
                    )}
                    <p>📞 {pkg.travelerAddress.contactNumber}</p>
                  </div>
                </div>
              )}

              {/* Purchase Confirmation */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Comprobante de Compra</h4>
                <div className="p-3 border border-gray-200 rounded-lg">
                  {pkg.purchaseConfirmation ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          <FileText className="h-4 w-4 inline mr-1" />
                          Comprobante subido
                        </p>
                        <p className="text-xs text-blue-600">
                          📄 {pkg.purchaseConfirmation.filename || 'purchase_confirmation.pdf'}
                        </p>
                        <p className="text-xs text-blue-600">
                          Subido: {new Date(pkg.purchaseConfirmation.uploadedAt).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handlePurchaseUpload()}>
                        <Edit className="h-3 w-3 mr-1" />
                        Reemplazar
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Sube el comprobante de compra del producto</p>
                      <Button size="sm" variant="outline" onClick={() => handlePurchaseUpload()}>
                        <Upload className="h-3 w-3 mr-1" />
                        Subir Comprobante
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tracking Information */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Información de Seguimiento</h4>
                <div className="p-3 border border-gray-200 rounded-lg">
                  {pkg.trackingInfo ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          <Package className="h-4 w-4 inline mr-1" />
                          Tracking agregado
                        </p>
                        <p className="text-xs text-orange-600">
                          📦 <span className="font-mono">{pkg.trackingInfo.trackingNumber}</span>
                        </p>
                        <p className="text-xs text-orange-600">
                          Agregado: {new Date(pkg.trackingInfo.timestamp).toLocaleDateString('es-GT')}
                        </p>
                        {pkg.trackingInfo.trackingUrl && (
                          <a 
                            href={pkg.trackingInfo.trackingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-primary hover:underline block"
                          >
                            🔗 Seguir paquete
                          </a>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowTrackingForm(true)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Agrega el número de seguimiento del paquete</p>
                      <Button size="sm" variant="outline" onClick={() => setShowTrackingForm(true)}>
                        <Upload className="h-3 w-3 mr-1" />
                        Agregar Tracking
                      </Button>
                    </div>
                  )}
                </div>

                {showTrackingForm && (
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/30">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="trackingNumber">Número de seguimiento *</Label>
                        <Input
                          id="trackingNumber"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Ej: 1234567890"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="trackingUrl">URL de seguimiento (opcional)</Label>
                        <Input
                          id="trackingUrl"
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          placeholder="https://tracking.carrier.com/track/..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="trackingNotes">Notas adicionales</Label>
                        <Textarea
                          id="trackingNotes"
                          value={trackingNotes}
                          onChange={(e) => setTrackingNotes(e.target.value)}
                          placeholder="Información adicional sobre el envío..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleTrackingSubmit} 
                          disabled={!trackingNumber.trim()}
                          size="sm"
                        >
                          Guardar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowTrackingForm(false)}
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Completion Status */}
              {pkg.purchaseConfirmation && pkg.trackingInfo && (
                <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    🚚 ¡Perfecto! El pedido pasará a estado "En tránsito"
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Step 3: In Transit / Completed */}
      {(pkg.status === 'in_transit' || pkg.status === 'delivered') && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Paso 3: En Tránsito</span>
              </div>
              <Badge variant="default">Completado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800">
              {pkg.status === 'delivered' ? 
                '📦 ¡Tu paquete ha sido entregado exitosamente!' :
                '🚚 Tu paquete está en camino hacia su destino'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderStepsFlow;