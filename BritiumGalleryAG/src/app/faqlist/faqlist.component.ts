import { Component, OnInit } from '@angular/core';
import { Faq, FAQService } from '../faq.service';

@Component({
  selector: 'app-faqlist',
  standalone: false,
  templateUrl: './faqlist.component.html',
  styleUrl: './faqlist.component.css'
})
export class FAQListComponent implements OnInit {
  faqs: Faq[] = [];
  expandedFaqIds: Set<number> = new Set();
   groupedFaqs: { [category: string]: Faq[] } = {};
  filteredFaqs: Faq[] = [];
  searchQuery: string = '';
  objectKeys = Object.keys;


  constructor(private faqService: FAQService) {}

  ngOnInit(): void {
    this.faqService.getFaqs().subscribe(data => {
      this.faqs = data;
       this.filteredFaqs = data;
        this.groupByCategory(this.faqs);
    });
  }

    groupByCategory(faqs: Faq[]) {
    this.groupedFaqs = {};
    faqs.forEach(faq => {
      const cat = faq.category || 'Other';
      if (!this.groupedFaqs[cat]) {
        this.groupedFaqs[cat] = [];
      }
      this.groupedFaqs[cat].push(faq);
    });
  }

  toggleAnswer(id: number): void {
    if (this.expandedFaqIds.has(id)) {
      this.expandedFaqIds.delete(id);
    } else {
      this.expandedFaqIds.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedFaqIds.has(id);
  }

  
  onSearchChange(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredFaqs = this.faqs.filter(f =>
      f.question.toLowerCase().includes(query) ||
      f.answer.toLowerCase().includes(query)
    );
    
  }

}
