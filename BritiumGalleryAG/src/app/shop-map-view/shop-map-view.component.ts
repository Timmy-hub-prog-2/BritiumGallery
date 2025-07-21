import { Component, OnInit } from '@angular/core';
import { ShopAddressService } from '../shop-address.service';
import { AddressService } from '../address.service';
import * as L from 'leaflet';
import { AuthService } from '../AuthService';

@Component({
  selector: 'app-shop-map-view',
  standalone: false,
  templateUrl: './shop-map-view.component.html',
  styleUrls: ['./shop-map-view.component.css']
})
export class ShopMapViewComponent implements OnInit {
  addresses: any[] = [];
  nearbyShops: any[] = [];
  userLocation: [number, number] | null = null;
  nearestShop: any = null;
  searchQuery: string = '';
  private map: L.Map | null = null;
  showAllShops: boolean = false;

  private locationIcon = L.icon({
    iconUrl: 'assets/img/location.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  constructor(
    private shopAddressService: ShopAddressService,
    private addressService: AddressService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getUserLocation();
  }

  getUserLocation(): void {
    const userId = this.authService.getLoggedInUserId();
    if (!userId) {
      console.error('User not logged in. Cannot fetch main address.');
      this.userLocation = [16.8661, 96.1951]; // fallback Yangon
      this.loadAddresses();
      return;
    }

    this.addressService.getMainAddressByUserId(userId).subscribe(
      (mainAddress) => {
        if (mainAddress.latitude && mainAddress.longitude) {
          this.userLocation = [mainAddress.latitude, mainAddress.longitude];
        } else {
          this.userLocation = [16.8661, 96.1951]; // fallback Yangon
        }
        this.loadAddresses();
      },
      (error) => {
        console.error('Failed to fetch main address', error);
        this.userLocation = [16.8661, 96.1951];
        this.loadAddresses();
      }
    );
  }

  loadAddresses(): void {
    this.shopAddressService.getAll().subscribe(
      (data: any[]) => {
        this.addresses = data.map(addr => {
          if (addr.latitude && addr.longitude && this.userLocation) {
            const [userLat, userLng] = this.userLocation;
            addr.distance = this.getDistanceFromLatLonInKm(userLat, userLng, addr.latitude, addr.longitude);
          } else {
            addr.distance = Infinity;
          }
          return addr;
        }).sort((a, b) => a.distance - b.distance); // sort all shops by distance


        if (this.userLocation) {
          const [userLat, userLng] = this.userLocation;
          let minDistance = Infinity;
          this.nearbyShops = [];

          data.forEach(addr => {
            if (addr.latitude && addr.longitude) {
              const dist = this.getDistanceFromLatLonInKm(userLat, userLng, addr.latitude, addr.longitude);
              addr.distance = dist;

              if (dist <= 5) {
                this.nearbyShops.push(addr);
              }

              if (dist < minDistance) {
                minDistance = dist;
                this.nearestShop = addr;
              }
            }
          });

          // ✅ Sort nearby shops by distance (nearest first)
          this.nearbyShops.sort((a, b) => a.distance - b.distance);
        } else {
          // Fallback if user location is not available
          this.nearbyShops = data;
        }

        setTimeout(() => this.initMap(), 100);
      },
      (error) => console.error('Error loading shop addresses:', error)
    );
  }


  initMap(): void {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer || (mapContainer as any)._leaflet_id) return;

    const centerLatLng: [number, number] = this.userLocation ?? [16.8661, 96.1951];
    this.map = L.map('map-container').setView(centerLatLng, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(this.map);

    // Show marker for user's main address
    if (this.userLocation) {
      L.marker(this.userLocation, {
        icon: L.icon({
          iconUrl: 'assets/img/user-location-icon.png',
          iconSize: [50, 50],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        })
      }).addTo(this.map).bindPopup('<b>Your Main Address</b>');
    }

    // Show nearby shop markers
    this.nearbyShops.forEach(addr => {
      if (addr.latitude && addr.longitude) {
        const isNearest = this.nearestShop?.id === addr.id;
        const icon = isNearest
          ? L.icon({
            iconUrl: 'assets/img/location.png',
            iconSize: [45, 45],
            iconAnchor: [22, 45],
            popupAnchor: [0, -40]
          })
          : this.locationIcon;

        L.marker([addr.latitude, addr.longitude], { icon })
          .addTo(this.map!)
          .bindPopup(`
            <b>${addr.houseNumber}</b><br>${addr.street}
            ${isNearest ? '<br><span style="color: green;">🟢 Nearest Shop</span>' : ''}
          `);
      }
    });
  }

  focusOnShop(address: any): void {
    if (this.map && address.latitude && address.longitude) {
      const latLng: [number, number] = [address.latitude, address.longitude];
      this.map.setView(latLng, 16);
      const popupContent = `
        <b>${address.township || 'Unknown Township'} Branch</b><br>
        ${address.houseNumber}, ${address.wardName}, ${address.street}<br>
        ${address.township}, ${address.city}, ${address.state}<br>
        ${address.country} - ${address.postalCode || 'N/A'}
      `;
      L.popup()
        .setLatLng(latLng)
        .setContent(popupContent)
        .openOn(this.map);
    }
  }

  searchLocation(): void {
    if (!this.searchQuery) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchQuery)}`;

    fetch(url)
      .then(res => res.json())
      .then(results => {
        if (results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          if (this.map) {
            this.map.setView([lat, lon], 14);
            L.marker([lat, lon], {
              icon: L.icon({
                iconUrl: 'assets/img/location.png',
                iconSize: [40, 40],
                iconAnchor: [15, 30]
              })
            }).addTo(this.map).bindPopup(`<b>${this.searchQuery}</b>`).openPopup();
          }
        } else {
          alert('Location not found');
        }
      });
  }

  getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
