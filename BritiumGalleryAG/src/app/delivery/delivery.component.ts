import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
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
  activeTab: string = 'ALL'; // ALL, standard, express, ship

  // Speed type options
  speedTypeOptions = ['normal', 'fast', 'speed plus'];
  showCustomSpeedInput = false;
  customSpeedType = '';

  // Preview calculation examples
  showPreview = false;
  previewExamples: any[] = [];

  @ViewChild('modalContent') modalContentRef!: ElementRef;

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
    return {
      deliveryType: 'standard',
      speedType: 'normal',
      baseDelayDays: 0,
      baseDelayHours: 0.5,
      speedKmHr: 30,
      feePerKm: 200,
      baseFee: 0,
      maxFee: 3000,
      // Legacy fields for backward compatibility
      type: 'STANDARD',
      name: '',
      adminId: adminId ?? 0,
      feesPer1km: 200,
      fixAmount: null,
      minDelayTime: null
    };
  }

  openModal() {
    this.delivery = this.getEmptyDelivery();
    this.previousDelayTime = null;
    this.isEditMode = false;
    this.showCustomSpeedInput = false;
    this.customSpeedType = '';
    this.showPreview = false;
    this.previewExamples = [];
    this.showModal = true;
    
    // Show helpful message about existing combinations
    if (this.deliveries.length > 0) {
      const existingCombinations = this.getExistingCombinations();
      if (existingCombinations.length > 0) {
        Swal.fire({
          icon: 'info',
          title: 'Existing Delivery Methods',
          html: `
            <p>You already have the following delivery methods registered:</p>
            <ul style="text-align: left; margin: 10px 0;">
              ${existingCombinations.map(combo => `<li>• ${combo}</li>`).join('')}
            </ul>
            <p style="font-size: 0.9em; color: #666;">You cannot register duplicate combinations.</p>
          `,
          confirmButtonText: 'Got it!'
        });
      }
    }
  }

  closeModal() {
    this.showModal = false;
  }

  // Handle speed type selection
  onSpeedTypeChange() {
    if (this.delivery.speedType === 'custom') {
      this.showCustomSpeedInput = true;
      this.delivery.speedType = this.customSpeedType;
    } else {
      this.showCustomSpeedInput = false;
      this.customSpeedType = '';
    }
    this.updatePreview();
  }

  // Handle custom speed type input
  onCustomSpeedTypeChange() {
    this.delivery.speedType = this.customSpeedType;
    this.updatePreview();
  }

  // Handle delivery type change
  onDeliveryTypeChange() {
    // Reset delay times when delivery type changes
    if (this.delivery.deliveryType === 'standard') {
      this.delivery.baseDelayDays = 0;
      this.delivery.baseDelayHours = 0.5;
    } else if (this.delivery.deliveryType === 'express' || this.delivery.deliveryType === 'ship') {
      this.delivery.baseDelayDays = 1;
      this.delivery.baseDelayHours = 0;
    }
    this.updatePreview();
  }

  // Update preview calculations
  updatePreview() {
    if (!this.delivery.deliveryType) return;

    this.previewExamples = [];
    
    if (this.delivery.deliveryType === 'standard') {
      this.generateStandardExamples();
    } else if (this.delivery.deliveryType === 'express') {
      this.generateExpressExamples();
    } else if (this.delivery.deliveryType === 'ship') {
      this.generateShipExamples();
    }
  }

  // Generate examples for Standard delivery
  generateStandardExamples() {
    const examples = [
      {
        from: 'Yangon Downtown',
        to: 'Yangon Airport',
        distance: 15,
        description: 'Same city delivery (Yangon)'
      },
      {
        from: 'Mandalay City Center',
        to: 'Mandalay University',
        distance: 8,
        description: 'Same city delivery (Mandalay)'
      },
      {
        from: 'Naypyidaw Parliament',
        to: 'Naypyidaw Airport',
        distance: 12,
        description: 'Same city delivery (Naypyidaw)'
      }
    ];

    this.previewExamples = examples.map(example => {
      const fee = this.calculateStandardFee(example.distance);
      const deliveryTime = this.calculateStandardDeliveryTime(example.distance);
      
      return {
        ...example,
        fee: fee,
        deliveryTime: deliveryTime,
        breakdown: this.getStandardBreakdown(example.distance, fee)
      };
    });
  }

  // Generate examples for Express delivery (different cities)
  generateExpressExamples() {
    const examples = [
      {
        from: 'Yangon',
        to: 'Mandalay',
        distance: 620,
        description: 'Different city delivery (Yangon to Mandalay)'
      },
      {
        from: 'Mandalay',
        to: 'Naypyidaw',
        distance: 320,
        description: 'Different city delivery (Mandalay to Naypyidaw)'
      },
      {
        from: 'Yangon',
        to: 'Bagan',
        distance: 580,
        description: 'Different city delivery (Yangon to Bagan)'
      }
    ];

    this.previewExamples = examples.map(example => {
      const fee = this.calculateExpressFee(example.distance);
      const deliveryTime = this.calculateExpressDeliveryTime(example.distance);
      
      return {
        ...example,
        fee: fee,
        deliveryTime: deliveryTime,
        breakdown: this.getExpressBreakdown(example.distance, fee)
      };
    });
  }

  // Generate examples for Ship delivery (different countries)
  generateShipExamples() {
    const examples = [
      {
        from: 'Yangon',
        to: 'Thailand',
        distance: 1200,
        description: 'International delivery (Yangon to Thailand)'
      },
      {
        from: 'Mandalay',
        to: 'Singapore',
        distance: 1800,
        description: 'International delivery (Mandalay to Singapore)'
      },
      {
        from: 'Yangon',
        to: 'Malaysia',
        distance: 1500,
        description: 'International delivery (Yangon to Malaysia)'
      }
    ];

    this.previewExamples = examples.map(example => {
      const fee = this.calculateShipFee(example.distance);
      const deliveryTime = this.calculateShipDeliveryTime(example.distance);
      
      return {
        ...example,
        fee: fee,
        deliveryTime: deliveryTime,
        breakdown: this.getShipBreakdown(example.distance, fee)
      };
    });
  }

  // Calculate fee for Standard delivery
  calculateStandardFee(distance: number): number {
    const baseFee = this.delivery.baseFee || 0;
    const feePerKm = this.delivery.feePerKm || 0;
    const maxFee = this.delivery.maxFee || 0;

    // Calculate delivery fee based on distance
    let deliveryFee = distance * feePerKm;
    
    // Apply base fee logic: if delivery fee is less than base fee, use base fee
    let fee = Math.max(deliveryFee, baseFee);
    
    // Apply max fee cap if set
    if (maxFee > 0 && fee > maxFee) {
      fee = maxFee;
    }
    
    return Math.round(fee);
  }

  // Calculate fee for Express delivery
  calculateExpressFee(distance: number): number {
    const baseFee = this.delivery.baseFee || 0;
    const feePerKm = this.delivery.feePerKm || 0;
    const maxFee = this.delivery.maxFee || 0;

    // Calculate delivery fee based on distance
    let deliveryFee = distance * feePerKm;
    
    // Apply base fee logic: if delivery fee is less than base fee, use base fee
    let fee = Math.max(deliveryFee, baseFee);
    
    // Apply max fee cap if set
    if (maxFee > 0 && fee > maxFee) {
      fee = maxFee;
    }
    
    return Math.round(fee);
  }

  // Calculate fee for Ship delivery
  calculateShipFee(distance: number): number {
    const baseFee = this.delivery.baseFee || 0;
    const feePerKm = this.delivery.feePerKm || 0;
    const maxFee = this.delivery.maxFee || 0;

    // Calculate delivery fee based on distance
    let deliveryFee = distance * feePerKm;
    
    // Apply base fee logic: if delivery fee is less than base fee, use base fee
    let fee = Math.max(deliveryFee, baseFee);
    
    // Apply max fee cap if set
    if (maxFee > 0 && fee > maxFee) {
      fee = maxFee;
    }
    
    return Math.round(fee);
  }

  // Calculate delivery time for Standard
  calculateStandardDeliveryTime(distance: number): string {
    const baseHours = this.delivery.baseDelayHours || 0;
    const speedKmHr = this.delivery.speedKmHr || 30;
    
    const travelHours = distance / speedKmHr;
    const totalHours = baseHours + travelHours;
    
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}`.trim();
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  // Calculate delivery time for Express
  calculateExpressDeliveryTime(distance: number): string {
    const baseDays = this.delivery.baseDelayDays || 0;
    const speedKmHr = this.delivery.speedKmHr || 30;
    
    const travelHours = distance / speedKmHr;
    const totalHours = (baseDays * 24) + travelHours;
    
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}`.trim();
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  // Calculate delivery time for Ship
  calculateShipDeliveryTime(distance: number): string {
    const baseDays = this.delivery.baseDelayDays || 0;
    const speedKmHr = this.delivery.speedKmHr || 30;
    
    const travelHours = distance / speedKmHr;
    const totalHours = (baseDays * 24) + travelHours;
    
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') : ''}`.trim();
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  // Get breakdown for Standard delivery
  getStandardBreakdown(distance: number, totalFee: number): string {
    const baseFee = this.delivery.baseFee || 0;
    const feePerKm = this.delivery.feePerKm || 0;
    const maxFee = this.delivery.maxFee || 0;
    const deliveryFee = distance * feePerKm;
    
    let breakdown = '';
    if (feePerKm > 0) {
      breakdown += `Distance Fee: ${distance} km × ${feePerKm} MMK = ${deliveryFee} MMK`;
    }
    
    if (baseFee > 0 && deliveryFee < baseFee) {
      breakdown += ` (Minimum/Base Fee Applied: ${baseFee} MMK)`;
    }
    
    if (maxFee > 0 && totalFee === maxFee) {
      breakdown += ` (Capped at ${maxFee} MMK)`;
    }
    
    return breakdown;
  }

  // Get breakdown for Express delivery
  getExpressBreakdown(distance: number, totalFee: number): string {
    const baseFee = this.delivery.baseFee || 0;
    const feePerKm = this.delivery.feePerKm || 0;
    const maxFee = this.delivery.maxFee || 0;
    const deliveryFee = distance * feePerKm;
    
    let breakdown = '';
    if (feePerKm > 0) {
      breakdown += `Distance Fee: ${distance} km × ${feePerKm} MMK = ${deliveryFee} MMK`;
    }
    
    if (baseFee > 0 && deliveryFee < baseFee) {
      breakdown += ` (Minimum/Base Fee Applied: ${baseFee} MMK)`;
    }
    
    if (maxFee > 0 && totalFee === maxFee) {
      breakdown += ` (Capped at ${maxFee} MMK)`;
    }
    
    return breakdown;
  }

  // Get breakdown for Ship delivery
  getShipBreakdown(distance: number, totalFee: number): string {
    const baseFee = this.delivery.baseFee || 0;
    const feePerKm = this.delivery.feePerKm || 0;
    const maxFee = this.delivery.maxFee || 0;
    const deliveryFee = distance * feePerKm;
    
    let breakdown = '';
    if (feePerKm > 0) {
      breakdown += `Distance Fee: ${distance} km × ${feePerKm} MMK = ${deliveryFee} MMK`;
    }
    
    if (baseFee > 0 && deliveryFee < baseFee) {
      breakdown += ` (Minimum/Base Fee Applied: ${baseFee} MMK)`;
    }
    
    if (maxFee > 0 && totalFee === maxFee) {
      breakdown += ` (Capped at ${maxFee} MMK)`;
    }
    
    return breakdown;
  }

  // Toggle preview visibility
  togglePreview() {
    this.showPreview = !this.showPreview;
    if (this.showPreview) {
      this.updatePreview();
      setTimeout(() => {
        if (this.modalContentRef && this.modalContentRef.nativeElement) {
          this.modalContentRef.nativeElement.scrollTop = 0;
        }
      }, 0);
    }
  }

  onSubmit() {
    const adminId = this.authService.getLoggedInUserId();
    if (adminId != null) {
      this.delivery.adminId = adminId;
    }

    // Set legacy fields for backward compatibility
    this.delivery.type = this.delivery.deliveryType?.toUpperCase() as 'STANDARD' | 'EXPRESS' | 'SHIP';
    this.delivery.name = this.delivery.speedType || 'normal';
    this.delivery.feesPer1km = this.delivery.feePerKm;
    this.delivery.fixAmount = this.delivery.baseFee;

    // Check for duplicate delivery type and speed type combination
    if (!this.isEditMode && this.isDuplicateDelivery()) {
      Swal.fire({
        icon: 'warning',
        title: 'Duplicate Delivery Method',
        text: `A ${this.delivery.deliveryType} delivery with ${this.delivery.speedType} speed type already exists. Please choose a different combination.`
      });
      return;
    }

    // Validation
    if (this.delivery.deliveryType === 'standard') {
      if (!this.delivery.feePerKm || this.delivery.feePerKm <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Fee per KM must be set for standard delivery.'
        });
        return;
      }
      // For standard delivery, base fee can be 0 or any positive value
      if (this.delivery.baseFee === null || this.delivery.baseFee === undefined) {
        this.delivery.baseFee = 0;
      }
      // Standard delivery should only have baseDelayHours
      this.delivery.baseDelayDays = 0;
    }

    if (this.delivery.deliveryType === 'express' || this.delivery.deliveryType === 'ship') {
      if (!this.delivery.baseFee || this.delivery.baseFee < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Base fee must be set for express or ship delivery.'
        });
        return;
      }
      // For express/ship delivery, fee per km can be 0 or any positive value
      if (this.delivery.feePerKm === null || this.delivery.feePerKm === undefined) {
        this.delivery.feePerKm = 0;
      }
      // Express/Ship delivery should only have baseDelayDays
      this.delivery.baseDelayHours = 0;
    }

    // Validate speed type
    if (!this.delivery.speedType || this.delivery.speedType.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Speed type must be set.'
      });
      return;
    }

    // Ensure all required fields have default values if not set
    if (this.delivery.speedKmHr === null || this.delivery.speedKmHr === undefined) {
      this.delivery.speedKmHr = 30;
    }
    if (this.delivery.maxFee === null || this.delivery.maxFee === undefined) {
      this.delivery.maxFee = 0;
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
    
    // Check if speed type is custom
    if (!this.speedTypeOptions.includes(delivery.speedType || '')) {
      this.showCustomSpeedInput = true;
      this.customSpeedType = delivery.speedType || '';
    } else {
      this.showCustomSpeedInput = false;
      this.customSpeedType = '';
    }
    
    this.updatePreview();
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
      list = list.filter(d => d.deliveryType === this.activeTab.toLowerCase());
    }

    if (this.searchText.trim()) {
      const keyword = this.searchText.toLowerCase();
      list = list.filter(d => 
        d.name.toLowerCase().includes(keyword) || 
        d.deliveryType?.toLowerCase().includes(keyword) ||
        d.speedType?.toLowerCase().includes(keyword)
      );
    }

    return list;
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'standard': return 'Standard Delivery Methods';
      case 'express': return 'Express Delivery Methods';
      case 'ship': return 'Ship Delivery Methods';
      default: return 'All Delivery Methods';
    }
  }

  // Helper method to get display name for delivery
  getDeliveryDisplayName(delivery: Delivery): string {
    if (delivery.deliveryType && delivery.speedType) {
      return `${delivery.deliveryType.charAt(0).toUpperCase() + delivery.deliveryType.slice(1)} ${delivery.speedType.charAt(0).toUpperCase() + delivery.speedType.slice(1)}`;
    }
    return delivery.name || 'Unknown';
  }

  // Helper method to get pricing display
  getPricingDisplay(delivery: Delivery): string {
    if (delivery.deliveryType === 'standard') {
      return `${delivery.feePerKm} MMK/km`;
    } else {
      return `${delivery.baseFee} MMK (base)`;
    }
  }

  // Helper method to get delivery time display
  getDeliveryTimeDisplay(delivery: Delivery): string {
    let time = '';
    if (delivery.baseDelayDays && delivery.baseDelayDays > 0) {
      time += `${delivery.baseDelayDays} day(s) `;
    }
    if (delivery.baseDelayHours && delivery.baseDelayHours > 0) {
      time += `${delivery.baseDelayHours} hour(s)`;
    }
    return time || 'Same day';
  }

  // Check if base delay days should be disabled
  isBaseDelayDaysDisabled(): boolean {
    return this.delivery.deliveryType === 'standard';
  }

  // Check if base delay hours should be disabled
  isBaseDelayHoursDisabled(): boolean {
    return this.delivery.deliveryType === 'express' || this.delivery.deliveryType === 'ship';
  }

  // Check if the current delivery type and speed type combination already exists
  isDuplicateDelivery(): boolean {
    if (!this.delivery.deliveryType || !this.delivery.speedType) {
      return false;
    }

    return this.deliveries.some(existingDelivery => 
      existingDelivery.deliveryType === this.delivery.deliveryType &&
      existingDelivery.speedType === this.delivery.speedType
    );
  }

  // Get available speed types for a given delivery type
  getAvailableSpeedTypes(deliveryType: string): string[] {
    const existingSpeedTypes = this.deliveries
      .filter(d => d.deliveryType === deliveryType)
      .map(d => d.speedType || '')
      .filter(speedType => speedType !== '');

    return this.speedTypeOptions.filter(speedType => 
      !existingSpeedTypes.includes(speedType)
    );
  }

  // Check if a speed type is available for the current delivery type
  isSpeedTypeAvailable(speedType: string): boolean {
    if (!this.delivery.deliveryType) return true;
    
    return !this.deliveries.some(existingDelivery => 
      existingDelivery.deliveryType === this.delivery.deliveryType &&
      existingDelivery.speedType === speedType
    );
  }

  // Get existing combinations for display
  getExistingCombinations(): string[] {
    return this.deliveries.map(delivery => 
      `${delivery.deliveryType?.toUpperCase()} - ${delivery.speedType?.toUpperCase()}`
    );
  }
}
