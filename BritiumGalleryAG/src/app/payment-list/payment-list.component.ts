import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

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
  selectedFile: File | null = null;
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
    this.selectedFile = null;

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
    this.selectedFile = null;
    this.fileError = null;
  }

  onFileChange(event: Event) {
    this.fileError = null;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
      this.fileError = 'Please select a QR image.';
    }
  }

  // File preview functionality
  getFilePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile() {
    this.selectedFile = null;
  }

  triggerFileInput() {
    const fileInput = document.getElementById('qrPhoto') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onPreviewError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const container = img.parentElement;
    if (container) {
      container.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: #f8f9fa; 
          color: #6c757d; 
          font-size: 12px;
          border-radius: 6px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
          </svg>
        </div>
      `;
    }
  }

  // Image error handling methods
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrapper = img.parentElement;
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          background: #f8f9fa; 
          color: #6c757d; 
          font-size: 12px;
          border-radius: 4px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
          </svg>
        </div>
      `;
    }
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'block';
  }

  submit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (!this.editingPayment && !this.selectedFile) {
      this.fileError = 'Please select a QR image.';
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
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('admin_id', admin_id.toString());
        formData.append('qrPhotos', this.selectedFile, this.selectedFile.name);

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
      formData.append('qrPhotos', this.selectedFile!, this.selectedFile!.name);

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
  Swal.fire({
    title: 'Are you sure?',
    text: 'This payment will be permanently deleted.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {
    if (result.isConfirmed) {
      this.http.delete(`http://localhost:8080/payment-register/${id}`).subscribe({
        next: () => {
          this.loadPayments();
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Payment was deleted successfully.',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Failed to delete payment.', 'error');
        },
      });
    }
  });
}
}