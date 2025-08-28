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

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
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

      if (error) throw error;
      setPhotos((data || []) as CustomerPhoto[]);
    } catch (error) {
      console.error('Error fetching customer photos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos",
        variant: "destructive",
      });
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

      fetchPhotos();
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

      fetchPhotos();
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

      fetchPhotos();
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

      fetchPhotos();
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
    fetchPhotos();
  }, [isAdmin]);

  return {
    photos,
    loading,
    uploadPhoto,
    updatePhotoStatus,
    deletePhoto,
    updateSortOrder,
    refetch: fetchPhotos
  };
};