import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Editor, Toolbar } from 'ngx-editor';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface Policy {
  id?: number;
  content: string;
  active: boolean;
}

@Component({
  selector: 'app-privacypolicy',
  standalone:false,
  templateUrl: './privacypolicy.component.html',
  styleUrls: ['./privacypolicy.component.css']
})
export class PrivacypolicyComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  policyId: number | null = null;
  allPolicies: Policy[] = [];
  expandedPolicies: Set<number> = new Set();

  private BASE_URL = 'http://localhost:8080/api/privacy-policy';

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.editor = new Editor();
    this.form = this.fb.group({
      content: new FormControl(''),
      active: [true]
    });
    this.fetchPolicies();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  fetchPolicies(): void {
    this.http.get<Policy[]>(this.BASE_URL).subscribe(data => {
      this.allPolicies = data;
      this.expandedPolicies.clear();
    });
  }

  savePolicy(): void {
    const content = this.form.value.content?.trim();
    if (!content) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in the content before saving.',
        confirmButtonColor: '#222'
      });
      return;
    }

    const payload: Policy = {
      content,
      active: this.form.value.active
    };

    if (this.policyId) {
      // Update
      this.http.put(`${this.BASE_URL}/${this.policyId}`, payload).subscribe(() => {
        Swal.fire({
          icon: 'success',
          text: 'Policy updated successfully!',
          confirmButtonColor: '#222',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.fetchPolicies();
      });
    } else {
      // Create
      this.http.post(this.BASE_URL, payload).subscribe(() => {
        Swal.fire({
          icon: 'success',
          text: 'Policy created successfully!',
          confirmButtonColor: '#222',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.fetchPolicies();
      });
    }
  }

  editPolicy(policy: Policy): void {
    this.policyId = policy.id || null;
    this.form.patchValue({
      content: policy.content,
      active: policy.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePolicy(id: number): void {
    if (!id) return;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this policy?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#222'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.BASE_URL}/${id}`).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Policy has been deleted.',
            confirmButtonColor: '#222',
            timer: 2000,
            showConfirmButton: false
          });
          if (this.policyId === id) {
            this.resetForm();
          }
          this.fetchPolicies();
        });
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.form.reset({ content: '', active: true });
    this.policyId = null;
  }

  toggleExpand(id: number, event: Event): void {
    event.preventDefault();
    if (!id) return;
    if (this.expandedPolicies.has(id)) {
      this.expandedPolicies.delete(id);
    } else {
      this.expandedPolicies.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedPolicies.has(id);
  }

  get contentControl(): FormControl {
    return this.form.get('content') as FormControl;
  }
}
