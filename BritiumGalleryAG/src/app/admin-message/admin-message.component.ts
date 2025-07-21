import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CustomerChatService, ChatMessage, SessionAssignmentUpdate, ReadStatusUpdate } from '../services/customer-chat.service';
import { Subscription, interval } from 'rxjs';
import { UserService } from '../services/user.service';
import { Address, People } from '../People';

// Extend People type to include isOnline and lastSeenAt for template binding
interface PeopleWithStatus extends People {
  isOnline?: boolean;
  lastSeenAt?: string;
}

@Component({
  selector: 'app-admin-message',
  standalone:false,
  templateUrl: './admin-message.component.html',
  
  styleUrls: ['./admin-message.component.css']
})
export class AdminMessageComponent implements OnInit, OnDestroy, AfterViewInit {
  sessions: any[] = [];
  selectedSession: any = null;
  sessionId: number | null = null;
  messages: ChatMessage[] = [];
  selectedUser: PeopleWithStatus | null = null;
  sessionUsers: Map<number, PeopleWithStatus> = new Map(); // Store user info for each session
  customerUsers: Map<number, PeopleWithStatus> = new Map(); // Store user info by customer ID
  userInfoPollSub: Subscription | null = null;
  sessionUsersPollSub: Subscription | null = null; // Add subscription for session users polling
  statusTextTimer: Subscription | null = null;
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
    // Set current admin ID, name, and profile pic from logged-in user
    const user = this.userService.userValue;
    this.currentAdminId = user ? user.id : null;
    this.adminName = user ? user.name : null;
    this.adminProfilePic = user && 'profilePic' in user ? (user as any)['profilePic'] : null;
    if (this.currentAdminId) {
      // Load assigned sessions
      this.chatService.getAssignedSessions(this.currentAdminId).subscribe(sessions => {
        // Sort: OPEN first, then CLOSED
        this.assignedSessions = sessions.sort((a, b) => {
          if (a.status === b.status) return 0;
          if (a.status === 'OPEN') return -1;
          if (b.status === 'OPEN') return 1;
          return 0;
        });
        // Fetch user info for all assigned sessions
        sessions.forEach(session => {
          this.fetchSessionUserInfo(session.customerId, session.id);
        });
        console.log('Loaded assigned sessions:', this.assignedSessions.length);
      });

      // Load unassigned sessions
      this.chatService.getUnassignedSessions().subscribe(sessions => {
        // Sort: OPEN first, then CLOSED
        this.sessions = sessions.sort((a, b) => {
          if (a.status === b.status) return 0;
          if (a.status === 'OPEN') return -1;
          if (b.status === 'CLOSED') return 1;
          return 0;
        });
        // Fetch user info for all unassigned sessions
        sessions.forEach(session => {
          this.fetchSessionUserInfo(session.customerId, session.id);
        });
        console.log('Loaded unassigned sessions:', this.sessions.length);
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
          // Sort: OPEN first, then CLOSED
          this.assignedSessions = sessions.sort((a, b) => {
            if (a.status === b.status) return 0;
            if (a.status === 'OPEN') return -1;
            if (b.status === 'OPEN') return 1;
            return 0;
          });
        });
      }
      this.scrollToBottom();
    });

    // --- Subscribe to session summary updates for real-time session list ---
    this.chatService.onSessionUpdate().subscribe(sessionUpdate => {
      let found = false;
      // Update in assignedSessions
      for (let i = 0; i < this.assignedSessions.length; i++) {
        if (this.assignedSessions[i].id === sessionUpdate.id) {
          this.assignedSessions[i] = { ...this.assignedSessions[i], ...sessionUpdate };
          found = true;
          break;
        }
      }
      // Update in sessions (unassigned)
      if (!found) {
        for (let i = 0; i < this.sessions.length; i++) {
          if (this.sessions[i].id === sessionUpdate.id) {
            this.sessions[i] = { ...this.sessions[i], ...sessionUpdate };
            found = true;
            break;
          }
        }
      }
      // If not found in either, add to the correct list
      if (!found) {
        if (sessionUpdate.assignedAgentId === this.currentAdminId) {
          this.assignedSessions.unshift(sessionUpdate);
        } else if (!sessionUpdate.assignedAgentId) {
          this.sessions.unshift(sessionUpdate);
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

    // Listen for close/reopen events in ngOnInit
    this.chatService.onSessionEvent().subscribe(event => {
      // Update selected session if it's the one being closed/reopened
      if (event.sessionId === this.selectedSession?.id) {
        if (event.closedBy !== undefined) {
          this.selectedSession.status = 'CLOSED';
        } else {
          this.selectedSession.status = 'OPEN';
        }
      }
      // Update the session in assignedSessions
      for (let i = 0; i < this.assignedSessions.length; i++) {
        if (this.assignedSessions[i].id === event.sessionId) {
          this.assignedSessions[i] = { ...this.assignedSessions[i], status: event.closedBy !== undefined ? 'CLOSED' : 'OPEN' };
        }
      }
      // Update the session in sessions (unassigned)
      for (let i = 0; i < this.sessions.length; i++) {
        if (this.sessions[i].id === event.sessionId) {
          this.sessions[i] = { ...this.sessions[i], status: event.closedBy !== undefined ? 'CLOSED' : 'OPEN' };
        }
      }
      
      // Re-sort both lists to maintain OPEN on top
      this.assignedSessions.sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === 'OPEN') return -1;
        if (b.status === 'OPEN') return 1;
        return 0;
      });
      
      this.sessions.sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === 'OPEN') return -1;
        if (b.status === 'CLOSED') return 1;
        return 0;
      });
      
      this.cdr.detectChanges();
    });
    this.startUnifiedPolling();
    this.statusTextTimer = interval(30000).subscribe(() => {
      this.cdr.detectChanges();
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
      // Sort: OPEN first, then CLOSED
      this.sessions = sessions.sort((a, b) => {
        if (a.status === b.status) return 0;
        if (a.status === 'OPEN') return -1;
        if (b.status === 'OPEN') return 1;
        return 0;
      });
      if (this.sessions.length > 0) {
      }
      this.cdr.detectChanges();
    });
  }

  selectSession(session: any) {
    this.selectedSession = session;
    this.sessionId = session.id;
    this.chatService.connect(session.id);
    this.fetchMessages(session.id);
    this.fetchUserInfo(session.customerId);
    // Also fetch user info for the session list
    this.fetchSessionUserInfo(session.customerId, session.id);
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
      this.cdr.detectChanges();
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedSession || !this.currentAdminId) return;
    if (this.selectedSession.status === 'CLOSED') return;
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

  public closeSession() {
    if (!this.selectedSession) return;
    this.chatService.closeSession(this.selectedSession.id, this.currentAdminId!).subscribe(() => {
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

  getOnlineStatus(user: any): string {
    if (!user) return '';
    if (user.isOnline) return 'Active now';
    if (user.lastSeenAt) {
      const last = new Date(user.lastSeenAt);
      const now = new Date();
      const diffMs = now.getTime() - last.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Last active just now';
      if (diffMin === 1) return 'Last active 1 minute ago';
      if (diffMin < 60) return `Last active ${diffMin} minutes ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr === 1) return 'Last active 1 hour ago';
      return `Last active ${diffHr} hours ago`;
    }
    return 'Offline';
  }

  getSessionUser(session: any): PeopleWithStatus | null {
    return this.customerUsers.get(session.customerId) || null;
  }

  fetchSessionUserInfo(customerId: number, sessionId: number): void {
    this.userService.getPeopleById(customerId).subscribe(user => {
      this.customerUsers.set(customerId, user);
      this.sessionUsers.set(sessionId, user);
      this.cdr.detectChanges();
    });
  }

  // Method to manually refresh all user statuses (for testing)
  refreshAllUserStatuses(): void {
    console.log('Manually refreshing all user statuses...');
    this.customerUsers.forEach((user, customerId) => {
      this.userService.getPeopleById(customerId).subscribe(updatedUser => {
        this.customerUsers.set(customerId, updatedUser);
        // Update all sessions that use this customer
        this.assignedSessions.forEach(session => {
          if (session.customerId === customerId) {
            this.sessionUsers.set(session.id, updatedUser);
          }
        });
        this.sessions.forEach(session => {
          if (session.customerId === customerId) {
            this.sessionUsers.set(session.id, updatedUser);
          }
        });
        this.cdr.detectChanges();
      });
    });
  }

  startUserInfoPolling() {
    if (this.selectedUser && this.selectedUser.id) {
      console.log('Starting polling for user:', this.selectedUser.id);
      this.userInfoPollSub = interval(30000).subscribe(() => {
        this.userService.getPeopleById(this.selectedUser!.id).subscribe(user => {
          console.log('Polled user status:', user);
          this.selectedUser = user;
          this.cdr.detectChanges();
        });
      });
    }
  }

  startSessionUsersPolling() {
    console.log('Starting session users polling...');
    // Poll all session users every 30 seconds
    this.sessionUsersPollSub = interval(30000).subscribe(() => {
      console.log('Polling session users, count:', this.customerUsers.size);
      this.customerUsers.forEach((user, customerId) => {
        this.userService.getPeopleById(customerId).subscribe(updatedUser => {
          console.log('Updated user status for customer', customerId, ':', (updatedUser as any).isOnline ? 'Online' : 'Offline');
          this.customerUsers.set(customerId, updatedUser);
          // Update all sessions that use this customer
          this.assignedSessions.forEach(session => {
            if (session.customerId === customerId) {
              this.sessionUsers.set(session.id, updatedUser);
            }
          });
          this.sessions.forEach(session => {
            if (session.customerId === customerId) {
              this.sessionUsers.set(session.id, updatedUser);
            }
          });
          this.cdr.detectChanges();
        });
      });
    });
  }

  // Unified polling method that updates all columns at the same time
  startUnifiedPolling() {
    console.log('Starting unified polling for all columns...');
    this.sessionUsersPollSub = interval(30000).subscribe(() => {
      console.log('Unified polling cycle started');
      
      // Update selected user (middle/right columns)
      if (this.selectedUser && this.selectedUser.id) {
        this.userService.getPeopleById(this.selectedUser.id).subscribe(user => {
          console.log('Updated selected user status:', (user as any).isOnline ? 'Online' : 'Offline');
          this.selectedUser = user;
        });
      }
      
      // Update all session users (left column)
      this.customerUsers.forEach((user, customerId) => {
        this.userService.getPeopleById(customerId).subscribe(updatedUser => {
          console.log('Updated user status for customer', customerId, ':', (updatedUser as any).isOnline ? 'Online' : 'Offline');
          this.customerUsers.set(customerId, updatedUser);
          
          // Update all sessions that use this customer
          this.assignedSessions.forEach(session => {
            if (session.customerId === customerId) {
              this.sessionUsers.set(session.id, updatedUser);
            }
          });
          this.sessions.forEach(session => {
            if (session.customerId === customerId) {
              this.sessionUsers.set(session.id, updatedUser);
            }
          });
        });
      });
      
      // Trigger change detection once for all updates
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.userInfoPollSub?.unsubscribe();
    this.sessionUsersPollSub?.unsubscribe(); // Unsubscribe from session users polling
    this.statusTextTimer?.unsubscribe();
  }

  trackBySessionId(index: number, session: any): any {
    return session.id;
  }
}
