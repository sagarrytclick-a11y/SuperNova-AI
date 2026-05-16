/**
 * Utility functions for chat-related operations
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Extracts suggestions from AI message using <suggestions> tags
 */
export const parseSuggestions = (text: string): string[] => {
  const match = text.match(/<suggestions>(.*?)<\/suggestions>/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse suggestions:', e);
      return [];
    }
  }
  return [];
};

/**
 * Removes <suggestions> tags from message content for clean display
 */
export const cleanMessageContent = (text: string): string => {
  return text.replace(/<suggestions>.*?<\/suggestions>/, '').trim();
};

/**
 * Formats chat messages for export as a text file
 */
export const formatChatForExport = (messages: Message[]): string => {
  return messages
    .map(msg => `${msg.role.toUpperCase()}: ${cleanMessageContent(msg.content)}`)
    .join('\n\n');
};

/**
 * Triggers a browser download for the exported chat text
 */
export const downloadChatExport = (content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supernova-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
