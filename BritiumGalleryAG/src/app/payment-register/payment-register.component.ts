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
  loggedInAdminId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Retrieve the logged-in admin's ID
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    this.loggedInAdminId = user?.id ?? null;

    if (!this.loggedInAdminId) {
      alert('No logged-in admin found.');
      this.router.navigate(['/login']);
      return;
    }

    this.paymentForm = this.fb.group({
      name: ['', Validators.required],
      admin_id: [
        this.loggedInAdminId,
        [Validators.required, Validators.min(1)],
      ], // pre-fill and hide this in HTML
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
            admin_id: this.loggedInAdminId, // keep admin_id from localStorage
          });
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
    }
  }

  submit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (!this.isEdit && this.selectedFiles.length === 0) {
      this.fileError = 'Please select at least one QR image.';
      return;
    }

    const name = this.paymentForm.get('name')?.value;
    const admin_id = this.loggedInAdminId; // use admin_id from login session

    if (this.isEdit && this.id) {
      if (this.selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('admin_id', admin_id!.toString());
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
        const payload = { name, admin_id };
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
      const formData = new FormData();
      formData.append('name', name);
      formData.append('admin_id', admin_id!.toString());
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
