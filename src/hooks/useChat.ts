import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useChat(token: string | null) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['chatHistory', token],
    queryFn: async () => {
      const res = await fetch('/api/chat', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    enabled: !!token,
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chat?chatId=${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete chat');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', token] });
    },
  });

  const clearAllChatsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat?all=true', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to clear chats');
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['chatHistory', token], []);
    },
  });

  return {
    history: historyQuery.data || [],
    isHistoryLoading: historyQuery.isLoading,
    deleteChat: deleteChatMutation.mutateAsync,
    clearAllChats: clearAllChatsMutation.mutateAsync,
    refreshHistory: () => queryClient.invalidateQueries({ queryKey: ['chatHistory', token] }),
  };
}

export function useChatDetails(token: string | null, chatId: string | null) {
  return useQuery({
    queryKey: ['chatDetails', token, chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const res = await fetch(`/api/chat?chatId=${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch chat details');
      return res.json();
    },
    enabled: !!token && !!chatId,
  });
}
