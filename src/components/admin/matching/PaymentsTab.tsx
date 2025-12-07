import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Eye, Check, AlertCircle, Receipt, DollarSign, User, CreditCard, CheckCircle, Crown, Sparkles, CheckCheck } from 'lucide-react';
import { usePrimeMembership } from '@/hooks';
import { ReceiptViewerModal } from '@/components/ui/receipt-viewer-modal';
import { getPriceBreakdown } from '@/lib/pricing';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PaymentsTabProps {
  packages: any[];
  onViewPackageDetail: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  autoApprovedPayments?: any[];
  approvedPaymentsData?: any[];
  autoApprovedPaymentsLoading?: boolean;
  approvedPaymentsLoading?: boolean;
  loadAutoApprovedPayments?: () => Promise<void>;
  loadApprovedPayments?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export function PaymentsTab({ 
  packages, 
  onViewPackageDetail, 
  onUpdateStatus, 
  getStatusBadge,
  autoApprovedPayments = [],
  approvedPaymentsData = [],
  autoApprovedPaymentsLoading = false,
  approvedPaymentsLoading = false,
  loadAutoApprovedPayments,
  loadApprovedPayments,
  onRefresh
}: PaymentsTabProps) {
  const { memberships, updateMembershipStatus } = usePrimeMembership();
  const [selectedReceipt, setSelectedReceipt] = useState<{url: string, filename: string, title: string} | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [markingAsReviewed, setMarkingAsReviewed] = useState<string | null>(null);

  // Lazy load data when tabs become active
  useEffect(() => {
    if (activeTab === 'audit' && autoApprovedPayments.length === 0 && !autoApprovedPaymentsLoading && loadAutoApprovedPayments) {
      console.log('🔄 Loading auto-approved payments on-demand...');
      loadAutoApprovedPayments();
    }
  }, [activeTab, autoApprovedPayments.length, autoApprovedPaymentsLoading, loadAutoApprovedPayments]);

  useEffect(() => {
    if (activeTab === 'approved' && approvedPaymentsData.length === 0 && !approvedPaymentsLoading && loadApprovedPayments) {
      console.log('🔄 Loading approved payments on-demand...');
      loadApprovedPayments();
    }
  }, [activeTab, approvedPaymentsData.length, approvedPaymentsLoading, loadApprovedPayments]);

  // Separate payments by status
  // Show manual pending payments AND auto-approved payments that haven't been reviewed yet
  const pendingPayments = packages.filter(pkg => 
    pkg.payment_receipt && (
      // Manual payments waiting for approval
      (pkg.status === 'payment_pending_approval' && 
       !(pkg.payment_receipt as any)?.auto_approved) ||
      // OR auto-approved payments that haven't been marked as reviewed
      ((pkg.payment_receipt as any)?.auto_approved && 
       !(pkg.payment_receipt as any)?.admin_reviewed)
    )
  ).sort((a, b) => {
    // Sort by upload date (most recent first)
    const dateA = new Date((a.payment_receipt as any)?.uploadedAt || a.created_at).getTime();
    const dateB = new Date((b.payment_receipt as any)?.uploadedAt || b.created_at).getTime();
    return dateB - dateA;
  });
  
  // Use dedicated auto-approved payments from separate query (no pagination limits)
  const auditPayments = autoApprovedPayments
    .sort((a, b) => {
      const dateA = new Date((a.payment_receipt as any)?.uploadedAt || a.created_at).getTime();
      const dateB = new Date((b.payment_receipt as any)?.uploadedAt || b.created_at).getTime();
      return dateB - dateA;
    });
  
  // Use dedicated approved payments from separate query (no pagination limits)
  // Include both manual approved payments AND auto-approved payments that have been reviewed
  const approvedPayments = approvedPaymentsData
    .filter(pkg => 
      // Manual approved payments (no auto_approved flag)
      !(pkg.payment_receipt as any)?.auto_approved ||
      // OR auto-approved payments that have been marked as reviewed
      ((pkg.payment_receipt as any)?.auto_approved && 
       (pkg.payment_receipt as any)?.admin_reviewed)
    )
    .sort((a, b) => {
      const dateA = new Date((a.payment_receipt as any)?.uploadedAt || a.created_at).getTime();
      const dateB = new Date((b.payment_receipt as any)?.uploadedAt || b.created_at).getTime();
      return dateB - dateA;
    });

  // Prime membership payments
  const pendingPrimeMemberships = memberships.filter(membership => membership.status === 'pending');
  const approvedPrimeMemberships = memberships.filter(membership => 
    membership.status === 'approved' || membership.status === 'rejected'
  );

  // Handle marking auto-approved payments as reviewed
  const handleMarkAsReviewed = async (packageId: string, currentReceipt: any) => {
    if (markingAsReviewed) return; // Prevent double click
    
    setMarkingAsReviewed(packageId);
    
    try {
      console.log('📝 Marking payment as reviewed:', packageId);
      
      const { error } = await supabase
        .from('packages')
        .update({
          payment_receipt: {
            ...currentReceipt,
            admin_reviewed: true,
            admin_reviewed_at: new Date().toISOString()
          }
        })
        .eq('id', packageId);
      
      if (error) {
        console.error('❌ Error marking as reviewed:', { packageId, error });
        throw error;
      }
      
      console.log('✅ Successfully marked as reviewed:', packageId);
      
      toast({
        title: "✅ Pago revisado",
        description: "El comprobante ha sido marcado como revisado."
      });
      
      // Trigger refresh with delay to allow UI to update first
      if (onRefresh) {
        setTimeout(() => onRefresh(), 500);
      }
    } catch (error: any) {
      console.error('💥 Exception marking as reviewed:', { packageId, error });
      toast({
        title: "Error",
        description: error?.message || "No se pudo marcar el pago como revisado. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setMarkingAsReviewed(null);
    }
  };

  const renderPaymentCard = (pkg: any, showConfirmButton: boolean = false, isAutoApproved: boolean = false) => {
    // Recalculate the correct pricing based on shopper's trust level
    const isPrime = pkg.profiles?.trust_level === 'prime';
    const basePrice = Number(pkg.quote?.price || pkg.estimated_price || 0);
    
    const correctPricing = getPriceBreakdown(
      basePrice,
      pkg.delivery_method || 'pickup',
      pkg.profiles?.trust_level,
      pkg.package_destination
    );

    return (
      <Card key={pkg.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 gap-1 sm:gap-0">
                <h4 className="font-medium truncate pr-2">{pkg.item_description}</h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPrime && (
                    <Badge variant="prime" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Prime
                    </Badge>
                  )}
                  {getStatusBadge(pkg.status)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Precio: ${pkg.estimated_price} • Usuario: {pkg.profiles?.first_name} {pkg.profiles?.last_name || 'Usuario sin nombre'}
              </p>
              <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                <p className="text-xs text-amber-800 font-medium mb-1">
                  💰 Cotización Original del Shopper {isPrime && '(Prime)'}:
                </p>
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Precio base:</span> Q{correctPricing.basePrice.toFixed(2)}
                </p>
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Fee de servicio ({isPrime ? '20%' : '40%'}):</span> Q{correctPricing.serviceFee.toFixed(2)}
                </p>
                {correctPricing.deliveryFee > 0 && (
                  <p className="text-xs text-amber-700">
                    <span className="font-medium">Fee de entrega:</span> Q{correctPricing.deliveryFee.toFixed(2)}
                  </p>
                )}
                {pkg.quote?.discountAmount > 0 && (
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Descuento ({pkg.quote.discountCode}):</span> -Q{Number(pkg.quote.discountAmount).toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-amber-700 font-semibold mt-1 pt-1 border-t border-amber-300">
                  <span className="font-medium">Total que debía pagar:</span> Q{pkg.quote?.finalTotalPrice ? Number(pkg.quote.finalTotalPrice).toFixed(2) : correctPricing.totalPrice.toFixed(2)}
                </p>
              </div>
            {pkg.payment_receipt && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-800 font-medium">Comprobante de pago:</p>
                <p className="text-xs text-blue-600 truncate">
                  📄 {pkg.payment_receipt.filename}
                </p>
                <p className="text-xs text-blue-600">
                  📅 Subido: {new Date(pkg.payment_receipt.uploadedAt).toLocaleDateString('es-GT')}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                if (pkg.payment_receipt) {
                  // Extract the correct file path for Supabase storage
                  let filePath = pkg.payment_receipt.fileUrl || pkg.payment_receipt.filePath || '';
                  
                  // If it's a full URL, extract just the file path
                  if (filePath.startsWith('http')) {
                    try {
                      const url = new URL(filePath);
                      const pathParts = url.pathname.split('/');
                      const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts');
                      if (bucketIndex !== -1) {
                        filePath = pathParts.slice(bucketIndex + 1).join('/');
                      }
                    } catch (e) {
                      console.error('Error parsing receipt URL:', e);
                    }
                  }
                  
                  setSelectedReceipt({
                    url: `payment-receipts/${filePath}`,
                    filename: pkg.payment_receipt.filename || 'comprobante.jpg',
                    title: `Comprobante de pago - ${pkg.item_description}`
                  });
                }
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              <span className="sm:inline">Ver Comprobante</span>
            </Button>
            {showConfirmButton && (
              isAutoApproved ? (
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => handleMarkAsReviewed(pkg.id, pkg.payment_receipt)}
                  disabled={markingAsReviewed === pkg.id}
                >
                  {markingAsReviewed === pkg.id ? (
                    <>
                      <span className="animate-spin mr-1">⏳</span>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCheck className="h-4 w-4 mr-1" />
                      <span>Revisado</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => onUpdateStatus('package', pkg.id, 'pending_purchase')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="sm:inline">Confirmar Pago</span>
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  const renderPrimeMembershipCard = (membership: any, showConfirmButton: boolean = false) => (
    <Card key={membership.id} className="hover:shadow-md transition-shadow border-purple-200">
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 gap-1 sm:gap-0">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-purple-700">Membresía Favorón Prime</h4>
              </div>
              <div className="flex-shrink-0">
                <Badge 
                  variant={membership.status === 'pending' ? 'outline' : 
                          membership.status === 'approved' ? 'default' : 'destructive'}
                  className={membership.status === 'pending' ? 'border-yellow-500 text-yellow-700' :
                            membership.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                >
                  {membership.status === 'pending' ? 'Pendiente' :
                   membership.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Monto: Q{membership.amount} • Usuario: {membership.profiles?.first_name || 'Sin nombre'} {membership.profiles?.last_name || ''}
            </p>
            {membership.receipt_url && (
              <div className="mt-2 p-2 bg-purple-50 rounded">
                <p className="text-xs text-purple-800 font-medium">Comprobante de pago:</p>
                <p className="text-xs text-purple-600 truncate">
                  📄 {membership.receipt_filename || 'Comprobante'}
                </p>
                <p className="text-xs text-purple-600">
                  📅 Solicitud: {new Date(membership.created_at).toLocaleDateString('es-GT')}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                if (membership.receipt_url) {
                  // Extract the correct file path for Supabase storage
                  let filePath = membership.receipt_url;
                  
                  // If it's a full URL, extract just the file path
                  if (filePath.startsWith('http')) {
                    try {
                      const url = new URL(filePath);
                      const pathParts = url.pathname.split('/');
                      const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts');
                      if (bucketIndex !== -1) {
                        filePath = pathParts.slice(bucketIndex + 1).join('/');
                      }
                    } catch (e) {
                      console.error('Error parsing prime receipt URL:', e);
                    }
                  }
                  
                  setSelectedReceipt({
                    url: `payment-receipts/${filePath}`,
                    filename: membership.receipt_filename || 'Comprobante',
                    title: `Comprobante Membresía Prime - ${membership.profiles?.first_name || 'Usuario'} ${membership.profiles?.last_name || ''}`
                  });
                }
              }}
              className="w-full sm:w-auto text-xs sm:text-sm border-purple-300 text-purple-700"
            >
              <Eye className="h-4 w-4 mr-1" />
              <span className="sm:inline">Ver Comprobante</span>
            </Button>
            {showConfirmButton && (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => updateMembershipStatus(membership.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="sm:inline">Aprobar</span>
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => updateMembershipStatus(membership.id, 'rejected')}
                >
                  <span className="sm:inline">Rechazar</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
              <div className="text-xs text-muted-foreground">Pagos Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedPayments.length}</div>
              <div className="text-xs text-muted-foreground">Pagos Aprobados</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{pendingPrimeMemberships.length}</div>
              <div className="text-xs text-muted-foreground">Prime Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-800">{approvedPrimeMemberships.length}</div>
              <div className="text-xs text-muted-foreground">Prime Aprobadas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            ⏳ Pendientes
            {(pendingPayments.length + pendingPrimeMemberships.length) > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingPayments.length + pendingPrimeMemberships.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="relative">
            🔍 Auditoría
            {auditPayments.length > 0 && (
              <Badge variant="outline" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {auditPayments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            ✅ Aprobados
            {(approvedPayments.length + approvedPrimeMemberships.length) > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {approvedPayments.length + approvedPrimeMemberships.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>💳 Todos los Comprobantes de Pago</CardTitle>
              <CardDescription>Incluye pagos pendientes de aprobación manual y pagos auto-aprobados que requieren revisión</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 && pendingPrimeMemberships.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-muted-foreground">No hay comprobantes de pago</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Prime Memberships Section */}
                  {pendingPrimeMemberships.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-700">Membresías Prime Pendientes ({pendingPrimeMemberships.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {pendingPrimeMemberships.map(membership => renderPrimeMembershipCard(membership, true))}
                      </div>
                    </div>
                  )}
                  
                  {/* Package Payments Section */}
                  {pendingPayments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-700">Comprobantes de Pago de Paquetes ({pendingPayments.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {pendingPayments.map(pkg => {
                          const isAutoApproved = (pkg.payment_receipt as any)?.auto_approved === true;
                          return renderPaymentCard(pkg, true, isAutoApproved);
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Historial de Pagos Auto-Aprobados</CardTitle>
              <CardDescription>
                Historial completo de pagos aprobados automáticamente por nivel de confianza. 
                Revisar solo si detectas algo inusual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {autoApprovedPaymentsLoading ? (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">⏳</div>
                  <p className="text-muted-foreground">Cargando pagos auto-aprobados...</p>
                </div>
              ) : auditPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-muted-foreground">No hay pagos para auditar</p>
                  <p className="text-xs text-muted-foreground mt-1">Todos los pagos auto-aprobados han sido revisados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditPayments.map(pkg => {
                    // Calculate correct total price
                    const basePrice = Number(pkg.quote?.price || pkg.estimated_price || 0);
                    const correctPricing = getPriceBreakdown(
                      basePrice,
                      pkg.delivery_method || 'pickup',
                      pkg.profiles?.trust_level,
                      pkg.package_destination
                    );
                    
                    return (
                      <Card key={pkg.id} className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge className="bg-green-600 mb-2">
                                ✅ {(pkg.payment_receipt as any)?.trust_level_at_upload || 'confiable'}
                              </Badge>
                              <h4 className="font-medium">{pkg.item_description}</h4>
                              <p className="text-sm text-muted-foreground">
                                Monto Total: Q{correctPricing.totalPrice.toFixed(2)} • Shopper: {pkg.profiles?.first_name} {pkg.profiles?.last_name || 'Usuario sin nombre'}
                              </p>
                              <p className="text-xs text-green-700 mt-1">
                                📄 {pkg.payment_receipt?.filename}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (pkg.payment_receipt) {
                                  let filePath = pkg.payment_receipt.fileUrl || pkg.payment_receipt.filePath || '';
                                  if (filePath.startsWith('http')) {
                                    try {
                                      const url = new URL(filePath);
                                      const pathParts = url.pathname.split('/');
                                      const bucketIndex = pathParts.findIndex(part => part === 'payment-receipts');
                                      if (bucketIndex !== -1) {
                                        filePath = pathParts.slice(bucketIndex + 1).join('/');
                                      }
                                    } catch (e) {
                                      console.error('Error parsing receipt URL:', e);
                                    }
                                  }
                                  setSelectedReceipt({
                                    url: `payment-receipts/${filePath}`,
                                    filename: pkg.payment_receipt.filename || 'comprobante.jpg',
                                    title: `Comprobante auto-aprobado - ${pkg.item_description}`
                                  });
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>✅ Historial de Pagos Aprobados</CardTitle>
              <CardDescription>Historial completo de pagos confirmados y en proceso</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedPaymentsLoading ? (
                <div className="text-center py-8">
                  <div className="text-2xl mb-2">⏳</div>
                  <p className="text-muted-foreground">Cargando historial de pagos...</p>
                </div>
              ) : approvedPayments.length === 0 && approvedPrimeMemberships.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">No hay pagos aprobados aún</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Approved Prime Memberships Section */}
                  {approvedPrimeMemberships.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-purple-700">Membresías Prime Procesadas ({approvedPrimeMemberships.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {approvedPrimeMemberships.map(membership => renderPrimeMembershipCard(membership, false))}
                      </div>
                    </div>
                  )}
                  
                  {/* Approved Package Payments Section */}
                  {approvedPayments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-700">Pagos de Paquetes Aprobados ({approvedPayments.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {approvedPayments.map(pkg => renderPaymentCard(pkg, false))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal para ver comprobante */}
      <ReceiptViewerModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptUrl={selectedReceipt?.url}
        filename={selectedReceipt?.filename}
        title={selectedReceipt?.title}
      />
    </div>
  );
}

export default PaymentsTab;