import { useState, useEffect, useCallback } from 'react';

export function useChat(token: string | null) {
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!token) {
      setHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteChat = async (chatId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/chat?chatId=${chatId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete chat');
      await fetchHistory();
      return res.json();
    } catch (err) {
      console.error('Failed to delete chat', err);
      throw err;
    }
  };

  const clearAllChats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat?all=true', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to clear chats');
      setHistory([]);
      return res.json();
    } catch (err) {
      console.error('Failed to clear chats', err);
      throw err;
    }
  };

  return {
    history,
    isHistoryLoading,
    deleteChat,
    clearAllChats,
    refreshHistory: fetchHistory,
    error
  };
}

export function useChatDetails(token: string | null, chatId: string | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!token || !chatId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/chat?chatId=${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch chat details');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching chat details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, chatId]);

  useEffect(() => {
    setData(null);
    fetchDetails();
  }, [chatId, fetchDetails]);

  return {
    data,
    isLoading,
    error,
    refreshDetails: fetchDetails
  };
}
