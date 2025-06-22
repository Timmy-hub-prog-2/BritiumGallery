import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-payment-register',
  standalone: false,
  templateUrl: './payment-register.component.html',
  styleUrls: ['./payment-register.component.css'],
})
export class PaymentRegisterComponent implements OnInit {
  paymentForm!: FormGroup;
  id?: number;
  isEdit = false;
  selectedFiles: File[] = [];
  fileError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      admin_id: ['', [Validators.required, Validators.min(1)]],
    });

    this.route.params.subscribe((params) => {
      this.id = +params['id'];
      if (this.id) {
        this.isEdit = true;
        this.loadPayment(this.id);
      }
    });
  }

  loadPayment(id: number) {
    this.http
      .get<any>(`http://localhost:8080/payment-register/${id}`)
      .subscribe({
        next: (data) => {
          this.paymentForm.patchValue({
            name: data.name,
            admin_id: data.admin_id,
          });
          // You can optionally show existing QR images here
        },
        error: (err) => {
          console.error('Failed to load payment:', err);
        },
      });
  }

  onFileChange(event: Event) {
    this.fileError = null;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
      console.log(
        'Files selected:',
        this.selectedFiles.map((f) => f.name)
      );
    } else {
      this.selectedFiles = [];
      this.fileError = 'Please select at least one QR image.';
      console.log('No files selected');
    }
  }

  submit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    // Validate file selection on create
    if (!this.isEdit && this.selectedFiles.length === 0) {
      this.fileError = 'Please select at least one QR image.';
      return;
    }

    if (this.isEdit && this.id) {
      if (this.selectedFiles.length > 0) {
        // Edit mode WITH new images - send multipart/form-data to PUT upload endpoint
        const formData = new FormData();
        formData.append('name', this.paymentForm.get('name')?.value);
        formData.append(
          'admin_id',
          this.paymentForm.get('admin_id')?.value.toString()
        );

        this.selectedFiles.forEach((file) => {
          formData.append('qrPhotos', file, file.name);
        });

        this.http
          .put(
            `http://localhost:8080/payment-register/${this.id}/upload`,
            formData
          )
          .subscribe({
            next: () => this.router.navigate(['/payment-list']),
            error: (err) => {
              console.error('Update with upload failed:', err);
              this.fileError = 'Update failed. Please try again.';
            },
          });
      } else {
        // Edit mode WITHOUT new images - send JSON PUT
        const payload = {
          name: this.paymentForm.get('name')?.value,
          admin_id: +this.paymentForm.get('admin_id')?.value,
        };

        this.http
          .put(`http://localhost:8080/payment-register/${this.id}`, payload)
          .subscribe({
            next: () => this.router.navigate(['/payment-list']),
            error: (err) => {
              console.error('Update failed:', err);
            },
          });
      }
    } else {
      // Create mode with file upload (multipart/form-data)
      const formData = new FormData();
      formData.append('name', this.paymentForm.get('name')?.value);
      formData.append(
        'admin_id',
        this.paymentForm.get('admin_id')?.value.toString()
      );

      this.selectedFiles.forEach((file) => {
        formData.append('qrPhotos', file, file.name);
      });

      this.http
        .post(`http://localhost:8080/payment-register/upload`, formData)
        .subscribe({
          next: () => this.router.navigate(['/payment-list']),
          error: (err) => {
            console.error('Upload failed:', err);
            this.fileError = 'Upload failed. Please try again.';
          },
        });
    }
  }

  cancel() {
    this.router.navigate(['/payment-list']);
  }
}
