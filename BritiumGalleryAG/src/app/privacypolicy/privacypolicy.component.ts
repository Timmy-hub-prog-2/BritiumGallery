import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-privacypolicy',
  standalone: false,
  templateUrl: './privacypolicy.component.html',
  styleUrls: ['./privacypolicy.component.css']
})
export class PrivacypolicyComponent implements OnInit {
  form!: FormGroup;
  policyId: number | null = null;
  allPolicies: any[] = [];
  expandedPolicies: Set<number> = new Set(); // ✅ Expansion tracker

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      content: [''],
      active: [true]
    });
    this.fetchPolicies();
  }

  fetchPolicies(): void {
    this.http.get<any[]>('http://localhost:8080/api/privacy-policy').subscribe(data => {
      this.allPolicies = data;
      this.expandedPolicies.clear(); // ✅ Reset on reload
    });
  }

  savePolicy(): void {
    const payload = {
      content: this.form.value.content,
      active: this.form.value.active
    };

    if (this.policyId) {
      this.http.put<any>(`http://localhost:8080/api/privacy-policy/${this.policyId}`, payload)
        .subscribe(() => {
          alert('Policy updated!');
          this.resetForm();
          this.fetchPolicies();
        });
    } else {
      this.http.post<any>('http://localhost:8080/api/privacy-policy', payload)
        .subscribe(() => {
          alert('Policy created!');
          this.resetForm();
          this.fetchPolicies();
        });
    }
  }

  resetForm(): void {
    this.form.reset();
    this.policyId = null;
  }

  editPolicy(policy: any): void {
    this.policyId = policy.id;
    this.form.patchValue({
      content: policy.content,
      active: policy.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePolicy(id: number): void {
    if (confirm('Are you sure you want to delete this policy?')) {
      this.http.delete(`http://localhost:8080/api/privacy-policy/${id}`).subscribe(() => {
        alert('Policy deleted!');
        if (this.policyId === id) {
          this.form.reset();
          this.policyId = null;
        }
        this.fetchPolicies();
      });
    }
  }

  cancelEdit(): void {
    this.form.reset();
    this.policyId = null;
  }

  // ✅ Expand toggle logic
  toggleExpand(id: number, event: Event): void {
    event.preventDefault();
    if (this.expandedPolicies.has(id)) {
      this.expandedPolicies.delete(id);
    } else {
      this.expandedPolicies.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedPolicies.has(id);
  }
}
