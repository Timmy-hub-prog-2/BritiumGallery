import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { UserService } from './user.service';

export interface ChatMessage {
  sessionId: number;
  senderId: number;
  content: string;
  agent: boolean;
  sentAt?: string;
  time?: string | Date;
  isRead?: boolean;
}

export interface SessionAssignmentUpdate {
  sessionId: number;
  agentId: number;
}

export interface ReadStatusUpdate {
  messageId: number;
  sessionId: number;
  read: boolean;
}

// Add interface for session summary updates (matches backend CustomerServiceSessionDTO)
export interface SessionSummary {
  id: number;
  customerId: number;
  customerName: string;
  assignedAgentId: number | null;
  assignedAgentName: string | null;
  status: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  profilePic: string | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerChatService {
  private baseUrl = 'http://localhost:8080/api/customer-service-chat';
  private stompClient: Client | null = null;
  private messageSubject = new Subject<ChatMessage | SessionAssignmentUpdate>();
  private sessionUpdateSubject = new Subject<SessionSummary>();
  private subscription: any;
  private sessionSubscription: any;
  private connected = false;
  private connectedSubject = new Subject<boolean>();
  private globalStompClient: Client | null = null;
  private globalSessionSubscription: any;
  // Typing indicator support
  private typingSubject = new Subject<{ sessionId: number, senderId: number, typing: boolean }>();
  private onConnectCallbacks: (() => void)[] = [];

  constructor(private http: HttpClient, private userService: UserService) {}

  registerOnConnectCallback(cb: () => void) {
    this.onConnectCallbacks.push(cb);
  }

  // REST: Start a new chat session for a customer
  startSession(customerId: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/start-session`, null, { params: { customerId: customerId.toString() } });
  }

  // REST: Get all messages for a session
  getSessionMessages(sessionId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/messages/${sessionId}`);
  }

  // REST: (Optional) Get all sessions for a user (customer or agent)
  getUserSessions(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sessions/${userId}`);
  }

  // REST: Get all unassigned sessions (for admin/agent dashboard)
  getUnassignedSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/unassigned-sessions`);
  }

  // REST: Get all sessions assigned to an agent (admin)
  getAssignedSessions(agentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/assigned-sessions/${agentId}`);
  }

  // WebSocket: Connect to a session
  connect(sessionId: number): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
    });
    this.stompClient.onConnect = () => {
      // Call all registered onConnect callbacks
      this.onConnectCallbacks.forEach(cb => cb());
      this.onConnectCallbacks = [];
      this.connected = true;
      this.connectedSubject.next(true);
      this.subscription = this.stompClient?.subscribe(
        `/topic/chat.session.${sessionId}`,
        (message: IMessage) => {
          const body = JSON.parse(message.body);
          if ('content' in body) {
            this.messageSubject.next(body as ChatMessage);
          } else if ('agentId' in body) {
            this.messageSubject.next(body as SessionAssignmentUpdate);
          }
        }
      );
      // Subscribe to session summary updates (global)
      this.sessionSubscription = this.stompClient?.subscribe(
        `/topic/chat.sessions`,
        (message: IMessage) => {
          const body = JSON.parse(message.body);
          this.sessionUpdateSubject.next(body as SessionSummary);
        }
      );
      // Listen for typing events on the session topic
      this.subscribeToTyping(sessionId);
    };
    this.stompClient.onDisconnect = () => {
      this.connected = false;
      this.connectedSubject.next(false);
    };
    this.stompClient.activate();
  }

  isConnected(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.stompClient?.deactivate();
    this.stompClient = null;
    this.connected = false;
    this.connectedSubject.next(false);
  }

  sendMessage(msg: ChatMessage): void {
    if (!this.connected) return;
    this.stompClient?.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(msg),
    });
  }

  onMessage(): Observable<ChatMessage | SessionAssignmentUpdate> {
    return this.messageSubject.asObservable();
  }

  onSessionUpdate(): Observable<SessionSummary> {
    return this.sessionUpdateSubject.asObservable();
  }

  // WebSocket: Mark a message as read
  markMessageRead(update: ReadStatusUpdate): void {
    if (!this.connected) return;
    this.stompClient?.publish({
      destination: '/app/chat.markRead',
      body: JSON.stringify(update),
    });
  }

  markAllAgentMessagesRead(sessionId: number, customerId: number) {
    console.log('STOMP client:', this.stompClient);
    if (this.stompClient && typeof (this.stompClient as any).publish === 'function') {
      (this.stompClient as any).publish({
        destination: '/app/chat.markAllAgentMessagesRead',
        body: JSON.stringify({ sessionId, customerId })
      });
      console.log('Published markAllAgentMessagesRead to backend');
    } else {
      console.warn('STOMP client not connected or publish not available');
    }
  }

  // Typing indicator support
  onTypingEvent(): Observable<{ sessionId: number, senderId: number, typing: boolean }> {
    return this.typingSubject.asObservable();
  }
  sendTypingEvent(sessionId: number, isTyping: boolean) {
    if (this.stompClient && this.stompClient.connected) {
      const event = {
        sessionId,
        senderId: this.userService.userValue?.id,
        typing: isTyping
      };
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(event)
      });
    }
  }
  // Listen for typing events on the session topic
  private subscribeToTyping(sessionId: number) {
    if (!this.stompClient || !this.stompClient.connected) return;
    this.stompClient.subscribe(`/topic/chat.session.${sessionId}`, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body);
        if (data && typeof data.typing === 'boolean' && data.sessionId && data.senderId) {
          this.typingSubject.next(data);
        }
      } catch {}
    });
  }

  // Global WebSocket connection for session list updates
  connectSessionListSocket(): void {
    if (this.globalStompClient) return; // Already connected
    this.globalStompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
    });
    this.globalStompClient.onConnect = () => {
      this.globalSessionSubscription = this.globalStompClient?.subscribe(
        `/topic/chat.sessions`,
        (message: IMessage) => {
          const body = JSON.parse(message.body);
          this.sessionUpdateSubject.next(body as SessionSummary);
        }
      );
    };
    this.globalStompClient.onDisconnect = () => {
      // Optionally handle disconnect
    };
    this.globalStompClient.activate();
  }
} 