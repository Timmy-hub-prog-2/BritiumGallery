import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { Notification } from './notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationWebSocketService {
  private stompClient: Client | null = null;
  private notificationSubject = new Subject<Notification>();

  connect(userId: number) {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
    });
    this.stompClient.onConnect = () => {
      const client = this.stompClient;
      if (client) {
        client.subscribe(`/topic/notifications.user.${userId}`, (message: IMessage) => {
          this.notificationSubject.next(JSON.parse(message.body));
        });
      }
    };
    this.stompClient.activate();
  }

  get notifications$() {
    return this.notificationSubject.asObservable();
  }

  disconnect() {
    const client = this.stompClient;
    if (client !== null) {
      client.deactivate();
    }
  }
}