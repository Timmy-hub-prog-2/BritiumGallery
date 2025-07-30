import { Component, OnInit } from '@angular/core';
import { ShopAddressService } from '../shop-address.service';
import { AddressService } from '../address.service';
import * as L from 'leaflet';
import { AuthService } from '../AuthService';
import Swal from 'sweetalert2';

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
mainAddress: any = null;

  private locationIcon = L.icon({
    iconUrl: 'assets/img/shoplocation.png',
    iconSize: [70, 70],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

    private shopIcon = L.icon({
    iconUrl: 'assets/img/shoplocation.png', // Set the same icon for all shops
    iconSize: [70, 70],
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
    // 👉 No login: Don't show user's main address
    this.userLocation = null;
    this.loadAddresses(); // still show shops, but not user location
    return;
  }

  this.addressService.getMainAddressByUserId(userId).subscribe(
    (mainAddress) => {
       this.mainAddress = mainAddress; 
      if (mainAddress.latitude && mainAddress.longitude) {
        this.userLocation = [mainAddress.latitude, mainAddress.longitude];
      }
      this.loadAddresses(); // only call this if user location is available
    },
    (error) => {
      console.error('Failed to fetch main address', error);
      this.userLocation = null;
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
           let nearest: any = null;
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
                 nearest = addr; 
              }
            }
          });
  if (this.nearbyShops.length === 0 && nearest) {
          this.nearbyShops.push(nearest);
        }

        this.nearestShop = nearest;
        this.nearbyShops.sort((a, b) => a.distance - b.distance);
      } else {
        this.nearbyShops = data;
        this.nearestShop = data.length > 0 ? data[0] : null;
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
      }).addTo(this.map).bindPopup(`
    <b>Your Main Address</b><br>
    ${this.mainAddress.houseNumber ?? ''},${this.mainAddress.wardName ?? ''},
     ${this.mainAddress.street ?? ''},
    ${this.mainAddress.township ?? ''}, ${this.mainAddress.city ?? ''}
    ${this.mainAddress.state ?? ''}, ${this.mainAddress.country ?? ''}
  `);
}

    // Show nearby shop markers
    this.nearbyShops.forEach(addr => {
      if (addr.latitude && addr.longitude) {
        const isNearest = this.nearestShop?.id === addr.id;
        const icon = isNearest
          ? L.icon({
            iconUrl: 'assets/img/shoplocation.png',
            iconSize: [70, 70],
            iconAnchor: [22, 45],
            popupAnchor: [0, -40]
          })
          : this.locationIcon;

        L.marker([addr.latitude, addr.longitude], { icon })
          .addTo(this.map!)
         .bindPopup(`
    ${addr.houseNumber ?? 'N/A'},
     ${addr.wardName ?? 'Ward Not Provided'},
    ${addr.street ?? 'Street Not Provided'},
    ${addr.township ?? 'Township Not Provided'}, ${addr.city ?? 'City Not Provided'}
    ${addr.state ?? 'State Not Provided'}, ${addr.country ?? 'Country Not Provided'}
    ${addr.postalCode ?? 'Postal Code Not Provided'}<br>
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
     L.marker(latLng, { icon: this.shopIcon })
        .addTo(this.map!)
        .bindPopup(popupContent)
        .openPopup();
    }
  }


searchLocation(): void {
  const query = this.searchQuery.trim().toLowerCase();

  if (!query) return;

  // Search in the shop address list
  const matchedAddress = this.addresses.find(addr =>
    addr.township?.toLowerCase().includes(query) ||
    addr.city?.toLowerCase().includes(query) ||
    addr.state?.toLowerCase().includes(query) ||
    addr.street?.toLowerCase().includes(query) ||
    addr.houseNumber?.toLowerCase().includes(query)
  );

  if (matchedAddress && matchedAddress.latitude && matchedAddress.longitude) {
    const latLng: [number, number] = [matchedAddress.latitude, matchedAddress.longitude];
    this.map?.setView(latLng, 16);
    const popupContent = `
      <b>${matchedAddress.township || 'Unknown Township'} Branch</b><br>
      ${matchedAddress.houseNumber}, ${matchedAddress.wardName}, ${matchedAddress.street}<br>
      ${matchedAddress.township}, ${matchedAddress.city}, ${matchedAddress.state}<br>
      ${matchedAddress.country} - ${matchedAddress.postalCode || 'N/A'}
    `;
    L.popup()
      .setLatLng(latLng)
      .setContent(popupContent)
      .openOn(this.map!);
} else {
  Swal.fire({
    icon: 'info',
    title: 'No Branch Found',
    text: '📍 There is no shop branch in the location you searched.',
    confirmButtonText: 'OK',
    customClass: {
      confirmButton: 'swal2-confirm'
    }
  });
}
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
