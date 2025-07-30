import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';
import { Payment, PaymentService } from '../payment.service';
import { FileUploadService } from '../services/file-upload.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  order: any = null;
  orderId: number | null = null;
  currentUser: User | null = null;
  payments: Payment[] = [];
  selectedQrUrl: string = '';
  selectedReceiptFile: File | null = null;
  receiptPreviewUrl = '';
  showReceiptPreview = false;
  loading: boolean = false;
  error: string = '';
  showAllOrderItems: boolean = false;
  showAddressModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private userService: UserService,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute,
    private fileUploadService: FileUploadService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPayments();
    this.initForm();
    this.loadOrder();
  }

  loadCurrentUser(): void {
    this.currentUser = this.userService.userValue;
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  loadPayments(): void {
    this.paymentService.getAll().subscribe({
      next: (payments: Payment[]) => {
        this.payments = payments;
        this.error = '';
      },
      error: (err: any) => {
        this.error = 'Failed to load payment methods. Please refresh the page.';
      }
    });
  }

  initForm(): void {
    this.paymentForm = this.fb.group({
      paymentType: ['', Validators.required],
      cardNumber: [''],
      expiry: [''],
      cvv: ['']
    });

    // Watch for payment type changes
    this.paymentForm.get('paymentType')?.valueChanges.subscribe(value => {
      console.log('Payment type changed to:', value);
      if (value && value !== 'CreditCard') {
        this.selectedQrUrl = this.getQRCodeUrl(value);
        console.log('Selected QR URL:', this.selectedQrUrl);
      } else {
        this.selectedQrUrl = '';
      }
    });
  }

  loadOrder(): void {
    this.route.params.subscribe(params => {
      this.orderId = +params['orderId'];
      if (this.orderId) {
        this.fetchOrder();
      }
    });
  }

  fetchOrder(): void {
    if (!this.orderId) return;
    this.loading = true;
    this.error = '';
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load order details.';
      }
    });
  }

  getQRCodeUrl(paymentType: string): string {
    const payment = this.payments.find(p => p.name === paymentType);
    if (payment && payment.qrPhotoUrls && payment.qrPhotoUrls.length > 0) {
      return payment.qrPhotoUrls[0];
    }
    return '';
  }

  getTotalAmount(): number {
    if (!this.order) return 0;
    return (this.order.total || 0);
  }

  getOrderItemsCount(): number {
    if (!this.order || !this.order.orderDetails) return 0;
    return this.order.orderDetails.reduce((sum: number, item: any) => sum + item.quantity, 0);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('receiptFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onReceiptFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedReceiptFile = file;
      this.createReceiptPreview(file);
    }
  }

  createReceiptPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.receiptPreviewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeReceiptFile(event: Event): void {
    event.stopPropagation();
    this.selectedReceiptFile = null;
    this.receiptPreviewUrl = '';
  }

  showReceiptPreviewModal(): void {
    this.showReceiptPreview = true;
  }

  closeReceiptPreview(): void {
    this.showReceiptPreview = false;
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.error = 'Please fill in all required fields.';
      return;
    }

    const paymentType = this.paymentForm.get('paymentType')?.value;
    const amount = this.getTotalAmount();
    const notes = '';
    const reviewerUserId = undefined;

    if (paymentType !== 'CreditCard' && !this.selectedReceiptFile) {
      this.error = 'Please upload a payment receipt.';
      return;
    }

    this.loading = true;
    this.error = '';

    if (paymentType === 'CreditCard') {
      // Process credit card payment immediately
      const paymentRequest: any = {
        orderId: this.orderId,
        paymentMethod: paymentType,
        cardNumber: this.paymentForm.get('cardNumber')?.value,
        expiry: this.paymentForm.get('expiry')?.value,
        cvv: this.paymentForm.get('cvv')?.value
      };
      this.processPaymentRequest(paymentRequest);
    } else {
      // For QR code payments, upload the receipt first
      this.fileUploadService.uploadReceipt(this.selectedReceiptFile!).subscribe({
        next: (imageUrl) => {
          // Call the new endpoint to mark order as paid and create transaction
          this.orderService.markOrderPaidAndCreateTransaction(this.orderId!, {
            paymentMethod: paymentType,
            amount: amount,
            proofImageUrl: imageUrl,
            reviewerUserId: reviewerUserId,
            notes: notes
          }).subscribe({
            next: () => {
              this.loading = false;
              Swal.fire({
                icon: 'success',
                title: 'Payment Submitted',
                text: 'Your transaction is pending verification.',
                confirmButtonText: 'OK'
              }).then(() => {
                this.router.navigate(['/customer-order-detail', this.orderId]);
              });
            },
            error: (err) => {
              this.loading = false;
              this.error = err.error?.message || 'Failed to submit payment. Please try again.';
            }
          });
        },
        error: (err) => {
          this.loading = false;
          console.error('File upload error:', err);
          this.error = 'Failed to upload receipt. Please try again.';
        }
      });
    }
  }

  private processPaymentRequest(paymentRequest: any): void {
    console.log('Processing payment:', paymentRequest);

    this.orderService.processPayment(paymentRequest).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Payment response:', response);

        if (response.success) {
          if (response.paymentStatus === 'PAID') {
            Swal.fire({
              icon: 'success',
              title: 'Payment Completed!',
              text: 'Your order has been confirmed.',
              confirmButtonText: 'OK'
            }).then(() => {
              this.router.navigate(['/customer-order-detail', this.orderId]);
            });
          } else if (response.paymentStatus === 'PENDING_VERIFICATION') {
            Swal.fire({
              icon: 'info',
              title: 'Receipt Uploaded',
              text: 'Your order will be processed after admin verification.',
              confirmButtonText: 'OK'
            }).then(() => {
              this.router.navigate(['/customer-order-detail', this.orderId]);
            });
          } else {
            Swal.fire({
              icon: 'info',
              title: `Payment processed: ${response.message}`,
              confirmButtonText: 'OK'
            }).then(() => {
              this.router.navigate(['/customer-order-detail', this.orderId]);
            });
          }
        } else {
          this.error = response.message || 'Payment failed. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Payment error:', err);
        this.error = err.error?.message || 'Payment processing failed. Please try again.';
      }
    });
  }

  isFormValid(): boolean {
    const paymentType = this.paymentForm.get('paymentType')?.value;

    if (!paymentType) return false;

    if (paymentType === 'CreditCard') {
      return this.paymentForm.get('cardNumber')?.value &&
        this.paymentForm.get('expiry')?.value &&
        this.paymentForm.get('cvv')?.value;
    } else {
      return !!this.selectedReceiptFile;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onQRCodeError(event: any): void {
    console.error('QR code failed to load:', event);
    // Set empty URL to show placeholder
    this.selectedQrUrl = '';
  }
}