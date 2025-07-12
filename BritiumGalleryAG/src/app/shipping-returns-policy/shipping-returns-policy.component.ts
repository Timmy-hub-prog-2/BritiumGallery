import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

interface Policy {
  id?: number;
  title: string;
  content: string;
  displayOrder: number;
}

@Component({
  selector: 'app-shipping-returns-policy',
  standalone: false,
  templateUrl: './shipping-returns-policy.component.html',
  styleUrls: ['./shipping-returns-policy.component.css']
})
export class ShippingReturnsPolicyComponent implements OnInit {

  policies: Policy[] = [];

  // Shared form object for both create/edit
  formPolicy: Policy = { title: '', content: '', displayOrder: 0 };
  editingPolicy: Policy | null = null;

  // ✅ Make sure to use full backend base URL
  private BASE_URL = 'http://localhost:8080/api/policy';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPolicies();
  }

  loadPolicies() {
    this.http.get<Policy[]>(this.BASE_URL).subscribe(data => {
      this.policies = data;
    });
  }

  savePolicy() {
    if (this.editingPolicy) {
      // PUT (Update)
      this.http.put(`${this.BASE_URL}/${this.editingPolicy.id}`, this.formPolicy).subscribe(() => {
        this.editingPolicy = null;
        this.resetForm();
        this.loadPolicies();
      });
    } else {
      // POST (Create)
      this.http.post(this.BASE_URL, this.formPolicy).subscribe(() => {
        this.resetForm();
        this.loadPolicies();
      });
    }
  }

  editPolicy(policy: Policy) {
    this.editingPolicy = policy;
    this.formPolicy = { ...policy }; // Clone to avoid mutating directly
  }

  deletePolicy(id: number) {
    if (confirm('Are you sure you want to delete this policy section?')) {
      this.http.delete(`${this.BASE_URL}/${id}`).subscribe(() => this.loadPolicies());
    }
  }

  cancelEdit() {
    this.editingPolicy = null;
    this.resetForm();
  }

  resetForm() {
    this.formPolicy = { title: '', content: '', displayOrder: 0 };
  }
}
