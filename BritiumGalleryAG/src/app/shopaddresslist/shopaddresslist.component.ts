import { Component, OnInit } from '@angular/core';
import { AuthService } from '../AuthService';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { ShopAddressService } from '../shop-address.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-shopaddresslist',
  standalone: false,
  templateUrl: './shopaddresslist.component.html',
  styleUrl: './shopaddresslist.component.css'
})
export class ShopaddresslistComponent implements OnInit {
  addresses: any[] = [];
  currentUserId!: number;
  private locationIcon = L.icon({
    iconUrl: 'assets/img/location.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  constructor(
    private addressService: ShopAddressService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchAddresses();
  }

  fetchAddresses(): void {
    const userId = this.authService.getLoggedInUserId();
    if (userId) {
      this.currentUserId = userId; // ✅ FIXED
      this.addressService.getByUserId(userId).subscribe(
        (data: any[]) => {
          this.addresses = data;

          // Delay map init to allow DOM to render map containers
          setTimeout(() => {
            this.initializeMaps();
          }, 100); // Delay a bit more for safety
        },
        (error) => {
          console.error('Error fetching addresses:', error);
        }
      );
    } else {
      console.error('User not logged in');
    }
  }
  initializeMaps(): void {
    this.addresses.forEach((address) => {
      const lat = address.latitude;
      const lng = address.longitude;
      const mapElementId = `map-${address.id}`;

      const mapElement = document.getElementById(mapElementId);

      // 💡 Skip if the element doesn't exist (maybe still rendering)
      if (!mapElement) return;

      // ❌ Avoid reinitializing Leaflet map on same DOM
      if ((mapElement as any)._leaflet_id) return;

      if (lat && lng) {
        const map = L.map(mapElementId).setView([lat, lng], 15); // Zoomed in

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);


        L.marker([lat, lng], {
          icon: this.locationIcon,
          draggable: false
        }).addTo(map)
          .bindPopup(`<b>${address.houseNumber}</b><br>${address.street}`)
          ;
      }
    });
  }

  editAddress(address: any): void {
    this.router.navigate(['/shopaddressedit'], {
      queryParams: { id: address.id },
      state: { address }
    });
  }

  deleteAddress(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will delete the address permanently.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.addressService.deleteAddress(id).subscribe(() => {
          this.fetchAddresses(); // Refresh after delete

          // ✅ Show success message
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The address has been deleted.',
            timer: 2000,
            showConfirmButton: false
          });
        });
      }
    });
  }

  addNewAddress() {
    this.router.navigate(['/shopaddressform']);
  }
  markAsMain(addressId: number): void {
    if (!this.currentUserId) {
      console.error('Cannot set main address: userId is undefined');
      return;
    }

    this.addressService.setMain(this.currentUserId, addressId).subscribe(() => {
      this.fetchAddresses();

      // ✅ Show success message
      Swal.fire({
        icon: 'success',
        title: 'Main Address Updated!',
        text: 'This address is now set as your main address.',
        timer: 2000,
        showConfirmButton: false
      });
    }, error => {
      console.error('Set main address failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed!',
        text: 'Could not set the main address. Please try again.',
      });
    });
  }


}