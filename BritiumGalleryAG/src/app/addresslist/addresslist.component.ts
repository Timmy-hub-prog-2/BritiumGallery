import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AddressService } from '../address.service';
import { AuthService } from '../AuthService';
import * as L from 'leaflet';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-addresslist',
  standalone: false,
  templateUrl: './addresslist.component.html',
  styleUrls: ['./addresslist.component.css'],
})
export class AddresslistComponent implements OnInit {
  addresses: any[] = [];
  currentUserId!: number;
  private locationIcon = L.icon({
    iconUrl: 'assets/img/location.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  constructor(
    private addressService: AddressService,
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
      this.addressService.getAddressesByUserId(userId).subscribe(
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

    // Ensure DOM element exists
    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) return;

    // ❌ Prevent re-initializing map on same div
    if ((mapElement as any)._leaflet_id) {
      return;
    }

    if (lat && lng) {
      const map = L.map(mapElementId).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.marker([lat, lng], { icon: this.locationIcon })
        .addTo(map)
        .bindPopup(`<b>${address.houseNumber}</b><br>${address.street}`);
    }
  });
}

  editAddress(address: any): void {
    this.router.navigate(['/addressedit'], {
      queryParams: { id: address.id },
      state: { address }
    });
  }

 deleteAddress(id: number): void {
  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this address?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.addressService.deleteAddress(id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The address has been deleted.',
            timer: 2000,
            showConfirmButton: false
          });
          this.fetchAddresses(); // Refresh the list
        },
        error: (err) => {
          console.error('Delete failed:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete address. Please try again later.'
          });
        }
      });
    }
  });
}


  addNewAddress() {
    this.router.navigate(['/addressform']);
  }
markAsMain(addressId: number): void {
  if (!this.currentUserId) {
    console.error('Cannot set main address: userId is undefined');
    return;
  }

  console.log("Setting as main address: ", addressId);

  this.addressService.setMainAddress(this.currentUserId, addressId).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success',
        title: 'Main Address Updated',
        text: 'This address is now set as your main address.',
        timer: 2000,
        showConfirmButton: false
      });
      this.fetchAddresses();
    },
    error: (err) => {
      console.error('Failed to set main address:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update the main address. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  });

}


}