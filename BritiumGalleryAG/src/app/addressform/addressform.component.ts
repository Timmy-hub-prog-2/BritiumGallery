import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { NgForm } from '@angular/forms';
import 'leaflet-control-geocoder';
import { Router } from '@angular/router';

@Component({
  selector: 'app-addressform',
  standalone: false,
  templateUrl: './addressform.component.html',
  styleUrls: ['./addressform.component.css']
})
export class AddressformComponent implements AfterViewInit {
  // Form fields
  city = '';
  township = '';
  street = '';
  houseNumber = '';
  wardName = '';
  state = '';
  country = '';
  postalCode = '';

  center = { lat: 16.8661, lng: 96.1951 };
  searchQuery = '';
  locationPlaceholder = 'Search township, street, etc.';

  formSubmitAttempted = false;
  editingId: number | null = null;
  addresses: any[] = [];

  private map: any;
  private marker: any;

  private locationIcon = L.icon({
    iconUrl: 'assets/img/location.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  constructor(private http: HttpClient,private router: Router) { }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.getCurrentLocation();
  }

  initializeMap() {
    this.map = L.map('map').setView([this.center.lat, this.center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

    this.marker = L.marker([this.center.lat, this.center.lng], {
      draggable: true,
      icon: this.locationIcon
    }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.center = { lat: pos.lat, lng: pos.lng };
      this.reverseGeocode(pos.lat, pos.lng);
    });

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.center = { lat, lng };
      this.reverseGeocode(lat, lng);
    });

    this.loadAddresses();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.center = { lat, lng };

          if (this.map) this.map.setView([lat, lng], 15);
          if (this.marker) this.marker.setLatLng([lat, lng]);

          this.reverseGeocode(lat, lng);
        },
        error => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  searchLocation() {
    const query = this.searchQuery.trim();
    if (query.length <= 2) return;

    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=1&accept-language=en`;

    this.http.get<any[]>(url).subscribe(results => {
      if (results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const addr = result.address || {};

        this.center = { lat, lng };
        const zoom = addr.state && !addr.city ? 8 : 15;

        if (this.map) this.map.setView([lat, lng], zoom);
        if (this.marker) this.marker.setLatLng([lat, lng]);

        this.country = addr.country || '';
        this.state = addr.state || '';
        this.city = addr.city || addr.town || addr.village || '';
        this.township = addr.suburb || addr.neighbourhood || '';
        this.street = addr.road || addr.street || '';
        this.postalCode = addr.postcode || '';
      } else {
        alert('No location found.');
      }
    }, error => {
      console.error('Geocoding failed:', error);
      alert('Failed to fetch location.');
    });
  }

  reverseGeocode(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;

    this.http.get<any>(url).subscribe(res => {
      const addr = res.address || {};

      this.city = addr.city || addr.town || addr.village || '';
      this.township = addr.suburb
         addr.neighbourhood
         addr.village
         addr.hamlet
         addr.quarter
         addr.town
         addr.city_district
        || '';
      this.street = addr.road || addr.street || '';
      this.state = addr.state || '';
      this.country = addr.country || '';
      this.postalCode = addr.postcode || '';

      this.locationPlaceholder = [
        addr.road || addr.street || '',
        addr.suburb || addr.neighbourhood || '',
        addr.city || addr.town || addr.village || ''
      ].filter(Boolean).join(', ') || 'Search township, street, etc.';
    });
  }

  submitForm(form: NgForm) {
    this.formSubmitAttempted = true;
    if (!form.valid) {
      alert('Please fill in all required fields.');
      return;
    }

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const userId = loggedInUser.id;

    const addressPayload = {
      userId,
      city: this.city,
      township: this.township,
      street: this.street,
      houseNumber: this.houseNumber,
      wardName: this.wardName,
      state: this.state,
      country: this.country,
      postalCode: this.postalCode,
      latitude: this.center.lat,
      longitude: this.center.lng
    };

    const url = this.editingId
      ? `http://localhost:8080/api/addresses/${this.editingId}`
      : `http://localhost:8080/api/addresses`;

    const request = this.editingId
      ? this.http.put(url, addressPayload)
      : this.http.post(url, addressPayload);

    request.subscribe({
      next: () => {
        alert(this.editingId ? 'Address updated successfully' : 'Address saved successfully');
        this.resetForm();
        this.loadAddresses();
         this.router.navigate(['/addresslist']);
      },
      error: err => {
        console.error('Address save failed:', err);
        alert('Something went wrong. Please try again.');
      }
    });
  }

  loadAddresses() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const userId = loggedInUser.id;

    this.http.get<any[]>(`http://localhost:8080/api/addresses/user/${userId}`).subscribe(data => {
      this.addresses = data;
    });
  }

  editAddress(address: any) {
    this.editingId = address.id;
    this.city = address.city;
    this.township = address.township;
    this.street = address.street;
    this.houseNumber = address.houseNumber;
    this.wardName = address.wardName;
    this.state = address.state;
    this.country = address.country;
    this.postalCode = address.postalCode;
    this.center = { lat: address.latitude, lng: address.longitude };

    if (this.map) {
      this.map.setView([address.latitude, address.longitude], 15);
      this.marker.setLatLng([address.latitude, address.longitude]);
    }
  }

  deleteAddress(id: number) {
    if (!confirm('Are you sure you want to delete this address?')) return;

    this.http.delete(`http://localhost:8080/api/addresses/${id}`).subscribe(() => {
      alert('Address deleted.');
      this.loadAddresses();
    });
  }

  resetForm() {
    this.city = '';
    this.township = '';
    this.street = '';
    this.houseNumber = '';
    this.wardName = '';
    this.state = '';
    this.country = '';
    this.postalCode = '';
    this.center = { lat: 16.8661, lng: 96.1951 };
    this.editingId = null;
    this.formSubmitAttempted = false;
  }
}
