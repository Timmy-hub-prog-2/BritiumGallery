import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CustomerChatService, ChatMessage, SessionAssignmentUpdate } from '../services/customer-chat.service';
import { Subscription } from 'rxjs';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-customer-message',
  templateUrl: './customer-message.component.html',
  standalone:false,
  styleUrls: ['./customer-message.component.css']
})
export class CustomerMessageComponent implements OnInit, AfterViewInit {
  messages: any[] = [];
  sessionId: number | null = null;
  customerId: number | null = null;
  agentId: number | null = null;
  newMessage: string = '';
  private sub: Subscription | null = null;
  connected = false;
  private connSub: Subscription | null = null;
  private messageIds = new Set<number>();
  sessions: any[] = [];
  selectedSession: any | null = null;
  isAgentTyping: boolean = false;
  typingTimeout: any;
  showQuickReplies: boolean = true;
  isTyping = false;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  constructor(private chatService: CustomerChatService, private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.chatService.connectSessionListSocket();
    // Get logged-in user ID from UserService/localStorage
    const user = this.userService.userValue;
    this.customerId = user ? user.id : null;
    if (!this.customerId) {
      console.error('No logged-in user found.');
      return;
    }
    // Add session list state and real-time updates
    this.sessions = [];
    this.selectedSession = null;
    this.chatService.onSessionUpdate().subscribe(sessionUpdate => {
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === sessionUpdate.id) {
          this.sessions[i] = { ...this.sessions[i], ...sessionUpdate };
          break;
        }
      }
    });
    // Fetch open sessions for this customer
    this.chatService.getUserSessions(this.customerId).subscribe(sessions => {
      this.sessions = sessions;
      // If there is only one session, mark all admin messages as read after connection
      if (this.sessions.length === 1) {
        const sessionIdNum = Number(this.sessions[0].id);
        const customerIdNum = Number(this.customerId);
        this.chatService.registerOnConnectCallback(() => {
          if (!isNaN(sessionIdNum) && !isNaN(customerIdNum)) {
            console.log('Calling markAllAgentMessagesRead with', { sessionIdNum, customerIdNum });
            this.chatService.markAllAgentMessagesRead(sessionIdNum, customerIdNum);
          }
        });
      }
      // Optionally auto-select the first session
      if (this.sessions.length > 0 && !this.selectedSession) {
        this.selectSession(this.sessions[0]);
      }
    });
    // Subscribe to typing events
    this.chatService.onTypingEvent().subscribe(event => {
      if (
        this.selectedSession &&
        event.sessionId === this.selectedSession.id &&
        event.senderId !== this.customerId &&
        event.typing
      ) {
        if (!this.isTyping) {
          this.playTypingSound();
        }
        this.isTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.isTyping = false;
          this.cdr.detectChanges();
        }, 1500);
        this.cdr.detectChanges();
      }
    });
    this.chatService.onMessage().subscribe(msg => {
      console.log('WebSocket message received (customer):', msg);
      if ('id' in msg && ('isRead' in msg || 'read' in msg)) {
        const idx = this.messages.findIndex(m => m.id === msg.id);
        if (idx !== -1) {
          // Normalize both properties for Angular template
          const isRead = (msg as any).isRead !== undefined ? (msg as any).isRead : (msg as any).read;
          this.messages[idx] = { ...this.messages[idx], isRead, read: isRead };
          this.cdr.detectChanges();
        }
      }
      if ('content' in msg) {
        if ((msg as any).agent === true) { // Message from agent
          this.playNotificationSound();
        }
      }
      this.scrollToBottom();
    });
    // Listen for close/reopen events in ngOnInit
    this.chatService.onSessionEvent().subscribe(event => {
      if (event.sessionId === this.selectedSession?.id) {
        if (event.closedBy !== undefined) {
          this.selectedSession.status = 'CLOSED';
        } else {
          this.selectedSession.status = 'OPEN';
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer && this.messagesContainer.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  selectSession(session: any): void {
    this.selectedSession = session;
    this.sessionId = session.id;
    this.chatService.connect(session.id);
    this.connSub = this.chatService.isConnected().subscribe(connected => this.connected = connected);
    this.sub = this.chatService.onMessage().subscribe(msg => {
      console.log('WebSocket message received (customer):', msg);
      if ('content' in msg) {
        if (!(msg as any).id || !this.messageIds.has((msg as any).id)) {
          this.messages.push(msg as ChatMessage);
          if ((msg as any).id) this.messageIds.add((msg as any).id);
          // --- Mark unread agent messages as read ---
          if ((msg as any).agent && !(msg as any).isRead) {
            this.chatService.markMessageRead({
              messageId: (msg as any).id,
              sessionId: this.sessionId!,
              read: true
            });
          }
        }
      } else if ('agentId' in msg) {
        this.agentId = (msg as SessionAssignmentUpdate).agentId;
      }
    });
    // Fetch existing messages
    this.chatService.getSessionMessages(session.id).subscribe(msgs => {
      this.messages = msgs;
      this.messageIds.clear();
      msgs.forEach(msg => {
        if ((msg as any).id) this.messageIds.add((msg as any).id);
      });
      // Mark all previous admin messages as seen
      const sessionIdNum = Number(this.sessionId);
      const customerIdNum = Number(this.customerId);
      console.log('Calling markAllAgentMessagesRead with', { sessionIdNum, customerIdNum });
      if (!isNaN(sessionIdNum) && !isNaN(customerIdNum)) {
        this.chatService.markAllAgentMessagesRead(sessionIdNum, customerIdNum);
      }
      this.scrollToBottom();
      this.cdr.detectChanges();
      // Mark unread agent messages as read in real time for new arrivals
      this.sub = this.chatService.onMessage().subscribe(msg => {
        if ('content' in msg) {
          if (!(msg as any).id || !this.messageIds.has((msg as any).id)) {
            this.messages.push(msg as ChatMessage);
            if ((msg as any).id) this.messageIds.add((msg as any).id);
            // --- Mark unread agent messages as read ---
            if ((msg as any).agent && !(msg as any).isRead) {
              const sessionIdNum = Number(this.sessionId);
              if (!isNaN(sessionIdNum)) {
                this.chatService.markMessageRead({
                  messageId: (msg as any).id,
                  sessionId: sessionIdNum,
                  read: true
                });
              }
            }
          }
        }
      });
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.customerId) return;
    if (this.selectedSession && this.selectedSession.status === 'CLOSED') return;
    if (!this.sessionId) {
      // Start session on first message
      this.chatService.startSession(this.customerId).subscribe(sessionId => {
        this.sessionId = sessionId;
        this.chatService.connect(sessionId);
        this.connSub = this.chatService.isConnected().subscribe(connected => this.connected = connected);
        this.sub = this.chatService.onMessage().subscribe(msg => {
          if ('content' in msg) {
            if (!(msg as any).id || !this.messageIds.has((msg as any).id)) {
              this.messages.push(msg as ChatMessage);
              if ((msg as any).id) this.messageIds.add((msg as any).id);
            }
          } else if ('agentId' in msg) {
            this.agentId = (msg as SessionAssignmentUpdate).agentId;
          }
        });
        // After connection, send the message
        setTimeout(() => {
          if (this.connected) {
            const msg: ChatMessage = {
              sessionId: this.sessionId!,
              senderId: this.customerId!,
              content: this.newMessage,
              agent: false
            };
            this.chatService.sendMessage(msg);
            this.newMessage = '';
          }
        }, 500); // Wait briefly for connection
      });
    } else if (this.connected) {
      const msg: ChatMessage = {
        sessionId: this.sessionId!,
        senderId: this.customerId!,
        content: this.newMessage,
        agent: false
      };
      this.chatService.sendMessage(msg);
      this.newMessage = '';
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
      this.chatService.sendTypingEvent(this.selectedSession.id, false);
    } else {
      this.chatService.sendTypingEvent(this.selectedSession.id, true);
      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.chatService.sendTypingEvent(this.selectedSession.id, false);
      }, 1500);
    }
  }

  sendQuickReply(message: string): void {
    this.newMessage = message;
    this.sendMessage();
    this.showQuickReplies = false;
  }

  hideQuickReplies(): void {
    this.showQuickReplies = false;
  }

  startNewChat(): void {
    // Demo: just set selectedSession to a dummy session or trigger your real logic
    this.selectedSession = { id: 1, customerName: 'You', profilePic: null } as any;
    this.messages = [];
    this.showQuickReplies = true;
  }

  startNewSession() {
    if (!this.customerId) return;
    this.chatService.startSession(this.customerId).subscribe(sessionId => {
      // After creating, force a one-time page reload
      window.location.reload();
      // (If you want to avoid reload, comment out the above line and use the logic below)
      /*
      this.chatService.getUserSessions(this.customerId!).subscribe(sessions => {
        this.sessions = sessions;
        const newSession = sessions.find(s => s.id === sessionId);
        if (newSession) {
          this.selectedSession = newSession;
          this.sessionId = newSession.id;
          this.chatService.connect(newSession.id);
          // Load messages for the new session (same as selectSession)
          this.chatService.getSessionMessages(newSession.id).subscribe(msgs => {
            this.messages = msgs;
            this.messageIds.clear();
            msgs.forEach(msg => {
              if ((msg as any).id) this.messageIds.add((msg as any).id);
            });
            // Mark all previous admin messages as seen
            const sessionIdNum = Number(this.sessionId);
            const customerIdNum = Number(this.customerId);
            if (!isNaN(sessionIdNum) && !isNaN(customerIdNum)) {
              this.chatService.markAllAgentMessagesRead(sessionIdNum, customerIdNum);
            }
            this.scrollToBottom();
            this.cdr.detectChanges();
            // Mark unread agent messages as read in real time for new arrivals
            this.sub = this.chatService.onMessage().subscribe(msg => {
              if ('content' in msg) {
                if (!(msg as any).id || !this.messageIds.has((msg as any).id)) {
                  this.messages.push(msg as ChatMessage);
                  if ((msg as any).id) this.messageIds.add((msg as any).id);
                  // --- Mark unread agent messages as read ---
                  if ((msg as any).agent && !(msg as any).isRead) {
                    const sessionIdNum = Number(this.sessionId);
                    if (!isNaN(sessionIdNum)) {
                      this.chatService.markMessageRead({
                        messageId: (msg as any).id,
                        sessionId: sessionIdNum,
                        read: true
                      });
                    }
                  }
                }
              }
            });
          });
        }
      });
      */
    });
  }

  playTypingSound() {
    const audio = new Audio('assets/mp3/typing.mp3');
    audio.volume = 0.3;
    audio.play();
  }

  playNotificationSound() {
    const audio = new Audio('assets/mp3/messagenoti.mp3');
    audio.volume = 0.5;
    audio.play();
  }

  public closeSession() {
    if (!this.selectedSession) return;
    this.chatService.closeSession(this.selectedSession.id, this.customerId!).subscribe(() => {
      this.selectedSession.status = 'CLOSED';
      this.cdr.detectChanges();
    });
  }
  public reopenSession() {
    if (!this.selectedSession) return;
    this.chatService.reopenSession(this.selectedSession.id).subscribe(() => {
      this.selectedSession.status = 'OPEN';
      this.cdr.detectChanges();
    });
  }

  get canReopenSession(): boolean {
    if (!this.selectedSession || !this.selectedSession.closedAt) return false;
    const closedAt = new Date(this.selectedSession.closedAt).getTime();
    return Date.now() - closedAt < 1000 * 60 * 60 * 48;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.connSub?.unsubscribe();
    this.chatService.disconnect();
  }
}
