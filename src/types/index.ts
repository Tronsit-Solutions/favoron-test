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

// Use Supabase types directly
import { Tables } from '@/integrations/supabase/types';

export type Package = Tables<'packages'>;
export type Trip = Tables<'trips'>;

export type UserType = 'user' | 'admin';
export type DocumentType = 'confirmation' | 'tracking' | 'payment_receipt';