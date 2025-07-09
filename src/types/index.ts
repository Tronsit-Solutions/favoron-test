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
  id: string;
  user_id: string;
  status: 'pending_approval' | 'approved' | 'matched' | 'quote_sent' | 'quote_accepted' | 'quote_rejected' | 'payment_confirmed' | 'payment_pending' | 'in_transit' | 'received_by_traveler' | 'delivered_to_office';
  item_description: string;
  estimated_price?: number;
  item_link?: string;
  purchase_origin: string;
  package_destination: string;
  delivery_deadline: string;
  additional_notes?: string;
  created_at: string;
  matched_trip_id?: string;
  quote?: Quote;
  traveler_address?: Address;
  confirmed_delivery_address?: Address;
  matched_trip_dates?: TripDates;
  purchase_confirmation?: any;
  tracking_info?: any;
  payment_receipt?: any;
  traveler_confirmation?: {
    confirmedAt: string;
    photo?: string;
  };
  office_delivery?: {
    confirmedAt: string;
  };
}

export interface Trip {
  id: string;
  user_id: string;
  status: 'pending_approval' | 'approved' | 'active' | 'completed';
  from_city: string;
  to_city: string;
  departure_date: string;
  arrival_date: string;
  first_day_packages: string;
  last_day_packages: string;
  delivery_date: string;
  package_receiving_address: Address;
  created_at: string;
}

export type UserType = 'user' | 'admin';
export type DocumentType = 'confirmation' | 'tracking' | 'payment_receipt';