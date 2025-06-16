import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { category } from '../category';

@Component({
  selector: 'app-category-edit',
  standalone: false,
  templateUrl: './category-edit.component.html',
  styleUrls: ['./category-edit.component.css'],
})
export class CategoryEditComponent implements OnInit {
  categoryId?: number;
  category: category = {
    id:0,
    name: '',
    parent_category_id: 0,
    attributes: [],
  };

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.categoryId = +idParam;
      this.categoryService.getCategoryById(this.categoryId).subscribe({
        next: (data) => {
          this.category = data;
        },
        error: (err) => console.error('Failed to load category', err),
      });
    }
  }

  addAttribute(): void {
    this.category.attributes?.push({ name: '', dataType: 'STRING' });
  }

  removeAttribute(index: number): void {
    this.category.attributes?.splice(index, 1);
  }

  save(): void {
    if (this.categoryId) {
      this.categoryService.updateCategory(this.category).subscribe({
        next: () => this.router.navigate(['/categoryList']),
        error: (err) => console.error('Update error:', err),
      });
    }
  }
}
