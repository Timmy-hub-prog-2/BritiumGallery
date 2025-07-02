import { Component, OnInit } from '@angular/core';
import { Faq, FAQService } from '../faq.service';
import { AuthService } from '../AuthService';
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
      alert('You must be logged in to create or update FAQs.');
      return;
    }

    this.faq.createdById = loggedInId;

    if (this.faq.id) {
      this.faqService.updateFaq(this.faq.id, this.faq).subscribe(() => {
        this.loadFaqs();
        this.resetForm();
      });
    } else {
      this.faqService.createFaq(this.faq).subscribe(() => {
        this.loadFaqs();
        this.resetForm();
      });
    }
  }

  editFaq(f: Faq): void {
    this.faq = { ...f };
  }

  deleteFaq(id?: number): void {
    if (!id) return;
    this.faqService.deleteFaq(id).subscribe(() => this.loadFaqs());
  }

  resetForm(): void {
  const loggedInId = this.authService.getLoggedInUserId();
  this.faq = { question: '', answer: '', category: '', createdById: loggedInId ?? 0 };
}

}
