import { useState, useMemo } from 'react';
import { User, Package, Trip } from '@/types';

export const useUserManagement = () => {
  // Mock users data - in real app this would come from API
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "Ana García",
      username: "ana_garcia",
      email: "ana.garcia@email.com",
      role: "shopper",
      phoneNumber: "+502 1234-5678",
      whatsappNumber: "+502 1234-5678",
      registrationDate: "2024-01-15T10:00:00Z",
      status: "verified",
      trustLevel: "trusted",
      adminNotes: "Usuario muy activo, siempre paga a tiempo"
    },
    {
      id: 2,
      name: "Carlos Mendoza",
      username: "carlos_viajero",
      email: "carlos.mendoza@email.com", 
      role: "traveler",
      phoneNumber: "+502 9876-5432",
      whatsappNumber: "+502 9876-5432",
      registrationDate: "2024-02-20T14:30:00Z",
      status: "active",
      trustLevel: "basic",
      adminNotes: ""
    },
    {
      id: 3,
      name: "María López",
      username: "maria_shop",
      email: "maria.lopez@email.com",
      role: "shopper",
      phoneNumber: "+502 5555-7777",
      whatsappNumber: "+502 5555-7777", 
      registrationDate: "2024-03-10T09:15:00Z",
      status: "blocked",
      trustLevel: "basic",
      adminNotes: "Bloqueado temporalmente por reportes de otros usuarios"
    },
    {
      id: 4,
      name: "José Ramírez",
      username: "jose_travels",
      email: "jose.ramirez@email.com",
      role: "traveler",
      phoneNumber: "+502 3333-9999",
      whatsappNumber: "+502 3333-9999",
      registrationDate: "2024-01-05T16:45:00Z", 
      status: "verified",
      trustLevel: "premium",
      adminNotes: "Viajero premium con excelente reputación"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
    searchTerm,
    setSearchTerm,
    roleFilter, 
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    updateUser,
    updateUserStatus,
    updateTrustLevel,
    updateAdminNotes
  };
};