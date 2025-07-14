import { useState, useMemo, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Extended User type for management purposes that includes the Supabase profile UUID
interface UserWithProfileId extends User {
  profileId?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithProfileId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from Supabase...');
      
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

      console.log('Profiles fetched:', profiles);
      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      // Get user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('User roles fetched:', userRoles);
      if (rolesError) {
        console.error('Roles error:', rolesError);
        throw rolesError;
      }

      // Since we can't access auth.users from client, we'll need to store email in profiles
      // For now, let's check if we can get current user's email and use a placeholder for others
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser);

      const formattedUsers: UserWithProfileId[] = profiles?.map((profile: any, index: number) => {
        const userRole = userRoles?.find(role => role.user_id === profile.id);
        
        // Map roles correctly
        let role: 'user' | 'admin' = 'user';
        if (userRole?.role === 'admin') {
          role = 'admin';
        } else {
          role = 'user'; // Default for regular users
        }

        // If this profile matches current user, use their email, otherwise use placeholder
        const email = profile.id === currentUser?.id ? currentUser.email : `usuario-${profile.id.slice(0, 8)}@email.com`;

        return {
          id: index + 1, // Using index as ID since our types expect number
          profileId: profile.id, // Store the real UUID for database operations
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario Sin Nombre',
          email: email || 'Email no disponible',
          role,
          phoneNumber: profile.phone_number || undefined,
          whatsappNumber: profile.phone_number || undefined,
          registrationDate: profile.created_at,
          status: 'verified' as const, // Since they have profiles, assume verified
          trustLevel: profile.trust_level === 'verified' ? 'premium' as const : 
                     profile.trust_level === 'earned' ? 'trusted' as const : 'basic' as const,
          adminNotes: ''
        };
      }) || [];

      console.log('Formatted users:', formattedUsers);
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

  const updateUser = (userId: number, updates: Partial<UserWithProfileId>) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
  };

  const updateUserStatus = async (userId: number, status: User['status']) => {
    try {
      // For now, just update local state since status is not in the profiles table
      // You might want to add a status column to profiles table in the future
      updateUser(userId, { status });
      console.log('User status updated locally');
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updateTrustLevel = async (userId: number, trustLevel: User['trustLevel']) => {
    try {
      // Find the user's profile ID from the users array
      const user = users.find(u => u.id === userId);
      if (!user || !user.profileId) {
        console.error('User or profile ID not found');
        return;
      }

      // Map the trust level to the database enum
      const dbTrustLevel = trustLevel === 'premium' ? 'verified' :
                          trustLevel === 'trusted' ? 'earned' : 'basic';

      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ trust_level: dbTrustLevel })
        .eq('id', user.profileId);

      if (error) {
        console.error('Error updating trust level:', error);
        return;
      }

      // Update local state
      updateUser(userId, { trustLevel });
      console.log('Trust level updated successfully');
    } catch (error) {
      console.error('Error updating trust level:', error);
    }
  };

  const updateAdminNotes = async (userId: number, adminNotes: string) => {
    try {
      // For now, just update local state since admin_notes is not in the profiles table
      // You might want to add an admin_notes column to profiles table in the future
      updateUser(userId, { adminNotes });
      console.log('Admin notes updated locally');
    } catch (error) {
      console.error('Error updating admin notes:', error);
    }
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