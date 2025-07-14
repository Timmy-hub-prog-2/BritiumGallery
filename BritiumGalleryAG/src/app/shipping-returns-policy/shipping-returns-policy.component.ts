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
    const title = this.formPolicy.title?.trim();
    const content = this.formPolicy.content?.trim();
    const displayOrder = this.formPolicy.displayOrder;

    // 1️⃣ Basic validation
    if (!title || !content || displayOrder === null || displayOrder === undefined) {
      alert('Please fill in all fields (title, content, display order) before saving.');
      return;
    }

    // 2️⃣ Prevent negative displayOrder
    if (displayOrder < 0) {
      alert('Display order must be a non-negative number.');
      return;
    }

    // 3️⃣ Check for duplicate title (excluding current editing record)
    const isDuplicateTitle = this.policies.some(p => 
      p.title.trim().toLowerCase() === title.toLowerCase() &&
      (!this.editingPolicy || p.id !== this.editingPolicy.id)
    );

    if (isDuplicateTitle) {
      alert('A policy with this title already exists. Please use a unique title.');
      return;
    }

    const payload: Policy = { title, content, displayOrder };

    if (this.editingPolicy) {
      // PUT (Update)
      this.http.put(`${this.BASE_URL}/${this.editingPolicy.id}`, payload).subscribe(() => {
        alert('Policy updated successfully!');
        this.editingPolicy = null;
        this.resetForm();
        this.loadPolicies();
      });
    } else {
      // POST (Create)
      this.http.post(this.BASE_URL, payload).subscribe(() => {
        alert('Policy created successfully!');
        this.resetForm();
        this.loadPolicies();
      });
    }
  }

  editPolicy(policy: Policy) {
    this.editingPolicy = policy;
    this.formPolicy = { ...policy }; // Clone to avoid direct mutation
  }

  deletePolicy(id: number) {
    if (confirm('Are you sure you want to delete this policy section?')) {
      this.http.delete(`${this.BASE_URL}/${id}`).subscribe(() => {
        alert('Policy deleted.');
        this.loadPolicies();
      });
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
