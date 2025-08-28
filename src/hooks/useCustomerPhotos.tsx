import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustomerPhoto {
  id: string;
  image_url: string;
  customer_name?: string;
  product_description: string;
  status: 'pending' | 'approved' | 'rejected';
  sort_order: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export const useCustomerPhotos = (isAdmin: boolean = false) => {
  const [photos, setPhotos] = useState<CustomerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const CACHE_KEY = `customer_photos_cache_${isAdmin ? 'admin' : 'public'}`;
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  const getCachedPhotos = (): { data: CustomerPhoto[]; timestamp: number } | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (now - parsed.timestamp < CACHE_DURATION) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Error reading cached photos:', error);
    }
    return null;
  };

  const setCachedPhotos = (data: CustomerPhoto[]) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error caching photos:', error);
    }
  };

  const invalidateCache = () => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      // Also clear the opposite cache (admin/public)
      const oppositeKey = `customer_photos_cache_${isAdmin ? 'public' : 'admin'}`;
      sessionStorage.removeItem(oppositeKey);
    } catch (error) {
      console.warn('Error invalidating photo cache:', error);
    }
  };

  const fetchPhotos = async (force = false): Promise<void> => {
    // Check cache first unless force refresh
    if (!force) {
      const cached = getCachedPhotos();
      if (cached) {
        console.log('📸 Using cached customer photos');
        setPhotos(cached.data);
        setLoading(false);
        return;
      }
    }

    try {
      console.log('📸 Fetching customer photos from database');
      
      let query = supabase
        .from('customer_photos')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      // If not admin, only fetch approved photos
      if (!isAdmin) {
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      const photosData = (data || []) as CustomerPhoto[];
      console.log(`✅ Customer photos fetched successfully: ${photosData.length} photos`);
      setPhotos(photosData);
      setCachedPhotos(photosData);
    } catch (fetchError) {
      console.error('❌ Error fetching photos:', fetchError);
      
      // Use empty array on error to prevent blocking
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, customerName: string, productDescription: string, approveDirectly: boolean = false) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase
        .from('customer_photos')
        .insert({
          image_url: publicUrl,
          customer_name: customerName || null,
          product_description: productDescription,
          status: approveDirectly ? 'approved' : 'pending',
          sort_order: 0
        });

      if (dbError) throw dbError;

      toast({
        title: "¡Éxito!",
        description: approveDirectly ? "Foto subida y aprobada" : "Foto subida, pendiente de aprobación",
      });

      invalidateCache();
      fetchPhotos(true);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive",
      });
    }
  };

  const updatePhotoStatus = async (photoId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('customer_photos')
        .update({ status })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "¡Actualizado!",
        description: `Foto ${status === 'approved' ? 'aprobada' : 'rechazada'}`,
      });

      invalidateCache();
      fetchPhotos(true);
    } catch (error) {
      console.error('Error updating photo status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const deletePhoto = async (photoId: string, imageUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('customer-photos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('customer_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: "¡Eliminado!",
        description: "Foto eliminada correctamente",
      });

      invalidateCache();
      fetchPhotos(true);
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive",
      });
    }
  };

  const updateSortOrder = async (photoId: string, newSortOrder: number) => {
    try {
      const { error } = await supabase
        .from('customer_photos')
        .update({ sort_order: newSortOrder })
        .eq('id', photoId);

      if (error) throw error;

      invalidateCache();
      fetchPhotos(true);
    } catch (error) {
      console.error('Error updating sort order:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Only fetch once on mount, use cache after that
    fetchPhotos();
  }, [isAdmin]);

  return {
    photos,
    loading,
    uploadPhoto,
    updatePhotoStatus,
    deletePhoto,
    updateSortOrder,
    refetch: (force = false) => fetchPhotos(force),
    invalidateCache
  };
};