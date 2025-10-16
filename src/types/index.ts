export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  phoneNumber?: string;
  whatsappNumber?: string;
  preferredLanguage?: string;
  registrationDate?: string;
  status?: 'active' | 'verified' | 'blocked';
  trustLevel?: 'basic' | 'confiable' | 'prime';
  adminNotes?: string;
  documents?: Document[];
  // Banking information
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankSwiftCode?: string;
  // Additional sensitive data
  documentType?: string;
  documentNumber?: string;
  countryCode?: string;
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
  requestType?: 'online' | 'personal';
  instructions?: string;
  weight?: number;
  declaredValue?: number;
  productPhotos?: Array<{
    filename: string;
    filePath: string;
    bucket: string;
    uploadedAt: string;
    previewUrl?: string;
  }>;
  quantity?: string;
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

// Chat message types
export interface PackageMessage {
  id: string;
  package_id: string;
  user_id: string;
  message_type: 'text' | 'file_upload' | 'status_update';
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
  };
}