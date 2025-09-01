import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FormLabels } from './FormTextElements';

// Simplified select components for better Visual Edits compatibility

export const PackageDestinationSelect = ({ 
  value, 
  onChange, 
  destinations 
}: { 
  value: string;
  onChange: (value: string) => void;
  destinations: string[];
}) => (
  <div className="space-y-2">
    <Label htmlFor="package-destination">
      <FormLabels.PackageDestination />
    </Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        id="package-destination"
        className="w-full bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary"
      >
        <SelectValue placeholder="Selecciona un destino" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg">
        {destinations.map((destination) => (
          <SelectItem 
            key={destination} 
            value={destination}
            className="hover:bg-gray-50 cursor-pointer text-gray-900"
          >
            {destination}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const PurchaseOriginSelect = ({ 
  value, 
  onChange, 
  origins 
}: { 
  value: string;
  onChange: (value: string) => void;
  origins: string[];
}) => (
  <div className="space-y-2">
    <Label htmlFor="purchase-origin">
      <FormLabels.PurchaseOrigin />
    </Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        id="purchase-origin"
        className="w-full bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary"
      >
        <SelectValue placeholder="Selecciona origen de compra" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg">
        {origins.map((origin) => (
          <SelectItem 
            key={origin} 
            value={origin}
            className="hover:bg-gray-50 cursor-pointer text-gray-900"
          >
            {origin}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const DeliveryMethodSelect = ({ 
  value, 
  onChange 
}: { 
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor="delivery-method">
      <FormLabels.DeliveryMethod />
    </Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        id="delivery-method"
        className="w-full bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary"
      >
        <SelectValue placeholder="Selecciona método de entrega" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg">
        <SelectItem 
          value="pickup" 
          className="hover:bg-gray-50 cursor-pointer text-gray-900"
        >
          Recoger en punto de encuentro
        </SelectItem>
        <SelectItem 
          value="home_delivery" 
          className="hover:bg-gray-50 cursor-pointer text-gray-900"
        >
          Entrega a domicilio
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export const QuantitySelect = ({ 
  value, 
  onChange 
}: { 
  value: number;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor="quantity">
      <FormLabels.ProductQuantity />
    </Label>
    <Select value={value.toString()} onValueChange={onChange}>
      <SelectTrigger 
        id="quantity"
        className="w-full bg-white border-gray-300 text-gray-900 focus:border-primary focus:ring-primary"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg">
        {[1, 2, 3, 4, 5].map((num) => (
          <SelectItem 
            key={num} 
            value={num.toString()}
            className="hover:bg-gray-50 cursor-pointer text-gray-900"
          >
            {num}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);