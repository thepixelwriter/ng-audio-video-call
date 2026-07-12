import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChatMessage, ChatState } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private state: ChatState = { messages: [], unreadCount: 0, isOpen: false };
  readonly chatState$ = new BehaviorSubject<ChatState>(this.state);
  // ChimeService subscribes to this to broadcast messages via Chime data messaging
  readonly outgoingMessage$ = new Subject<{ senderName: string; content: string }>();

  sendMessage(senderId: string, senderName: string, content: string): void {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId,
      senderName,
      content: content.trim(),
      timestamp: new Date(),
      type: this.detectMessageType(content),
      isLocal: true,
    };
    this.addMessage(message);
    this.outgoingMessage$.next({ senderName, content: content.trim() });
  }

  receiveMessage(senderId: string, senderName: string, content: string): void {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId,
      senderName,
      content: content.trim(),
      timestamp: new Date(),
      type: this.detectMessageType(content),
      isLocal: false,
    };
    this.addMessage(message);
    if (!this.state.isOpen) {
      this.state = { ...this.state, unreadCount: this.state.unreadCount + 1 };
      this.chatState$.next({ ...this.state });
    }
  }

  openChat(): void {
    this.state = { ...this.state, isOpen: true, unreadCount: 0 };
    this.chatState$.next({ ...this.state });
  }

  closeChat(): void {
    this.state = { ...this.state, isOpen: false };
    this.chatState$.next({ ...this.state });
  }

  toggleChat(): void {
    this.state.isOpen ? this.closeChat() : this.openChat();
  }

  clearMessages(): void {
    this.state = { messages: [], unreadCount: 0, isOpen: this.state.isOpen };
    this.chatState$.next({ ...this.state });
  }

  private addMessage(message: ChatMessage): void {
    this.state = { ...this.state, messages: [...this.state.messages, message] };
    this.chatState$.next({ ...this.state });
  }

  private detectMessageType(content: string): ChatMessage['type'] {
    const emojiOnly = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(content);
    return emojiOnly ? 'emoji' : 'text';
  }
}
