import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Terms, TermsService } from '../terms.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-terms',
  standalone: false,
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent implements OnInit {
  termsForm!: FormGroup;
  allTerms: Terms[] = [];
  editingId: number | null = null;
  expandedTerms: Set<number> = new Set();

  constructor(private termsService: TermsService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.termsForm = this.fb.group({
      title: [''],
      content: [''],
      active: [true]
    });

    this.loadTerms();
  }

  loadTerms() {
    this.termsService.getAllTerms().subscribe(data => {
      this.allTerms = data;
      this.expandedTerms.clear();
    });
  }

  saveTerm() {
    const title = this.termsForm.value.title?.trim();
    const content = this.termsForm.value.content?.trim();

    // Basic validation
    if (!title || !content) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all fields (title and content) before saving.',
        confirmButtonColor: '#222'
      });
      return;
    }

    // Check for duplicate title
    const isDuplicateTitle = this.allTerms.some(t => 
      t.title.trim().toLowerCase() === title.toLowerCase() &&
      (!this.editingId || t.id !== this.editingId)
    );

    if (isDuplicateTitle) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'A term with this title already exists. Please use a unique title.',
        confirmButtonColor: '#222'
      });
      return;
    }

    const payload = {
      title,
      content,
      active: this.termsForm.value.active
    };

    if (this.editingId) {
      // Update
      this.termsService.updateTerms(this.editingId, payload).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Term updated successfully!',
          confirmButtonColor: '#222',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadTerms();
      });
    } else {
      // Create
      this.termsService.createTerms(payload).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Term created successfully!',
          confirmButtonColor: '#222',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadTerms();
      });
    }
  }

  editTerm(term: Terms) {
    this.editingId = term.id!;
    this.termsForm.patchValue({
      title: term.title,
      content: term.content,
      active: term.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteTerm(id: number) {
    if (!id) return;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this term?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#222'
    }).then((result) => {
      if (result.isConfirmed) {
        this.termsService.deleteTerms(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Term has been deleted.',
            confirmButtonColor: '#222',
            timer: 2000,
            showConfirmButton: false
          });
          if (this.editingId === id) {
            this.resetForm();
          }
          this.loadTerms();
        });
      }
    });
  }

  cancelEdit() {
    this.resetForm();
  }

  resetForm() {
    this.termsForm.reset({ active: true });
    this.editingId = null;
  }

  toggleExpand(id: number, event: Event) {
    event.preventDefault();
    if (!id) return;
    if (this.expandedTerms.has(id)) {
      this.expandedTerms.delete(id);
    } else {
      this.expandedTerms.add(id);
    }
  }

  isExpanded(id: number): boolean {
    if (!id) return false;
    return this.expandedTerms.has(id);
  }
}
