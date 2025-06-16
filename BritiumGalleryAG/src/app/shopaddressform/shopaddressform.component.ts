import { Component, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { NgForm } from '@angular/forms';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shopaddressform',
  standalone:false,
  templateUrl: './shopaddressform.component.html',
  styleUrls: ['./shopaddressform.component.css']
})
export class ShopaddressformComponent implements AfterViewInit {
  // Form fields
  country = '';
  state = '';
  city = '';
  township = '';
  street = '';
  houseNumber = '';
  wardName = '';
  postalCode = '';
  formSubmitAttempted = false;
  editingId: number | null = null;

  center = { lat: 16.8661, lng: 96.1951 };
  searchQuery = '';
  locationPlaceholder = 'Search location...';

  userId: number | null = null;
  shopAddresses: any[] = [];

  private map: any;
  private marker: any;

  private locationIcon = L.icon({
    iconUrl: 'assets/img/location.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.userId = this.authService.getLoggedInUserId();
      this.initializeMap();
      this.getCurrentLocation();
    });
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

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.center = { lat, lng };
      this.marker.setLatLng([lat, lng]);
      this.reverseGeocode(lat, lng);
    });

    this.loadShopAddresses();
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.center = { lat, lng };
          this.map.setView([lat, lng], 15);
          this.marker.setLatLng([lat, lng]);
          this.reverseGeocode(lat, lng);
        },
        (error) => {
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

    this.http.get<any[]>(url).subscribe((results) => {
      if (results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const addr = result.address || {};

        this.center = { lat, lng };
        const zoom = addr.state && !addr.city ? 8 : 15;

        this.map.setView([lat, lng], zoom);
        this.marker.setLatLng([lat, lng]);

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

    this.http.get<any>(url).subscribe((res) => {
      const addr = res.address || {};
      this.city = addr.city || addr.town || addr.village || '';
      this.township = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || '';
      this.street = addr.road || addr.street || '';
      this.state = addr.state || '';
      this.country = addr.country || '';
      this.postalCode = addr.postcode || '';

      this.locationPlaceholder = [
        addr.road || addr.street || '',
        addr.suburb || addr.neighbourhood || '',
        addr.city || addr.town || addr.village || ''
      ].filter(Boolean).join(', ') || 'Search location...';
    });
  }

 submitForm(form: NgForm) {
  this.formSubmitAttempted = true;
  if (!form.valid || !this.userId) {
    alert('Please fill in all required fields.');
    return;
  }

  // Check if this is the first address for the user
  this.http.get<any[]>(`http://localhost:8080/api/shopaddresses/user/${this.userId}`)
    .subscribe(existingAddresses => {
      const isFirst = existingAddresses.length === 0;

      const payload = {
        userId: this.userId,
        country: this.country,
        state: this.state,
        city: this.city,
        township: this.township,
        street: this.street,
        houseNumber: this.houseNumber,
        wardName: this.wardName,
        postalCode: this.postalCode,
        latitude: this.center.lat,
        longitude: this.center.lng,
        mainAddress: isFirst // ✅ set to true if first address
      };

      const url = this.editingId
        ? `http://localhost:8080/api/shopaddresses/${this.editingId}`
        : `http://localhost:8080/api/shopaddresses`;

      const request = this.editingId
        ? this.http.put(url, payload)
        : this.http.post(url, payload);

      request.subscribe({
        next: () => {
          alert(this.editingId ? 'Shop address updated successfully' : 'Shop address saved successfully');
          this.resetForm();
          this.loadShopAddresses();
          this.router.navigate(['/shopaddresslist']);
        },
        error: err => {
          console.error('Shop address save failed:', err);
          alert('Something went wrong. Please try again.');
        }
      });
    });
}

  loadShopAddresses() {
    if (!this.userId) return;

    this.http.get<any[]>(`http://localhost:8080/api/shopaddresses/user/${this.userId}`)
      .subscribe(data => this.shopAddresses = data);
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
    if (!confirm('Are you sure you want to delete this shop address?')) return;

    this.http.delete(`http://localhost:8080/api/shopaddresses/${id}`)
      .subscribe(() => {
        alert('Shop address deleted.');
        this.loadShopAddresses();
      });
  }

  resetForm() {
    this.country = '';
    this.state = '';
    this.city = '';
    this.township = '';
    this.street = '';
    this.houseNumber = '';
    this.wardName = '';
    this.postalCode = '';
    this.center = { lat: 16.8661, lng: 96.1951 };
    this.editingId = null;
    this.formSubmitAttempted = false;
  }
}
