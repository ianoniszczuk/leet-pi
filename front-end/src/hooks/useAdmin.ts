import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiService from '@/services/api';
import type { User } from '@/types';

export const useAdmin = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || authLoading) {
        setIsAdmin(false);
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
            if (parsedUser.roles?.includes('admin')) {
              setIsAdmin(true);
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
          setUser(userData);
          // Check if user has admin role
          const hasAdminRole = userData.roles?.includes('admin') ?? false;
          setIsAdmin(hasAdminRole);
        } else {
          setIsAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, authLoading]);

  return {
    isAdmin,
    isLoading,
    user,
  };
};

