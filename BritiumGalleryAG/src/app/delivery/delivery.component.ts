import { Component, OnInit } from '@angular/core';
import { DeliveryService } from '../delivery.service';
import { Delivery } from '../Delivery';
import { AuthService } from '../AuthService';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delivery',
  standalone: false,
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.css']
})
export class DeliveryComponent implements OnInit {
  delivery!: Delivery;
  deliveries: Delivery[] = [];

  showModal = false;
  isEditMode = false;
previousDelayTime: number | null = null;

  searchText: string = '';
  activeTab: string = 'ALL'; // ALL, STANDARD, EXPRESS, SHIP

  constructor(
    private deliveryService: DeliveryService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.delivery = this.getEmptyDelivery();
    this.loadDeliveries();
  }

  getEmptyDelivery(): Delivery {
    const adminId = this.authService.getLoggedInUserId();
    const shopUserId = this.authService.getLoggedInUserId();
    return {
      type: 'STANDARD',
      name: '',
      adminId: adminId ?? 0,
      feesPer1km: 0,
      fixAmount: 0,
      minDelayTime: null,
      shopUserId: shopUserId ?? 0
    };
  }

  openModal() {
    this.delivery = this.getEmptyDelivery();
    this.previousDelayTime = null;
    this.isEditMode = false;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

onSubmit() {
  const adminId = this.authService.getLoggedInUserId();
  if (adminId != null) {
    this.delivery.adminId = adminId;
  }

  // Validation
  if (this.delivery.type === 'STANDARD') {
    if (!this.delivery.feesPer1km || this.delivery.feesPer1km <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Fees per KM must be set for STANDARD delivery.'
      });
      return;
    }
    this.delivery.fixAmount = null;
  }

  if (this.delivery.type === 'EXPRESS' || this.delivery.type === 'SHIP') {
    if (!this.delivery.fixAmount || this.delivery.fixAmount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Fixed amount must be set for EXPRESS or SHIP delivery.'
      });
      return;
    }
    this.delivery.feesPer1km = null;
  }

  if (this.isEditMode) {
    this.deliveryService.update(this.delivery).subscribe(() => {
      this.loadDeliveries();
      this.closeModal();
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Delivery method updated successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    }, err => {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'An error occurred while updating delivery.'
      });
    });
  } else {
    this.deliveryService.create(this.delivery).subscribe(() => {
      this.loadDeliveries();
      this.closeModal();
      Swal.fire({
        icon: 'success',
        title: 'Created!',
        text: 'Delivery method created successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    }, err => {
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: 'An error occurred while creating delivery.'
      });
    });
  }
}

  editDelivery(delivery: Delivery) {
    this.delivery = { ...delivery };
     this.previousDelayTime = delivery.minDelayTime != null ? Number(delivery.minDelayTime) : null;
    this.isEditMode = true;
    this.showModal = true;
  }

deleteDelivery(id: number) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will permanently delete the delivery method.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.deliveryService.delete(id).subscribe(() => {
        this.loadDeliveries();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Delivery method has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
      }, err => {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'An error occurred while deleting.'
        });
      });
    }
  });
}


  loadDeliveries() {
    this.deliveryService.getAll().subscribe({
      next: data => {
        this.deliveries = data;
      },
      error: err => console.error('API error:', err)
    });
  }

  // Filtered deliveries for current tab and search text
  filteredDeliveries(): Delivery[] {
    let list = this.deliveries;

    if (this.activeTab !== 'ALL') {
      list = list.filter(d => d.type === this.activeTab);
    }

    if (this.searchText.trim()) {
      const keyword = this.searchText.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(keyword));
    }

    return list;
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'STANDARD': return 'Standard Delivery Methods';
      case 'EXPRESS': return 'Express Delivery Methods';
      case 'SHIP': return 'Ship Delivery Methods';
      default: return 'All Delivery Methods';
    }
  }
}
