import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Terms, TermsService } from '../terms.service';

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
  expandedTerms: Set<number> = new Set(); // Track expanded rows

  constructor(private termsService: TermsService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.termsForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      active: [true]
    });

    this.loadTerms();
  }

  loadTerms() {
    this.termsService.getAllTerms().subscribe(data => {
      this.allTerms = data;
      this.expandedTerms.clear(); // Reset expansion on reload
    });
  }

  saveTerm() {
    const term = this.termsForm.value;
    if (this.editingId) {
      this.termsService.updateTerms(this.editingId, term).subscribe(() => {
        this.loadTerms();
        this.termsForm.reset({ active: true });
        this.editingId = null;
      });
    } else {
      this.termsService.createTerms(term).subscribe(() => {
        this.loadTerms();
        this.termsForm.reset({ active: true });
      });
    }
  }

  editTerm(term: Terms) {
    this.editingId = term.id!;
    this.termsForm.patchValue(term);
  }

  deleteTerm(id: number) {
    if (confirm('Are you sure you want to delete this terms record?')) {
      this.termsService.deleteTerms(id).subscribe(() => this.loadTerms());
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.termsForm.reset({ active: true });
  }

  toggleExpand(id: number, event: Event) {
    event.preventDefault();
    if (this.expandedTerms.has(id)) {
      this.expandedTerms.delete(id);
    } else {
      this.expandedTerms.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedTerms.has(id);
  }
}
