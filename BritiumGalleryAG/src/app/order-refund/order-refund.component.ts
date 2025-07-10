import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { RefundService, RefundRequestDTO } from '../services/refund.service';
import { OrderService } from '../services/order.service';

type RefundType = 'whole' | 'partial' | null;

@Component({
  selector: 'app-order-refund',
  standalone: false,
  templateUrl: './order-refund.component.html',
  styleUrl: './order-refund.component.css',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class OrderRefundComponent {
  searchForm: FormGroup;
  refundForm: FormGroup;
  loading = false;
  submitting = false;
  error: string | null = null;
  order: any = null;
  refundType: RefundType = null;

  constructor(
    private fb: FormBuilder, 
    private refundService: RefundService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      trackingCode: ['', Validators.required]
    });
    this.refundForm = this.initRefundForm();
  }

  private initRefundForm(): FormGroup {
    return this.fb.group({
      reason: ['', Validators.required],
      proof: [null],
      proofPreview: [null],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.refundForm.get('items') as FormArray;
  }

  get itemFormGroups(): FormGroup[] {
    return this.items.controls as FormGroup[];
  }

  searchOrder() {
    if (this.searchForm.invalid) return;
    
    this.loading = true;
    this.error = null;
    this.order = null;
    this.refundType = null;
    
    const code = this.searchForm.value.trackingCode.trim();
    
    this.orderService.getOrderForRefund(code).subscribe({
      next: (res) => {
        this.order = res;
        console.log('Order details for refund (frontend):', this.order.orderDetails);
        this.loading = false;
        this.initItemsForm();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Order not found or not eligible for refund.';
        this.loading = false;
      }
    });
  }

  initItemsForm() {
    this.items.clear();
    if (this.order?.orderDetails) {
      for (const item of this.order.orderDetails) {
        if (item.remainingQty > 0) {
          this.items.push(this.fb.group({
            selected: [false],
            orderDetailId: [item.id],
            variant: [item.variant],
            quantity: [item.quantity],
            remainingQty: [item.remainingQty],
            price: [item.price],
            discountAmount: [item.discountAmount],
            discountPercent: [item.discountPercent],
            actualRefundableAmount: [item.actualRefundableAmount],
            refundQuantity: [1],
            reason: [''],
            proof: [null],
            proofPreview: [null]
          }));
        }
      }
    }
  }

  setRefundType(type: RefundType) {
    this.refundType = type;
    this.refundForm = this.initRefundForm();
    if (type === 'whole') {
      this.refundForm.get('reason')?.setValidators([Validators.required]);
      this.refundForm.get('reason')?.updateValueAndValidity();
      this.items.clear();
    } else if (type === 'partial') {
      this.refundForm.get('reason')?.clearValidators();
      this.refundForm.get('reason')?.updateValueAndValidity();
      if (this.order) {
        this.initItemsForm();
      }
    }
  }

  onItemSelect(i: number) {
    const item = this.items.at(i);
    const isSelected = item.get('selected')?.value;
    console.log('onItemSelect', i, 'selected:', isSelected, 'item:', item.value);

    if (!isSelected) {
      // Reset values when unchecked
      item.get('refundQuantity')?.clearValidators();
      item.get('reason')?.clearValidators();
      item.patchValue({
        refundQuantity: 1,
        reason: '',
        proof: null,
        proofPreview: null
      });
      item.get('refundQuantity')?.updateValueAndValidity();
      item.get('reason')?.updateValueAndValidity();
    } else {
      // Set validators before patching value
      item.get('refundQuantity')?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(item.value.remainingQty)
      ]);
      item.get('reason')?.setValidators([Validators.required]);
      item.patchValue({
        refundQuantity: 1
      });
      item.get('refundQuantity')?.markAsTouched();
      item.get('reason')?.markAsTouched();
      item.get('reason')?.markAsDirty();
      item.get('refundQuantity')?.updateValueAndValidity();
      item.get('reason')?.updateValueAndValidity();
      // Debug log for reason and refundQuantity fields
      console.log('reason value:', item.get('reason')?.value, 'valid:', item.get('reason')?.valid);
      console.log('refundQuantity value:', item.get('refundQuantity')?.value, 'valid:', item.get('refundQuantity')?.valid);
    }
    this.refundForm.updateValueAndValidity();
  }

  onProofChange(event: any, i?: number) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        this.error = 'Please upload only image files.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.error = 'Image size should not exceed 5MB.';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (i === undefined) {
          this.refundForm.patchValue({ 
            proof: file,
            proofPreview: e.target.result 
          });
        } else {
          this.items.at(i).patchValue({ 
            proof: file,
            proofPreview: e.target.result 
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeProof(i?: number) {
    if (i === undefined) {
      this.refundForm.patchValue({ 
        proof: null,
        proofPreview: null 
      });
    } else {
      this.items.at(i).patchValue({ 
        proof: null,
        proofPreview: null 
      });
    }
  }

  isFormValid(): boolean {
    if (this.refundType === 'whole') {
      return this.refundForm.get('reason')?.valid ?? false;
    } else if (this.refundType === 'partial') {
      const selectedItems = this.items.controls.filter(item => item.get('selected')?.value);
      if (selectedItems.length === 0) return false;
      return selectedItems.every(item =>
        item.get('refundQuantity')?.valid &&
        item.get('reason')?.valid
      );
    }
    return false;
  }

  getSelectedItemsCount(): number {
    return this.items.controls.filter(item => item.get('selected')?.value).length;
  }

  getTotalRefundAmount(): number {
    return this.itemFormGroups
      .filter(item => item.get('selected')?.value)
      .map(item => {
        const value = item.value;
        return value.actualRefundableAmount != null
          ? (value.actualRefundableAmount / value.quantity) * (item.get('refundQuantity')?.value || 1)
          : 0;
      })
      .reduce((sum, val) => sum + val, 0);
  }

  submitRefund() {
    // Log validity of all items before submitting
    this.items.controls.forEach((item, idx) => {
      console.log(`Item ${idx} - selected:`, item.get('selected')?.value, 'reason valid:', item.get('reason')?.valid, 'refundQuantity valid:', item.get('refundQuantity')?.valid);
    });
    console.log('submitRefund called', this.refundForm.valid, this.submitting, this.refundType);
    if (this.refundForm.invalid || this.submitting) return;
    
    this.submitting = true;
    this.error = null;
    const formData = new FormData();
    
    // Add order ID and refund type
    const refundData: RefundRequestDTO = {
      orderId: this.order.id,
      type: this.refundType === 'whole' ? 'FULL' : 'PARTIAL',
      reason: this.refundType === 'whole' ? this.refundForm.get('reason')?.value : undefined,
      items: this.refundType === 'partial' ? this.items.controls
        .filter(item => item.get('selected')?.value)
        .map(item => ({
          orderDetailId: item.get('orderDetailId')?.value,
          quantity: item.get('refundQuantity')?.value,
          reason: item.get('reason')?.value
        })) : undefined
    };

    formData.append('data', JSON.stringify(refundData));

    // Add proof files
    if (this.refundType === 'whole' && this.refundForm.get('proof')?.value) {
      formData.append('proof', this.refundForm.get('proof')?.value);
    } else if (this.refundType === 'partial') {
      const selectedItems = this.items.controls.filter(item => item.get('selected')?.value);
      selectedItems.forEach((item, index) => {
        if (item.get('proof')?.value) {
          formData.append('proofs', item.get('proof')?.value);
        } else {
          // Always append something to keep the order
          formData.append('proofs', new Blob([]));
        }
      });
      // Debug log for partial refund
      console.log('Submitting partial refund:', refundData, formData.getAll('proofs'));
    }

    this.refundService.submitRefundRequest(formData).subscribe({
      next: () => {
        this.error = null;
        this.submitting = false;
        alert('Refund request submitted successfully');
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to submit refund request';
        this.submitting = false;
      }
    });
  }

  onReasonInput(i: number) {
    const item = this.items.at(i);
    console.log('reason input:', item.get('reason')?.value, 'valid:', item.get('reason')?.valid, 'refundQuantity:', item.get('refundQuantity')?.value, 'valid:', item.get('refundQuantity')?.valid);
  }
}
