import {
  Component, inject, ViewChild, ElementRef, AfterViewChecked,
  ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/chat.models';
import { Subject, takeUntil } from 'rxjs';
import { NccIconComponent } from '../icon/ncc-icon.component';

@Component({
  selector: 'ncc-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, NccIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ncc-chat">
      <div class="ncc-chat__header">
        <span>Chat</span>
        <button class="ncc-chat__close" (click)="chatService.closeChat()" title="Close">
          <ncc-icon name="close" [size]="18"></ncc-icon>
        </button>
      </div>

      <div class="ncc-chat__messages" #messagesContainer>
        <div *ngIf="messages.length === 0" class="ncc-chat__empty">No messages yet.</div>

        <div *ngFor="let msg of messages; trackBy: trackById"
             class="ncc-chat__message"
             [class.ncc-chat__message--local]="msg.isLocal"
             [class.ncc-chat__message--emoji]="msg.type === 'emoji'">
          <div class="ncc-chat__meta">
            <span class="ncc-chat__sender">{{ msg.isLocal ? 'You' : msg.senderName }}</span>
            <span class="ncc-chat__time">{{ msg.timestamp | date:'HH:mm' }}</span>
          </div>
          <div class="ncc-chat__bubble">{{ msg.content }}</div>
        </div>
      </div>

      <div class="ncc-chat__input-row">
        <div class="ncc-emoji-picker" *ngIf="showEmoji">
          <button *ngFor="let e of emojis" (click)="appendEmoji(e)" class="ncc-emoji-btn">{{ e }}</button>
        </div>
        <button class="ncc-chat__emoji-toggle" (click)="showEmoji = !showEmoji" title="Insert emoji">
          <ncc-icon name="emoji" [size]="20"></ncc-icon>
        </button>
        <input class="ncc-chat__input" [(ngModel)]="inputText" (keydown.enter)="send()"
               placeholder="Type a message…" maxlength="500" autocomplete="off" />
        <button class="ncc-chat__send" [class.ncc-chat__send--active]="inputText.trim()"
                [disabled]="!inputText.trim()" (click)="send()" title="Send message">
          <ncc-icon name="send" [size]="16"></ncc-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .ncc-chat {
      display: flex; flex-direction: column;
      flex: 1; min-height: 0;
      background: var(--ncc-surface);
      border-left: 1px solid var(--ncc-border);
    }
    .ncc-chat__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--ncc-border);
      font-weight: 600; font-size: 0.875rem; color: var(--ncc-text);
    }
    .ncc-chat__close {
      background: none; border: none; cursor: pointer; color: var(--ncc-text-muted);
      display: flex; align-items: center;
    }
    .ncc-chat__close svg { width: 18px; height: 18px; }

    .ncc-chat__messages {
      flex: 1; min-height: 0; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .ncc-chat__empty { color: var(--ncc-text-muted); text-align: center; font-size: 0.8rem; margin-top: 24px; }

    .ncc-chat__message { display: flex; flex-direction: column; max-width: 85%; }
    .ncc-chat__message--local { align-self: flex-end; align-items: flex-end; }
    .ncc-chat__meta { display: flex; gap: 6px; margin-bottom: 2px; }
    .ncc-chat__sender { font-size: 0.7rem; font-weight: 600; color: var(--ncc-text-muted); }
    .ncc-chat__time { font-size: 0.65rem; color: var(--ncc-text-muted); }
    .ncc-chat__bubble {
      background: var(--ncc-surface-elevated);
      color: var(--ncc-text);
      padding: 8px 12px; border-radius: 12px;
      font-size: 0.85rem; line-height: 1.4; word-break: break-word;
    }
    .ncc-chat__message--local .ncc-chat__bubble {
      background: var(--ncc-primary); color: var(--ncc-primary-fg);
    }
    .ncc-chat__message--emoji .ncc-chat__bubble {
      background: transparent; font-size: 1.8rem; padding: 4px;
    }

    .ncc-chat__input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid var(--ncc-border);
      flex-shrink: 0;
      position: relative;
    }
    .ncc-chat__input {
      flex: 1;
      min-width: 0;
      background: var(--ncc-surface-elevated);
      border: 1.5px solid var(--ncc-border);
      border-radius: 20px;
      padding: 9px 14px;
      color: var(--ncc-text);
      font-size: 0.85rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    .ncc-chat__input:focus { border-color: var(--ncc-primary); }
    .ncc-chat__input::placeholder { color: var(--ncc-text-muted); }
    .ncc-chat__send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, opacity 0.15s;
      background: var(--ncc-border);
      color: var(--ncc-text-muted);
    }
    .ncc-chat__send--active {
      background: var(--ncc-primary);
      color: var(--ncc-primary-fg, #fff);
    }
    .ncc-chat__send--active:hover { opacity: 0.88; }
    .ncc-chat__send:disabled { cursor: not-allowed; }
    .ncc-chat__emoji-toggle {
      background: none; border: none; cursor: pointer;
      color: var(--ncc-text-muted); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 4px; border-radius: 6px;
    }
    .ncc-chat__emoji-toggle:hover { background: var(--ncc-surface-elevated); color: var(--ncc-text); }
    .ncc-emoji-picker {
      position: absolute; bottom: 56px; left: 12px;
      background: var(--ncc-surface-elevated);
      border: 1px solid var(--ncc-border); border-radius: 8px;
      padding: 8px; display: flex; flex-wrap: wrap; gap: 4px; max-width: 240px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 10;
    }
    .ncc-emoji-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 2px; }
    .ncc-emoji-btn:hover { background: var(--ncc-border); border-radius: 4px; }
  `],
})
export class ChatPanelComponent implements OnInit, AfterViewChecked, OnDestroy {
  readonly chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);
  private elRef = inject(ElementRef);
  private destroy$ = new Subject<void>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showEmoji) {
      this.showEmoji = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showEmoji && !this.elRef.nativeElement.contains(event.target as Node)) {
      this.showEmoji = false;
      this.cdr.markForCheck();
    }
  }

  messages: ChatMessage[] = [];
  inputText = '';
  showEmoji = false;
  private shouldScroll = false;

  readonly emojis = ['👍', '👎', '😊', '😂', '❤️', '🎉', '👏', '🙏', '😮', '😢', '🔥', '✅'];

  ngOnInit(): void {
    this.chatService.chatState$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.messages = state.messages;
      this.shouldScroll = true;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.chatService.sendMessage('local', 'You', text);
    this.inputText = '';
    this.showEmoji = false;
  }

  appendEmoji(emoji: string): void {
    this.inputText += emoji;
  }

  trackById(_: number, msg: ChatMessage): string {
    return msg.id;
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
