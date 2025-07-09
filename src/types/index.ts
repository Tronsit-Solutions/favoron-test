export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  role: 'user' | 'admin';
  phoneNumber?: string;
  whatsappNumber?: string;
  preferredLanguage?: string;
  registrationDate?: string;
  status?: 'active' | 'verified' | 'blocked';
  trustLevel?: 'basic' | 'trusted' | 'premium';
  adminNotes?: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  type: 'dpi' | 'passport' | 'other';
  filename: string;
  uploadDate: string;
  verified?: boolean;
}

export interface Address {
  streetAddress: string;
  cityArea: string;
  hotelAirbnbName?: string;
  contactNumber: string;
}

export interface Product {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
}

export interface Quote {
  price?: string;
  serviceFee?: string;
  totalPrice?: string;
  message?: string;
}

export interface TripDates {
  firstDayPackages: string;
  lastDayPackages: string;
  deliveryDate: string;
  arrivalDate: string;
}

export interface Package {
  id: number;
  userId: number;
  status: 'pending_approval' | 'approved' | 'matched' | 'quote_sent' | 'quote_accepted' | 'quote_rejected' | 'payment_confirmed' | 'payment_pending' | 'in_transit' | 'received_by_traveler' | 'delivered_to_office';
  itemDescription?: string;
  estimatedPrice?: string;
  itemLink?: string;
  products?: Product[];
  purchaseOrigin: string;
  packageDestination: string;
  deliveryDeadline: string;
  additionalNotes?: string;
  createdAt: string;
  matchedTripId?: number;
  quote?: Quote;
  travelerAddress?: Address;
  confirmedDeliveryAddress?: Address;
  matchedTripDates?: TripDates;
  purchaseConfirmation?: any;
  trackingInfo?: any;
  paymentReceipt?: any;
  travelerConfirmation?: {
    confirmedAt: string;
    photo?: string;
  };
  officeDelivery?: {
    confirmedAt: string;
  };
}

export interface Trip {
  id: number;
  userId: number;
  status: 'pending_approval' | 'approved' | 'active' | 'completed';
  fromCity: string;
  toCity: string;
  departureDate: string;
  arrivalDate: string;
  firstDayPackages: string;
  lastDayPackages: string;
  deliveryDate: string;
  packageReceivingAddress: Address;
  createdAt: string;
}

export type UserType = 'user' | 'admin';
export type DocumentType = 'confirmation' | 'tracking' | 'payment_receipt';