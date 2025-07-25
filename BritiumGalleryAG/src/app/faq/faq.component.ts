import { Component, OnInit } from '@angular/core';
import { Faq, FAQService } from '../faq.service';
import { AuthService } from '../AuthService';
import Swal from 'sweetalert2';
 // 🔸 import

@Component({
  selector: 'app-faq',
  standalone: false,
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FAQComponent implements OnInit {
  faqs: Faq[] = [];
 faq: Faq = { question: '', answer: '', category: '', createdById: 0 };

  constructor(
    private faqService: FAQService,
    private authService: AuthService // 🔸 inject
  ) {}

  ngOnInit(): void {
    this.loadFaqs();
    this.resetForm();
  }

  loadFaqs(): void {
    this.faqService.getFaqs().subscribe(data => this.faqs = data);
  }

 saveFaq(): void {
  const loggedInId = this.authService.getLoggedInUserId();
  if (!loggedInId) {
    Swal.fire({
      icon: 'warning',
      title: 'Login Required',
      text: 'You must be logged in to create or update FAQs.',
      confirmButtonColor: '#222'
    });
    return;
  }

  // Trim inputs and validate
  if (!this.faq.question.trim() || !this.faq.answer.trim() || !this.faq.category.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please fill in all fields (question, answer, category) before saving.',
      confirmButtonColor: '#222'
    });
    return;
  }

  this.faq.createdById = loggedInId;

  if (this.faq.id) {
   // Update FAQ (PUT)
this.faqService.updateFaq(this.faq.id, this.faq).subscribe(() => {
  this.loadFaqs();
  this.resetForm();
  Swal.fire({
    icon: 'success',
    title: 'FAQ Updated',
    text: 'The FAQ has been updated successfully.',
    timer: 2000,
    showConfirmButton: false
  });
});

  } else {
    // Create FAQ (POST)
this.faqService.createFaq(this.faq).subscribe(() => {
  this.loadFaqs();
  this.resetForm();
  Swal.fire({
    icon: 'success',
    title: 'FAQ Created',
    text: 'The FAQ was added successfully.',
    timer: 2000,
    showConfirmButton: false
  });
});

  }
}

  editFaq(f: Faq): void {
    this.faq = { ...f };
  }

 deleteFaq(id?: number): void {
  if (!id) return;

  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this faq post?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#aaa',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.faqService.deleteFaq(id).subscribe(() => {
        this.loadFaqs();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The FAQ has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
      });
    }
  });
}


  resetForm(): void {
  const loggedInId = this.authService.getLoggedInUserId();
  this.faq = { question: '', answer: '', category: '', createdById: loggedInId ?? 0 };
}

}
