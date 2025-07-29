import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
  relatedObjectId?: number;
  trackingCode?: string;
  actionLink?: string;
}

export interface CreateNotificationRequest {
  mode: 'INSTANT' | 'SCHEDULED';
  title: string;
  message: string;
  type: string;
  roleIds: number[];
  customerTypeIds?: number[];
  actionLink?: string;
  cronExpression?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}

export interface ScheduledNotificationOccurrence {
  id: number;
  title: string;
  message: string;
  occurrenceDate: string; // ISO string
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  getUserNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${notificationId}/read`, {});
  }

  getAdminNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/admin/targeted`);
  }

  getAllRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`);
  }

  getAllCustomerTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customer-types`);
  }

  createNotification(payload: CreateNotificationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, payload);
  }

  // --- Scheduled Notification Management ---
  getScheduledNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/scheduled`);
  }

  updateScheduledNotification(id: number, payload: CreateNotificationRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  updateScheduledNotificationStatus(id: number, active: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { active });
  }

  deleteScheduledNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getUserScheduledNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/scheduled/user/${userId}`);
  }

  /**
   * Fetch the history of occurrences for a scheduled notification.
   * @param id Scheduled notification ID
   * @param from ISO string (start date)
   * @param to ISO string (end date)
   */
  getScheduledNotificationHistory(id: number, from: string, to: string): Observable<ScheduledNotificationOccurrence[]> {
    return this.http.get<ScheduledNotificationOccurrence[]>(`${this.apiUrl}/scheduled/${id}/history`, {
      params: { from, to }
    });
  }

  registerRestockNotification(userId: number, productVariantId: number) {
    return this.http.post<any>(`http://localhost:8080/restock-notification/register`, null, {
      params: { userId: userId.toString(), productVariantId: productVariantId.toString() }
    });
  }
} 