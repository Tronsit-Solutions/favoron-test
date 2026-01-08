import React, { useRef, useEffect } from 'react';
import Autocomplete from 'react-google-autocomplete';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

export interface AddressData {
  streetAddress: string;
  cityArea: string;
  postalCode: string;
  fullAddress: string;
}

interface GoogleAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (addressData: AddressData) => void;
  countryRestriction?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Map country names to ISO codes for Places API
const countryNameToCode: Record<string, string> = {
  'Estados Unidos': 'us',
  'USA': 'us',
  'United States': 'us',
  'México': 'mx',
  'Mexico': 'mx',
  'Guatemala': 'gt',
  'España': 'es',
  'Spain': 'es',
  'Canadá': 'ca',
  'Canada': 'ca',
  'Reino Unido': 'gb',
  'UK': 'gb',
  'United Kingdom': 'gb',
  'Francia': 'fr',
  'France': 'fr',
  'Alemania': 'de',
  'Germany': 'de',
  'Italia': 'it',
  'Italy': 'it',
  'China': 'cn',
  'Japón': 'jp',
  'Japan': 'jp',
  'Corea del Sur': 'kr',
  'South Korea': 'kr',
};

const parseAddressComponents = (place: google.maps.places.PlaceResult): AddressData => {
  let streetNumber = '';
  let route = '';
  let locality = '';
  let adminArea = '';
  let postalCode = '';

  const addressComponents = place.address_components || [];

  addressComponents.forEach((component) => {
    const types = component.types;
    
    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      route = component.long_name;
    }
    if (types.includes('locality')) {
      locality = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      adminArea = component.short_name;
    }
    if (types.includes('postal_code')) {
      postalCode = component.long_name;
    }
  });

  const streetAddress = streetNumber && route 
    ? `${streetNumber} ${route}` 
    : route || streetNumber;
  
  const cityArea = locality && adminArea 
    ? `${locality}, ${adminArea}` 
    : locality || adminArea;

  return {
    streetAddress,
    cityArea,
    postalCode,
    fullAddress: place.formatted_address || streetAddress,
  };
};

export const GoogleAddressInput: React.FC<GoogleAddressInputProps> = ({
  value,
  onChange,
  onPlaceSelected,
  countryRestriction,
  placeholder = 'Buscar dirección...',
  className,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const countryCode = countryRestriction 
    ? countryNameToCode[countryRestriction] || countryRestriction.toLowerCase().slice(0, 2)
    : undefined;

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.address_components) {
      const addressData = parseAddressComponents(place);
      onChange(addressData.streetAddress || place.formatted_address || '');
      onPlaceSelected(addressData);
    }
  };

  // Prevent Radix Dialog from capturing clicks on Google Places dropdown
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.pac-container')) {
        e.stopPropagation();
      }
    };

    // Use capture phase to intercept before Radix
    document.addEventListener('mousedown', handleMouseDown, true);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
    };
  }, []);

  // Sync value to input when it changes externally
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
      <Autocomplete
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        onPlaceSelected={handlePlaceSelected}
        options={{
          types: ['address'],
          componentRestrictions: countryCode ? { country: countryCode } : undefined,
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
        }}
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={inputRef as any}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </div>
  );
};

export default GoogleAddressInput;
