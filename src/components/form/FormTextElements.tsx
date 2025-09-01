import React from 'react';
import { Package } from 'lucide-react';

// Static text components that are easily selectable in Visual Edits

export const FormTitles = {
  NewRequest: () => (
    <span className="flex items-center space-x-2">
      <Package className="h-5 w-5 text-primary" />
      <span>Nueva Solicitud de Paquete</span>
    </span>
  ),
  
  EditRequest: ({ requestId }: { requestId?: string }) => (
    <span className="flex items-center space-x-2">
      <Package className="h-5 w-5 text-primary" />
      <span>Editar Solicitud {requestId ? `#${requestId}` : ''}</span>
    </span>
  ),

  MobileTitle: ({ editMode }: { editMode: boolean }) => (
    <h2 className="text-lg font-semibold text-center flex-1">
      {editMode ? 'Editar Solicitud' : 'Nueva Solicitud'}
    </h2>
  )
};

export const FormDescriptions = {
  NewRequest: () => (
    <p className="text-sm text-muted-foreground">
      Completa la información del producto que necesitas y recibirás una cotización de un viajero.
    </p>
  ),
  
  EditRequest: () => (
    <p className="text-sm text-muted-foreground">
      Modifica la información de tu solicitud. Puedes agregar más productos.
    </p>
  )
};

export const FormLabels = {
  Products: ({ count }: { count: number }) => (
    <span className="text-base font-medium">Productos * ({count}/5)</span>
  ),
  
  ProductNumber: ({ index }: { index: number }) => (
    <span className="text-sm font-medium">Producto #{index + 1}</span>
  ),
  
  ProductLink: () => (
    <span className="text-sm font-medium">Link del producto *</span>
  ),
  
  ProductDescription: () => (
    <span className="text-sm font-medium">Descripción *</span>
  ),
  
  ProductPrice: () => (
    <span className="text-sm font-medium">Precio estimado (USD) *</span>
  ),
  
  ProductQuantity: () => (
    <span className="text-sm font-medium">Cantidad *</span>
  ),
  
  PackageDestination: () => (
    <span className="text-sm font-medium">¿A dónde debe llegar el paquete? *</span>
  ),
  
  PurchaseOrigin: () => (
    <span className="text-sm font-medium">¿En qué país o ciudad debe comprarse? *</span>
  ),
  
  DeliveryMethod: () => (
    <span className="text-sm font-medium">Método de entrega *</span>
  ),
  
  DeliveryDeadline: () => (
    <span className="text-sm font-medium">¿Tienes fecha límite de entrega?</span>
  ),
  
  AdditionalNotes: () => (
    <span className="text-sm font-medium">Notas adicionales</span>
  )
};

export const FormHelpers = {
  ProductLinkPlaceholder: () => (
    <span className="text-sm text-gray-500">
      https://amazon.com/producto-ejemplo
    </span>
  ),
  
  ProductDescriptionPlaceholder: () => (
    <span className="text-sm text-gray-500">
      Ejemplo: iPhone 15 Pro Max 256GB color negro
    </span>
  ),
  
  PricePlaceholder: () => (
    <span className="text-sm text-gray-500">
      199.99
    </span>
  ),
  
  NotesPlaceholder: () => (
    <span className="text-sm text-gray-500">
      Cualquier información adicional sobre el producto, preferencias de marca, color, etc.
    </span>
  )
};

export const FormMessages = {
  TotalEstimated: ({ total }: { total: string }) => (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">Total estimado:</span>
      <span className="font-semibold text-primary">${total} USD</span>
    </div>
  ),
  
  ProcessExplanation: () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-semibold text-blue-900">📋 Cómo funciona:</h4>
      <ul className="text-xs text-blue-800 space-y-1">
        <li>• Envías tu solicitud con los productos que necesitas</li>
        <li>• Los viajeros verificados te envían cotizaciones</li>
        <li>• Eliges la mejor opción y realizas el pago seguro</li>
        <li>• Recibes tu paquete en la dirección indicada</li>
      </ul>
    </div>
  ),
  
  AddressWarning: () => (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
      <p className="text-xs text-amber-800">
        ⚠️ <strong>Importante:</strong> La entrega a domicilio puede tener costos adicionales que serán incluidos en las cotizaciones.
      </p>
    </div>
  )
};

export const ButtonTexts = {
  Add: () => <span>Agregar</span>,
  Remove: () => <span className="text-xs">Eliminar</span>,
  Cancel: () => <span>Cancelar</span>,
  Submit: () => <span>Enviar Solicitud</span>,
  Update: () => <span>Actualizar Solicitud</span>,
  ConfirmAddress: () => <span>Confirmar Dirección</span>
};