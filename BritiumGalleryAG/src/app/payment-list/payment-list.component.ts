import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface Payment {
  id: number;
  name: string;
  admin_id: number;
  qrPhotoUrls: string[];
}

@Component({
  selector: 'app-payment-list',
  standalone: false,
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css'],
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];

  modalVisible = false;
  editingPayment: Payment | null = null;
  paymentForm!: FormGroup;
  selectedFiles: File[] = [];
  fileError: string | null = null;

  loggedInAdminId: number | null = null;

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit() {
    this.loadPayments();
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    this.loggedInAdminId = user?.id ?? null;

    this.initForm();
  }

  initForm() {
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      // no need for admin_id here, we'll add it on submit from loggedInAdminId
    });
  }

  openModal(payment?: Payment) {
    this.fileError = null;
    this.selectedFiles = [];

    if (payment) {
      this.editingPayment = payment;
      this.paymentForm.patchValue({ name: payment.name });
    } else {
      this.editingPayment = null;
      this.paymentForm.reset();
    }

    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
    this.paymentForm.reset();
    this.editingPayment = null;
    this.selectedFiles = [];
    this.fileError = null;
  }

  onFileChange(event: Event) {
    this.fileError = null;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
    } else {
      this.selectedFiles = [];
      this.fileError = 'Please select at least one QR image.';
    }
  }

  submit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (!this.editingPayment && this.selectedFiles.length === 0) {
      this.fileError = 'Please select at least one QR image.';
      return;
    }

    const name = this.paymentForm.get('name')?.value;
    const admin_id = this.loggedInAdminId;

    if (!admin_id) {
      alert('No logged in admin found.');
      return;
    }

    if (this.editingPayment) {
      // Edit mode
      if (this.selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('admin_id', admin_id.toString());
        this.selectedFiles.forEach((file) =>
          formData.append('qrPhotos', file, file.name)
        );

        this.http
          .put(
            `http://localhost:8080/payment-register/${this.editingPayment.id}/upload`,
            formData
          )
          .subscribe({
            next: () => {
              this.loadPayments();
              this.closeModal();
            },
            error: (err) => {
              console.error(err);
              this.fileError = 'Update failed. Please try again.';
            },
          });
      } else {
        const payload = { name, admin_id };
        this.http
          .put(
            `http://localhost:8080/payment-register/${this.editingPayment.id}`,
            payload
          )
          .subscribe({
            next: () => {
              this.loadPayments();
              this.closeModal();
            },
            error: (err) => {
              console.error(err);
              this.fileError = 'Update failed. Please try again.';
            },
          });
      }
    } else {
      // Create mode
      const formData = new FormData();
      formData.append('name', name);
      formData.append('admin_id', admin_id.toString());
      this.selectedFiles.forEach((file) =>
        formData.append('qrPhotos', file, file.name)
      );

      this.http
        .post('http://localhost:8080/payment-register/upload', formData)
        .subscribe({
          next: () => {
            this.loadPayments();
            this.closeModal();
          },
          error: (err) => {
            console.error(err);
            this.fileError = 'Upload failed. Please try again.';
          },
        });
    }
  }

  loadPayments() {
    this.http
      .get<Payment[]>('http://localhost:8080/payment-register')
      .subscribe({
        next: (data) => (this.payments = data),
        error: (err) => console.error(err),
      });
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.http
        .delete(`http://localhost:8080/payment-register/${id}`)
        .subscribe({
          next: () => this.loadPayments(),
          error: (err) => console.error(err),
        });
    }
  }
}
