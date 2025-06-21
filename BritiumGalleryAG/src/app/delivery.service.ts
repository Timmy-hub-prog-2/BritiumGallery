import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Delivery, DeliveryFeeRequestDTO, DeliveryFeeResponseDTO } from './Delivery';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })

export class DeliveryService {
  private api = 'http://localhost:8080/api/deliveries';

  
 private typesApi = this.api + '/delivery-types';


  constructor(private http: HttpClient) {}

  create(delivery: Delivery): Observable<any> {
    return this.http.post(this.api, delivery);
  }
update(delivery: Delivery): Observable<any> {
  return this.http.put(`${this.api}/${delivery.id}`, delivery);
}

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

  getAll(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.api);
  }
   getAllDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.api);
  }

  
  getDeliveryById(id: number): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.api}/${id}`);
  }

  
  getAllDeliveryTypes(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.typesApi);
  
  }

   calculateStandardFee(dto: DeliveryFeeRequestDTO): Observable<DeliveryFeeResponseDTO> {
    return this.http.post<DeliveryFeeResponseDTO>(`${this.api}/calculate-fee`, dto);
  }

}
