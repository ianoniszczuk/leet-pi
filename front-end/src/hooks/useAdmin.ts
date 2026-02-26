import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiService from '@/services/api';
import type { User } from '@/types';

export const useAdmin = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || authLoading) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsLoading(false);
        setUser(null);
        return;
      }

      try {
        // First check localStorage for user data from login response
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            const roles: string[] = parsedUser.roles ?? [];
            if (roles.includes('admin') || roles.includes('superadmin')) {
              setIsAdmin(true);
              setIsSuperAdmin(roles.includes('superadmin'));
              setUser(parsedUser);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            // Invalid JSON, continue to API call
          }
        }

        // Fallback to API call
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          const userData = response.data;
          const roles: string[] = userData.roles ?? [];
          setUser(userData);
          setIsAdmin(roles.includes('admin') || roles.includes('superadmin'));
          setIsSuperAdmin(roles.includes('superadmin'));
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, authLoading]);

  return {
    isAdmin,
    isSuperAdmin,
    isLoading,
    user,
  };
};

