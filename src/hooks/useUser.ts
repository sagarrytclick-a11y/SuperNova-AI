import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUser(token: string | null) {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['user', token],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!token,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/user/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user', token], data);
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
