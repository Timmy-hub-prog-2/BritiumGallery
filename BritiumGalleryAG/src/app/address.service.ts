import { Injectable } from '@angular/core';     
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AddressDTO } from '../AddressDTO';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = 'http://localhost:8080/api/addresses';

  constructor(private http: HttpClient) {}

  // ✅ Create Address
  createAddress(address: AddressDTO): Observable<AddressDTO> {
    return this.http.post<AddressDTO>(this.apiUrl, address);
  }

  // ✅ Get All Addresses
  getAllAddresses(): Observable<AddressDTO[]> {
    return this.http.get<AddressDTO[]>(this.apiUrl);
  }

  // ✅ Get Addresses by User ID
  getAddressesByUserId(userId: number): Observable<AddressDTO[]> {
    return this.http.get<AddressDTO[]>(`${this.apiUrl}/user/${userId}`);
  }

 // ✅ Update Address
updateAddress(id: number, address: AddressDTO): Observable<AddressDTO> {
  return this.http.put<AddressDTO>(`${this.apiUrl}/${id}`, address);
}

  // ✅ Delete Address
  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

 setMainAddress(userId: number, addressId: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/user/${userId}/main/${addressId}`, {});
}


}