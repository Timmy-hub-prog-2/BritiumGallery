import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CustomerChatService, ChatMessage, SessionAssignmentUpdate, ReadStatusUpdate } from '../services/customer-chat.service';
import { Subscription } from 'rxjs';
import { UserService } from '../services/user.service';
import { Address, People } from '../People';

@Component({
  selector: 'app-admin-message',
  templateUrl: './admin-message.component.html',
  standalone:false,
  styleUrls: ['./admin-message.component.css']
})
export class AdminMessageComponent implements OnInit, OnDestroy, AfterViewInit {
  sessions: any[] = [];
  selectedSession: any = null;
  messages: ChatMessage[] = [];
  selectedUser: People | null = null;
  private sub: Subscription | null = null;
  public newMessage: string = '';
  agentProfilePic: string | null = null; // Set to a default agent image if available
  currentAdminId: number | null = null;
  assignedSessions: any[] = [];
  adminProfilePic: string | null = null;
  adminName: string | null = null;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  public isTyping: boolean = false;
  typingName: string | null = null;
  typingTimeout: any;

  constructor(private chatService: CustomerChatService, private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.chatService.connectSessionListSocket();
    this.fetchUnassignedSessions();
    // Set current admin ID, name, and profile pic from logged-in user
    const user = this.userService.userValue;
    this.currentAdminId = user ? user.id : null;
    this.adminName = user ? user.name : null;
    this.adminProfilePic = user && 'profilePic' in user ? (user as any)['profilePic'] : null;
    if (this.currentAdminId) {
      this.chatService.getAssignedSessions(this.currentAdminId).subscribe(sessions => {
        this.assignedSessions = sessions;
        if (this.assignedSessions.length > 0) {
        }
        this.cdr.detectChanges();
      });
    }
    this.chatService.onMessage().subscribe(msgOrUpdate => {
      // Unconditional update/insert for any message with id and read/isRead
      const updateObj = msgOrUpdate as any;
      const id = updateObj.id !== undefined ? updateObj.id : updateObj.messageId;
      const readValue = updateObj.isRead !== undefined ? updateObj.isRead : updateObj.read;
      if (id !== undefined && (updateObj.isRead !== undefined || updateObj.read !== undefined)) {
        this.messages = this.messages.filter(m => (m as any).id !== id);
        this.messages.push({
          ...updateObj,
          isRead: readValue,
          read: readValue,
          time: updateObj.sentAt ? new Date(updateObj.sentAt) : new Date()
        });
        this.messages.sort((a, b) => (a.sentAt && b.sentAt ? new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime() : 0));
        this.messages = [...this.messages];
        this.cdr.detectChanges();
      }
      if ('agentId' in msgOrUpdate) {
        // SessionAssignmentUpdate
        const update = msgOrUpdate as SessionAssignmentUpdate;
        // Update the session in the UI
        const session = this.sessions.find(s => s.id === update.sessionId);
        if (session) {
          session.assignedAgentId = update.agentId;
        }
        if (this.selectedSession && this.selectedSession.id === update.sessionId) {
          this.selectedSession.assignedAgentId = update.agentId;
        }
      } else if ('content' in msgOrUpdate) {
        
        // New message from backend
        if (
          this.selectedSession &&
          msgOrUpdate.sessionId === this.selectedSession.id
        ) {
          // Replace optimistic message (no id) with real one
          const idx = this.messages.findIndex(m =>
            (!(m as any).id || (m as any).id === undefined) &&
            m.content === msgOrUpdate.content &&
            m.agent === msgOrUpdate.agent
          );
          if (idx !== -1) {
            const update = msgOrUpdate as any;
            this.messages[idx] = {
              ...msgOrUpdate,
              isRead: update.isRead !== undefined ? update.isRead : update.read
            };
            this.cdr.detectChanges();
          } else {
            // Only add if not already present
            if (!(this.messages as any[]).some(m => (m as any).id === (msgOrUpdate as any).id)) {
              this.messages.push({
                ...msgOrUpdate,
                time: msgOrUpdate.sentAt ? new Date(msgOrUpdate.sentAt) : new Date()
              });
              // Always sort after push
              this.messages.sort((a, b) => (a.sentAt && b.sentAt ? new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime() : 0));
              this.cdr.detectChanges();
            }
          }
          // Mark new customer message as read in real time
          if (!msgOrUpdate.agent && !msgOrUpdate.isRead) {
            this.chatService.markMessageRead({
              messageId: (msgOrUpdate as any).id,
              sessionId: this.selectedSession.id,
              read: true
            });
          }
        }
      }
      // Always refresh session lists after a message or read update
      this.fetchUnassignedSessions();
      if (this.currentAdminId) {
        this.chatService.getAssignedSessions(this.currentAdminId).subscribe(sessions => {
          this.assignedSessions = sessions;
        });
      }
      this.scrollToBottom();
    });

    // --- Subscribe to session summary updates for real-time session list ---
    this.chatService.onSessionUpdate().subscribe(sessionUpdate => {
      // Try to update in assignedSessions
      let updated = false;
      for (let i = 0; i < this.assignedSessions.length; i++) {
        if (this.assignedSessions[i].id === sessionUpdate.id) {
          this.assignedSessions[i] = { ...this.assignedSessions[i], ...sessionUpdate };
          updated = true;
          break;
        }
      }
      // Try to update in sessions (unassigned)
      if (!updated) {
        for (let i = 0; i < this.sessions.length; i++) {
          if (this.sessions[i].id === sessionUpdate.id) {
            this.sessions[i] = { ...this.sessions[i], ...sessionUpdate };
            break;
          }
        }
      }
      this.cdr.detectChanges();
    });

    // Subscribe to typing events (only show when customer is typing)
    this.chatService.onTypingEvent().subscribe(event => {
      if (
        this.selectedSession &&
        event.sessionId === this.selectedSession.id &&
        event.senderId !== this.currentAdminId &&
        event.senderId !== null &&
        event.typing
      ) {
        if (!this.isTyping) {
          this.playTypingSound();
        }
        this.isTyping = true;
        this.typingName = this.selectedSession.customerName || 'Customer';
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
          this.isTyping = false;
          this.cdr.detectChanges();
        }, 1500);
        this.cdr.detectChanges();
      } else if (
        event.sessionId === this.selectedSession?.id &&
        (event.senderId === this.currentAdminId || event.senderId === null)
      ) {
        // Do not show typing indicator when admin is typing
        this.isTyping = false;
        this.typingName = null;
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

  fetchUnassignedSessions(): void {
    this.chatService.getUnassignedSessions().subscribe(sessions => {
      this.sessions = sessions;
      if (this.sessions.length > 0) {
      }
      this.cdr.detectChanges();
    });
  }

  selectSession(session: any): void {
    this.selectedSession = session;
    this.chatService.connect(session.id);
    this.fetchMessages(session.id);
    this.fetchUserInfo(session.customerId);
    // Mark unread customer messages as read immediately
    this.messages.forEach(msg => {
      if (!msg.agent && !msg.isRead) {
        this.chatService.markMessageRead({
          messageId: (msg as any).id,
          sessionId: session.id,
          read: true
        });
      }
    });
  }

  fetchMessages(sessionId: number): void {
    this.chatService.getSessionMessages(sessionId).subscribe(msgs => {
      this.messages = msgs
        .map(m => ({ ...m, time: m.sentAt ? new Date(m.sentAt) : new Date() }))
        .sort((a, b) => (a.sentAt && b.sentAt ? new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime() : 0));
      // Wait for WebSocket connection before marking as read
      this.chatService.isConnected().subscribe(connected => {
        if (connected) {
          this.messages.forEach(msg => {
            if (!msg.agent && !msg.isRead) {
              this.chatService.markMessageRead({
                messageId: (msg as any).id,
                sessionId: sessionId,
                read: true
              });
            }
          });
        }
      });
      this.scrollToBottom();
    });
  }

  fetchUserInfo(userId: number): void {
    this.userService.getPeopleById(userId).subscribe(user => {
      this.selectedUser = user;
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedSession || !this.currentAdminId) return;
    const msg: ChatMessage = {
      sessionId: this.selectedSession.id,
      senderId: this.currentAdminId,
      content: this.newMessage.trim(),
      agent: true,
      sentAt: new Date().toISOString()
    };
    this.chatService.sendMessage(msg);
    // Optimistically update lastMessage and lastMessageTime in session list
    const now = new Date();
    const updateSessionList = (list: any[]) => {
      const session = list.find(s => s.id === this.selectedSession.id);
      if (session) {
        session.lastMessage = msg.content;
        session.lastMessageTime = now;
      }
    };
    updateSessionList(this.assignedSessions);
    updateSessionList(this.sessions);
    this.newMessage = '';
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else {
      // Optionally, set isTyping to true and debounce reset for demo
      // this.isTyping = true; // Removed as per edit hint
      // clearTimeout((this as any)._typingTimeout); // Removed as per edit hint
      // (this as any)._typingTimeout = setTimeout(() => { // Removed as per edit hint
      //   this.isTyping = false; // Removed as per edit hint
      //   this.cdr.detectChanges(); // Removed as per edit hint
      // }, 1500); // Removed as per edit hint
      // Send typing event to customer
      if (this.selectedSession) {
        this.chatService.sendTypingEvent(this.selectedSession.id, true);
      }
    }
  }

  getFormattedAddress(address?: Address): string {
    if (!address) return '';
    // Format: houseNumber, street, wardName, township, city, state, country
    return [
      address.houseNumber,
      address.street,
      address.wardName,
      address.township,
      address.city,
      address.state,
      address.country
    ].filter(Boolean).join(', ');
  }

  getAvatarColor(name: string): string {
    // Generate a pastel color based on the name
    const colors = [
      '#f7c59f', '#a3c9a8', '#84b1ed', '#f6a6b2', '#b5ead7', '#f9e79f', '#d2b4de', '#aed6f1', '#f5cba7', '#d5f5e3'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Add this method to the component
  isMessageRead(msg: any): boolean {
    return msg.isRead === true || msg.isRead === 'true' || msg.read === true || msg.read === 'true';
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
