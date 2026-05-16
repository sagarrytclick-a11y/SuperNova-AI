import { useState, useEffect, useCallback } from 'react';

export function useUser(token: string | null) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      setUser(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateProfile = async (data: any) => {
    if (!token) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    user,
    isLoading,
    updateProfile,
    isUpdating,
    error,
    refreshUser: fetchUser
  };
}
