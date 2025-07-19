import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AddressService } from '../address.service';
import { NgForm } from '@angular/forms';
import * as L from 'leaflet'; // Import Leaflet
import { HttpClient } from '@angular/common/http';
import { AddressDTO } from '../../AddressDTO';


@Component({
  selector: 'app-addressedit',
  standalone: false,
  templateUrl: './addressedit.component.html',
  styleUrls: ['./addressedit.component.css']
})
export class AddresseditComponent implements OnInit {
  editingId: number | null = null;
  isEditing: boolean = false;
  formSubmitAttempted: boolean = false;

  address: AddressDTO = {
    id: 0,
    country: '',
    state: '',
    city: '',
    township: '',
    street: '',
    houseNumber: '',
    wardName: '',
    postalCode: '',
    latitude: 0,
    longitude: 0,
    userId: 0
  };

  map: L.Map | undefined;
  marker: L.Marker | undefined;
  searchQuery: string = '';
  locationPlaceholder: string = 'Search location';

  private locationIcon = L.icon({
    iconUrl: 'assets/img/location.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private addressService: AddressService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const navState = history.state.address;
    this.route.queryParams.subscribe((params) => {
      if (params['id'] && navState) {
        this.editingId = +params['id'];
        this.isEditing = true;
        this.populateForm(navState);
      }
    });
    this.initMap();
  }

  initMap(): void {
    this.map = L.map('map').setView([16.775, 96.1575], 13); // Center map to a default location (e.g., Myanmar)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Add a default marker with the custom location icon
    this.marker = L.marker([16.775, 96.1575], { icon: this.locationIcon }).addTo(this.map);

    // Handle click on the map to update marker position and address fields
    this.map.on('click', (event) => this.onMapClick(event));
  }

  // Handle map clicks to set the marker and update the address fields
  onMapClick(event: any): void {
    const { lat, lng } = event.latlng;

    this.address.latitude = lat;
    this.address.longitude = lng;

    // Set marker to new position with custom icon
    this.marker?.setLatLng([lat, lng]);

    // Get the address from the new coordinates
    this.getAddressFromLatLng(lat, lng);
  }


  // Get address from latitude and longitude using reverse geocoding (Nominatim API)
  getAddressFromLatLng(lat: number, lng: number): void {
    if (this.map && this.marker) {
      // Update map view and marker position
      this.map.setView([lat, lng], 15);
      this.marker.setLatLng([lat, lng]);
    }

    this.reverseGeocode(lat, lng);  // Call reverse geocoding method
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
        this.address.latitude = lat;
        this.address.longitude = lng;
        // this.center = { lat, lng };
        const zoom = addr.state && !addr.city ? 8 : 15;

        if (this.map) this.map.setView([lat, lng], zoom);
        if (this.marker) this.marker.setLatLng([lat, lng]);

        this.address.country = addr.country || '';
        this.address.state = addr.state || '';
        this.address.city = addr.city || addr.town || addr.village || '';
        this.address.township = addr.suburb || addr.neighbourhood || '';
        this.address.street = addr.road || addr.street || '';
        this.address.postalCode = addr.postcode || '';
      } else {
        alert('No location found.');
      }
    }, error => {
      console.error('Geocoding failed:', error);
      alert('Failed to fetch location.');
    });
  }

  // Get current location
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.address.latitude = lat;
          this.address.longitude = lng;
          //  this.center = { lat, lng };

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

  reverseGeocode(lat: number, lng: number) {
    this.address.latitude = lat;
    this.address.longitude = lng;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;

    this.http.get<any>(url).subscribe(res => {
      const addr = res.address || {};

      this.address.city = addr.city || addr.town || addr.village || '';
      this.address.township = addr.suburb
      addr.neighbourhood
      addr.village
      addr.hamlet
      addr.quarter
      addr.town
      addr.city_district
        || '';
      this.address.street = addr.road || addr.street || '';
      this.address.state = addr.state || '';
      this.address.country = addr.country || '';
      this.address.postalCode = addr.postcode || '';

      this.locationPlaceholder = [
        addr.road || addr.street || '',
        addr.suburb || addr.neighbourhood || '',
        addr.city || addr.town || addr.village || ''
      ].filter(Boolean).join(', ') || 'Search township, street, etc.';
    });
  }

 populateForm(address: AddressDTO): void {
  this.address = { ...address };

  // Delay setting map location slightly to ensure map is fully initialized
  setTimeout(() => {
    if (this.map && this.marker && address.latitude && address.longitude) {
      const latLng: L.LatLngExpression = [address.latitude, address.longitude];
      this.map.setView(latLng, 15);
      this.marker.setLatLng(latLng);
    }
  }, 300); // Wait 300ms or tweak as needed
}

  // Submit the form to update address
  submitForm(form: NgForm): void {
    this.formSubmitAttempted = true;
    if (form.valid && this.editingId) {
      this.address.id = this.editingId;
      this.addressService.updateAddress(this.editingId, this.address).subscribe(() => {
        alert('Address updated successfully!');
        this.router.navigate(['/addresslist']);
      });
    }
  }

  // Cancel edit
  cancelEdit(): void {
    if (confirm('Are you sure you want to cancel editing?')) {
      this.router.navigate(['/addresslist']);
    }
  }


  resetForm(): void {
    this.router.navigate(['/addresslist']);
  }
}
