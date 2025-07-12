import { Component, OnInit } from '@angular/core';
import { DeliveryService } from '../delivery.service';
import { Delivery } from '../Delivery';
import { AuthService } from '../AuthService';

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
        alert("Fees per KM must be set for STANDARD delivery.");
        return;
      }
      this.delivery.fixAmount = null;
    }

    if (this.delivery.type === 'EXPRESS' || this.delivery.type === 'SHIP') {
      if (!this.delivery.fixAmount || this.delivery.fixAmount <= 0) {
        alert("Fixed amount must be set for EXPRESS or SHIP delivery.");
        return;
      }
      this.delivery.feesPer1km = null;
    }

    if (this.isEditMode) {
      this.deliveryService.update(this.delivery).subscribe(() => {
        this.loadDeliveries();
        this.closeModal();
      });
    } else {
      this.deliveryService.create(this.delivery).subscribe(() => {
        this.loadDeliveries();
        this.closeModal();
      });
    }
  }

  editDelivery(delivery: Delivery) {
    this.delivery = { ...delivery };
    this.isEditMode = true;
    this.showModal = true;
  }

  deleteDelivery(id: number) {
    if (confirm('Are you sure?')) {
      this.deliveryService.delete(id).subscribe(() => this.loadDeliveries());
    }
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
