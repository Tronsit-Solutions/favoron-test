import { useState, useMemo, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          trust_level,
          created_at
        `);

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get auth users to get email information
      let authUsersData: any[] = [];
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        authUsersData = authUsers?.users || [];
      } catch (error) {
        console.log('Could not fetch auth users, continuing with profiles only');
      }

      const formattedUsers: User[] = profiles?.map((profile: any, index: number) => {
        const userRole = userRoles?.find(role => role.user_id === profile.id);
        const authUser = authUsersData.find(auth => auth.id === profile.id);
        
        // Map roles correctly
        let role: 'shopper' | 'traveler' | 'admin' = 'shopper';
        if (userRole?.role === 'admin') {
          role = 'admin';
        } else {
          role = 'shopper'; // Default for regular users
        }

        return {
          id: index + 1, // Using index as ID since our types expect number
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario Sin Nombre',
          email: authUser?.email || 'Email no disponible',
          role,
          phoneNumber: profile.phone_number || undefined,
          whatsappNumber: profile.phone_number || undefined,
          registrationDate: profile.created_at,
          status: authUser?.email_confirmed_at ? 'verified' as const : 'active' as const,
          trustLevel: profile.trust_level === 'verified' ? 'premium' as const : 
                     profile.trust_level === 'earned' ? 'trusted' as const : 'basic' as const,
          adminNotes: ''
        };
      }) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const updateUser = (userId: number, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
  };

  const updateUserStatus = (userId: number, status: User['status']) => {
    updateUser(userId, { status });
  };

  const updateTrustLevel = (userId: number, trustLevel: User['trustLevel']) => {
    updateUser(userId, { trustLevel });
  };

  const updateAdminNotes = (userId: number, adminNotes: string) => {
    updateUser(userId, { adminNotes });
  };

  return {
    users: filteredUsers,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter, 
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    updateUser,
    updateUserStatus,
    updateTrustLevel,
    updateAdminNotes,
    refreshUsers: fetchUsers
  };
};