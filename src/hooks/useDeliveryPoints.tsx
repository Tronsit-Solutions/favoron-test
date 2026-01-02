import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryPoint {
  id: string;
  name: string;
  city: string;
  country: string;
  address_line_1: string | null;
  address_line_2: string | null;
  postal_code: string | null;
  state_province: string | null;
  phone_number: string | null;
  email: string | null;
  schedule: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPointInsert {
  name: string;
  city: string;
  country: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  state_province?: string | null;
  phone_number?: string | null;
  email?: string | null;
  schedule?: string | null;
  instructions?: string | null;
  is_active?: boolean;
}

export interface DeliveryPointUpdate {
  name?: string;
  city?: string;
  country?: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  state_province?: string | null;
  phone_number?: string | null;
  email?: string | null;
  schedule?: string | null;
  instructions?: string | null;
  is_active?: boolean;
}

export const useDeliveryPoints = () => {
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDeliveryPoints = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_points')
        .select('*')
        .order('country', { ascending: true })
        .order('city', { ascending: true });

      if (error) throw error;
      setDeliveryPoints((data || []) as DeliveryPoint[]);
    } catch (error: any) {
      console.error('Error fetching delivery points:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los puntos de entrega",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDeliveryPointByCity = useCallback((city: string, country: string) => {
    const normalizedCity = city.toLowerCase().trim();
    const normalizedCountry = country.toLowerCase().trim();
    
    return deliveryPoints.find(dp => 
      dp.city.toLowerCase().trim() === normalizedCity &&
      dp.country.toLowerCase().trim() === normalizedCountry &&
      dp.is_active
    );
  }, [deliveryPoints]);

  const getDeliveryPointsByCountry = useCallback((country: string) => {
    const normalizedCountry = country.toLowerCase().trim();
    
    return deliveryPoints.filter(dp => 
      dp.country.toLowerCase().trim() === normalizedCountry &&
      dp.is_active
    );
  }, [deliveryPoints]);

  const createDeliveryPoint = async (data: DeliveryPointInsert) => {
    try {
      const { data: newPoint, error } = await supabase
        .from('delivery_points')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      setDeliveryPoints(prev => [...prev, newPoint as DeliveryPoint]);
      toast({
        title: "Éxito",
        description: "Punto de entrega creado correctamente",
      });
      
      return newPoint as DeliveryPoint;
    } catch (error: any) {
      console.error('Error creating delivery point:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el punto de entrega",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDeliveryPoint = async (id: string, updates: DeliveryPointUpdate) => {
    try {
      const { data, error } = await supabase
        .from('delivery_points')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setDeliveryPoints(prev => prev.map(dp => 
        dp.id === id ? { ...dp, ...data } as DeliveryPoint : dp
      ));
      
      toast({
        title: "Éxito",
        description: "Punto de entrega actualizado correctamente",
      });
      
      return data as DeliveryPoint;
    } catch (error: any) {
      console.error('Error updating delivery point:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el punto de entrega",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDeliveryPoint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('delivery_points')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDeliveryPoints(prev => prev.filter(dp => dp.id !== id));
      toast({
        title: "Éxito",
        description: "Punto de entrega eliminado correctamente",
      });
    } catch (error: any) {
      console.error('Error deleting delivery point:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el punto de entrega",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDeliveryPoints();
  }, [fetchDeliveryPoints]);

  return {
    deliveryPoints,
    loading,
    fetchDeliveryPoints,
    getDeliveryPointByCity,
    getDeliveryPointsByCountry,
    createDeliveryPoint,
    updateDeliveryPoint,
    deleteDeliveryPoint,
  };
};
