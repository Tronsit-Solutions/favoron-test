
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Extended User type for management purposes that includes the Supabase profile UUID
interface UserWithProfileId extends User {
  profileId?: string;
  avatarUrl?: string;
  avatar_url?: string;
}

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithProfileId[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isServerSearch, setIsServerSearch] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Debounce ref for search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Store original paginated users to restore when search is cleared
  const paginatedUsersRef = useRef<UserWithProfileId[]>([]);

  // Format profile data to user format
  const formatProfile = (profile: any, index: number): UserWithProfileId => {
    let role: 'user' | 'admin' | 'operations' = 'user';
    if (profile.user_role === 'admin') {
      role = 'admin';
    } else if (profile.user_role === 'operations') {
      role = 'operations';
    }

    return {
      id: index + 1,
      profileId: profile.id,
      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario Sin Nombre',
      email: profile.email || 'Email no disponible',
      username: profile.username || undefined,
      avatarUrl: profile.avatar_url,
      avatar_url: profile.avatar_url,
      role,
      phoneNumber: profile.phone_number || undefined,
      whatsappNumber: profile.phone_number || undefined,
      registrationDate: profile.created_at,
      status: (profile.is_banned && (!profile.banned_until || new Date(profile.banned_until) > new Date())) 
        ? 'blocked' as const 
        : 'verified' as const,
      trustLevel: profile.trust_level === 'confiable' ? 'confiable' as const :
                 profile.trust_level === 'prime' ? 'prime' as const : 'basic' as const,
      adminNotes: '',
      bankAccountHolder: profile.bank_account_holder || undefined,
      bankName: profile.bank_name || undefined,
      bankAccountType: profile.bank_account_type || undefined,
      bankAccountNumber: profile.bank_account_number || undefined,
      bankSwiftCode: profile.bank_swift_code || undefined,
      documentType: profile.document_type || undefined,
      documentNumber: profile.document_number || undefined,
      countryCode: profile.country_code || '+502',
      is_banned: profile.is_banned || false,
      banned_until: profile.banned_until || undefined,
      ban_reason: profile.ban_reason || undefined,
      banned_by: profile.banned_by || undefined,
      banned_at: profile.banned_at || undefined
    };
  };

  // Fetch initial users with pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users with pagination...');
      
      // Get total count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setTotalCount(count ?? 0);
      console.log('Total users count:', count);
      
      // Fetch first page ordered by most recent
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          username,
          avatar_url,
          phone_number,
          country_code,
          created_at,
          trust_level,
          document_type,
          document_number,
          is_banned,
          banned_until,
          ban_reason,
          banned_by,
          banned_at
        `)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Fetch roles separately
      const userIds = profiles?.map(p => p.id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Fetch banking info
      const { data: financialData } = await supabase
        .from('user_financial_data')
        .select('user_id, bank_account_holder, bank_name, bank_account_type, bank_account_number, bank_swift_code, document_type, document_number')
        .in('user_id', userIds);

      // Merge data
      const profilesWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const financial = financialData?.find(f => f.user_id === profile.id);
        return {
          ...profile,
          user_role: userRole?.role || 'user',
          bank_account_holder: financial?.bank_account_holder,
          bank_name: financial?.bank_name,
          bank_account_type: financial?.bank_account_type,
          bank_account_number: financial?.bank_account_number,
          bank_swift_code: financial?.bank_swift_code,
          document_type: profile.document_type || financial?.document_type,
          document_number: profile.document_number || financial?.document_number
        };
      }) || [];

      const formattedUsers = profilesWithRoles.map((profile, index) => formatProfile(profile, index));
      
      console.log('Users fetched:', formattedUsers.length);
      setUsers(formattedUsers);
      paginatedUsersRef.current = formattedUsers; // Store for restoring after search
      setHasMore(formattedUsers.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Server-side search function
  const searchUsersInDatabase = useCallback(async (term: string) => {
    if (term.length < 2) {
      // Restore paginated users when search is cleared
      setIsServerSearch(false);
      setUsers(paginatedUsersRef.current);
      return;
    }

    try {
      setSearching(true);
      setIsServerSearch(true);
      console.log('Searching users in database for:', term);

      // Search across multiple fields using OR conditions
      const searchPattern = `%${term}%`;
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          username,
          avatar_url,
          phone_number,
          country_code,
          created_at,
          trust_level,
          is_banned,
          banned_until,
          ban_reason,
          banned_by,
          banned_at
        `)
        .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern},phone_number.ilike.${searchPattern},username.ilike.${searchPattern}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch roles and financial data for found users
      const userIds = profiles.map(p => p.id);
      const [{ data: roles }, { data: financialData }] = await Promise.all([
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_financial_data').select('user_id, bank_account_holder, bank_name, bank_account_type, bank_account_number, bank_swift_code, document_type, document_number').in('user_id', userIds)
      ]);

      const profilesWithRoles = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const financial = financialData?.find(f => f.user_id === profile.id);
        return {
          ...profile,
          user_role: userRole?.role || 'user',
          bank_account_holder: financial?.bank_account_holder,
          bank_name: financial?.bank_name,
          bank_account_type: financial?.bank_account_type,
          bank_account_number: financial?.bank_account_number,
          bank_swift_code: financial?.bank_swift_code,
          document_type: financial?.document_type,
          document_number: financial?.document_number
        };
      });

      const formattedUsers = profilesWithRoles.map((profile, index) => formatProfile(profile, index));
      console.log('Search results:', formattedUsers.length);
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search handler
  const handleSearchTermChange = useCallback((term: string) => {
    setSearchTerm(term);

    // Clear existing timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // If term is empty or less than 2 chars, restore immediately
    if (term.length < 2) {
      setIsServerSearch(false);
      setUsers(paginatedUsersRef.current);
      return;
    }

    // Debounce the search
    searchDebounceRef.current = setTimeout(() => {
      searchUsersInDatabase(term);
    }, SEARCH_DEBOUNCE_MS);
  }, [searchUsersInDatabase]);

  // Load more users
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const currentCount = users.length;
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          username,
          avatar_url,
          phone_number,
          country_code,
          created_at,
          trust_level,
          is_banned,
          banned_until,
          ban_reason,
          banned_by,
          banned_at
        `)
        .order('created_at', { ascending: false })
        .range(currentCount, currentCount + PAGE_SIZE - 1);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        setHasMore(false);
        return;
      }

      // Fetch roles and financial data for new users
      const userIds = profiles.map(p => p.id);
      const [{ data: roles }, { data: financialData }] = await Promise.all([
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        supabase.from('user_financial_data').select('user_id, bank_account_holder, bank_name, bank_account_type, bank_account_number, bank_swift_code, document_type, document_number').in('user_id', userIds)
      ]);

      const profilesWithRoles = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const financial = financialData?.find(f => f.user_id === profile.id);
        return {
          ...profile,
          user_role: userRole?.role || 'user',
          bank_account_holder: financial?.bank_account_holder,
          bank_name: financial?.bank_name,
          bank_account_type: financial?.bank_account_type,
          bank_account_number: financial?.bank_account_number,
          bank_swift_code: financial?.bank_swift_code,
          document_type: financial?.document_type,
          document_number: financial?.document_number
        };
      });

      const newUsers = profilesWithRoles.map((profile, index) => 
        formatProfile(profile, currentCount + index)
      );

      setUsers(prev => [...prev, ...newUsers]);
      setHasMore(profiles.length >= PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more users:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [users.length, loadingMore, hasMore]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // For server-side search, only apply role/status filters locally
  // For local search (when search term < 2 chars), also filter by search term
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // When in server search mode, search is already done server-side
      // Only apply local search filter when NOT in server search mode
      const matchesSearch = isServerSearch || searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter, isServerSearch]);

  const updateUser = (userId: number, updates: Partial<UserWithProfileId>) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
  };

  const updateUserStatus = async (userId: number, status: User['status']) => {
    try {
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
      const user = users.find(u => u.id === userId);
      if (!user || !user.profileId) {
        throw new Error('User or profile ID not found');
      }

      const dbTrustLevel = trustLevel === 'confiable' ? 'confiable' :
                          trustLevel === 'prime' ? 'prime' : 'basic';

      if (dbTrustLevel === 'prime') {
        const { error: rpcError } = await supabase.rpc('admin_assign_prime_membership', {
          _target_user_id: user.profileId,
          _is_paid: primePaymentInfo?.isPaid ?? false,
          _payment_reference: primePaymentInfo?.paymentReference || null,
          _notes: primePaymentInfo?.notes || null
        });

        if (rpcError) throw rpcError;
      } else {
        const { error: rpcError } = await supabase.rpc('admin_update_trust_level', {
          _target_user_id: user.profileId,
          _trust_level: dbTrustLevel
        });

        if (rpcError) throw rpcError;
      }

      updateUser(userId, { trustLevel });
      await fetchUsers();
    } catch (error) {
      console.error('Error updating trust level:', error);
      throw error;
    }
  };

  const updateAdminNotes = async (userId: number, adminNotes: string) => {
    try {
      updateUser(userId, { adminNotes });
    } catch (error) {
      console.error('Error updating admin notes:', error);
    }
  };

  const banUser = async (
    userId: number,
    duration: 'permanent' | '24h' | '7d' | '30d' | 'custom',
    customDate?: string,
    reason?: string
  ) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || !user.profileId) {
        throw new Error('User or profile ID not found');
      }

      const { data, error } = await supabase.functions.invoke('ban-user', {
        body: { userId: user.profileId, duration, customDate, reason, action: 'ban' }
      });

      if (error) throw error;
      await fetchUsers();
      return data;
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  };

  const unbanUser = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || !user.profileId) {
        throw new Error('User or profile ID not found');
      }

      const { data, error } = await supabase.functions.invoke('ban-user', {
        body: { userId: user.profileId, action: 'unban' }
      });

      if (error) throw error;
      await fetchUsers();
      return data;
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  };

  const updateUserRole = async (userId: number, newRole: 'admin' | 'user' | 'operations') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || !user.profileId) {
        throw new Error('User or profile ID not found');
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No authenticated user');

      if (newRole === 'user') {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.profileId)
          .in('role', ['admin', 'operations']);
        if (error) throw error;
      } else {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.profileId)
          .in('role', ['admin', 'operations']);

        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.profileId,
            role: newRole,
            assigned_by: currentUser.id,
            assigned_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  return {
    users: filteredUsers,
    totalCount,
    loading,
    loadingMore,
    searching,
    isServerSearch,
    hasMore: isServerSearch ? false : hasMore, // Disable "load more" during search
    loadMore,
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    roleFilter, 
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    updateUser,
    updateUserStatus,
    updateTrustLevel,
    updateAdminNotes,
    banUser,
    unbanUser,
    updateUserRole,
    refreshUsers: fetchUsers
  };
};
