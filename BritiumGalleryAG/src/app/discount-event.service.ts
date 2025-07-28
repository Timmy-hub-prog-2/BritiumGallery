import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DiscountEventService {
  private baseUrl = 'http://localhost:8080/api/discount';

  constructor(private http: HttpClient) {}

  createEvent(event: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/events`, event);
  }

  getAllEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/events`);
  }

  deleteEvent(eventId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/events/${eventId}`);
  }

  updateEvent(eventId: number, event: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/events/${eventId}`, event);
  }

  getEventHistory(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/events/${eventId}/history`);
  }

  activateEvent(eventId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/events/${eventId}/activate`, {});
  }

  deactivateEvent(eventId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/events/${eventId}/deactivate`, {});
  }

  // Add other methods as needed, using this.baseUrl
} 