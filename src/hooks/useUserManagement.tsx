
import { useState, useMemo, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Extended User type for management purposes that includes the Supabase profile UUID
interface UserWithProfileId extends User {
  profileId?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithProfileId[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch users from Supabase using the admin function
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching all users via admin function...');
      
      // Use the new admin function to get all users efficiently
      const { data: profiles, error } = await supabase.rpc('admin_view_all_users', {
        _access_reason: 'User management dashboard access'
      });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Users fetched successfully:', profiles?.length);

      const formattedUsers: UserWithProfileId[] = profiles?.map((profile: any, index: number) => {
        // Map roles correctly
        let role: 'user' | 'admin' = 'user';
        if (profile.user_role === 'admin') {
          role = 'admin';
        } else {
          role = 'user'; // Default for regular users
        }

        return {
          id: index + 1, // Using index as ID since our types expect number
          profileId: profile.id, // Store the real UUID for database operations
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario Sin Nombre',
          email: profile.email || 'Email no disponible',
          username: profile.username || undefined,
          avatarUrl: profile.avatar_url, // Include avatar URL from profiles
          avatar_url: profile.avatar_url, // Also include in snake_case for compatibility
          role,
          phoneNumber: profile.phone_number || undefined,
          whatsappNumber: profile.phone_number || undefined,
          registrationDate: profile.created_at,
          status: 'verified' as const, // Since they have profiles, assume verified
          trustLevel: profile.trust_level === 'verified' ? 'premium' as const : 
                     profile.trust_level === 'prime' ? 'prime' as const :
                     profile.trust_level === 'earned' ? 'trusted' as const : 'basic' as const,
          adminNotes: '',
          // Banking information now included
          bankAccountHolder: profile.bank_account_holder || undefined,
          bankName: profile.bank_name || undefined,
          bankAccountType: profile.bank_account_type || undefined,
          bankAccountNumber: profile.bank_account_number || undefined,
          bankSwiftCode: profile.bank_swift_code || undefined,
          // Additional sensitive data
          documentType: profile.document_type || undefined,
          documentNumber: profile.document_number || undefined,
          countryCode: profile.country_code || '+502'
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

  const updateTrustLevel = async (
    userId: number, 
    trustLevel: User['trustLevel'],
    primePaymentInfo?: {
      isPaid: boolean;
      paymentReference?: string;
      notes?: string;
    }
  ) => {
    try {
      // Find the user's profile ID from the users array
      const user = users.find(u => u.id === userId);
      if (!user || !user.profileId) {
        console.error('User or profile ID not found');
        return;
      }

      // Map the trust level to the database enum
      const dbTrustLevel = trustLevel === 'premium' ? 'verified' :
                          trustLevel === 'trusted' ? 'earned' : 
                          trustLevel === 'prime' ? 'prime' : 'basic';

      // If setting to prime, use the RPC function which handles everything
      if (dbTrustLevel === 'prime') {
        const { error: rpcError } = await supabase.rpc('admin_assign_prime_membership', {
          _target_user_id: user.profileId,
          _is_paid: primePaymentInfo?.isPaid ?? false,
          _payment_reference: primePaymentInfo?.paymentReference || null,
          _notes: primePaymentInfo?.notes || null
        });

        if (rpcError) {
          console.error('Error assigning Prime membership via RPC:', rpcError);
          return;
        }

        console.log('Prime membership assigned successfully via RPC');
      } else {
        // For other trust levels, update the profile directly
        const updateData: any = { 
          trust_level: dbTrustLevel,
          prime_expires_at: null // Clear prime expiration if not prime
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.profileId);

        if (profileError) {
          console.error('Error updating trust level:', profileError);
          return;
        }

        console.log('Trust level updated successfully to:', dbTrustLevel);
      }

      // Update local state
      updateUser(userId, { trustLevel });
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
