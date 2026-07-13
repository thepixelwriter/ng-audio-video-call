export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'emoji' | 'system';
  isLocal: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  unreadCount: number;
  isOpen: boolean;
}
