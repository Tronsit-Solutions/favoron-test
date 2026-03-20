import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const PERMISSION_KEYS = {
  discounts: 'Códigos Promocionales',
  surveys: 'Encuestas',
  referrals: 'Programa de Referidos',
  cx: 'Customer Experience',
  reports: 'Reportes Financieros',
  users: 'Gestión de Usuarios',
  platform_fees: 'Tarifas',
  delivery_points: 'Puntos de Entrega',
  banking: 'Info Bancaria',
  applications: 'Aplicaciones',
  operations: 'Operaciones',
} as const;

export type PermissionKey = keyof typeof PERMISSION_KEYS;

export const useUserPermissions = () => {
  const { user, userRole } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = userRole?.role === 'admin';

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    if (isAdmin) {
      // Admin has all permissions
      setPermissions(Object.keys(PERMISSION_KEYS));
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('user_custom_roles')
          .select('custom_role_id, custom_roles:custom_role_id(id, role_permissions(permission_key))')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching permissions:', error);
          setPermissions([]);
        } else {
          const keys = new Set<string>();
          data?.forEach((ucr: any) => {
            ucr.custom_roles?.role_permissions?.forEach((rp: any) => {
              keys.add(rp.permission_key);
            });
          });
          setPermissions(Array.from(keys));
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, isAdmin]);

  const hasPermission = useCallback(
    (key: PermissionKey) => isAdmin || permissions.includes(key),
    [isAdmin, permissions]
  );

  const hasAnyPermission = useCallback(
    () => isAdmin || permissions.length > 0,
    [isAdmin, permissions]
  );

  return { permissions, hasPermission, hasAnyPermission, loading, isAdmin };
};
