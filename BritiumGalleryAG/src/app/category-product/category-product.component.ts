import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../category.service';
import { ProductResponse } from '../ProductResponse';
import { category, CategoryAttribute } from '../category';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-category-product',
  templateUrl: './category-product.component.html',
  styleUrls: ['./category-product.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule]
})
export class CategoryProductComponent implements OnInit {
  categoryId: number | null = null;
  currentCategory: category | null = null;
  subCategories: category[] = [];
  products: ProductResponse[] = [];
  availableAttributes: CategoryAttribute[] = [];
  selectedAttributeFilters: { [key: string]: string[] } = {};
  expandedFilters: { [key: string]: boolean } = {};
  breadcrumb: string[] = [];
  parentCategoryName: string = '';
  areAllFiltersHidden: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('categoryId');
      if (id && this.categoryId !== +id) {
        this.categoryId = +id;
        this.selectedAttributeFilters = {};
        this.expandedFilters = {};
        this.areAllFiltersHidden = true;
        this.loadCategoryDetails();
        this.loadProducts();
        this.loadAvailableAttributes();
        this.loadBreadcrumb();
      }
    });
  }

  loadCategoryDetails(): void {
    if (this.categoryId) {
      this.categoryService.getCategoryById(this.categoryId).subscribe(category => {
        this.currentCategory = category;
        
        // Always load direct subcategories of the current category
        if (this.categoryId) {
          this.categoryService.getSubCategories(this.categoryId).subscribe(subCats => {
            this.subCategories = subCats;
          });
        }

        // Handle parent category name for the 'Back to Parent' link
        if (category && category.parent_category_id) {
          this.categoryService.getCategoryById(category.parent_category_id).subscribe(parentCategory => {
            if (parentCategory) {
              this.parentCategoryName = parentCategory.name;
            }
          });
        } else {
          this.parentCategoryName = ''; // No parent category
        }
      });
    }
  }

  loadProducts(): void {
    if (this.categoryId) {
      this.productService.getFilteredProducts(this.categoryId, this.selectedAttributeFilters).subscribe(products => {
        this.products = products;
      });
    }
  }

  loadAvailableAttributes(): void {
    if (this.categoryId) {
      this.productService.getCategoryAttributeOptions(this.categoryId).subscribe(attributeOptions => {
        this.availableAttributes = Object.keys(attributeOptions).map(name => ({
          name: name,
          dataType: 'text',
          options: attributeOptions[name]
        }));
        this.availableAttributes.forEach(attr => {
          if (!(attr.name in this.selectedAttributeFilters)) {
            this.selectedAttributeFilters[attr.name] = [];
          }
          this.expandedFilters[attr.name] = !this.areAllFiltersHidden;
        });
      });
    }
  }

  loadBreadcrumb(): void {
    if (this.categoryId) {
      this.productService.getProductBreadcrumb(this.categoryId).subscribe(breadcrumb => {
        this.breadcrumb = breadcrumb;
      });
    }
  }

  getParentCategoryName(): string {
    return this.parentCategoryName;
  }

  toggleFilterExpansion(filterName: string): void {
    this.expandedFilters[filterName] = !this.expandedFilters[filterName];
  }

  isFilterExpanded(filterName: string): boolean {
    return this.expandedFilters[filterName] || false;
  }

  toggleAttributeFilter(attributeName: string, option: string): void {
    const currentFilters = this.selectedAttributeFilters[attributeName];
    if (currentFilters.includes(option)) {
      this.selectedAttributeFilters[attributeName] = currentFilters.filter(item => item !== option);
    } else {
      this.selectedAttributeFilters[attributeName].push(option);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    this.loadProducts();
    console.log('Applying filters:', this.selectedAttributeFilters);
  }

  toggleAllFilters(): void {
    this.areAllFiltersHidden = !this.areAllFiltersHidden;
    this.availableAttributes.forEach(attr => {
      this.expandedFilters[attr.name] = !this.areAllFiltersHidden;
    });
  }

  navigateToCategory(id: number): void {
    this.router.navigate(['/category-products', id]);
  }

  getPriceRange(product: ProductResponse): string {
    if (!product.variants || product.variants.length === 0) {
      return 'N/A';
    }
    const prices = product.variants.map(variant => variant.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `${minPrice} MMK`;
    } else {
      return `${minPrice} - ${maxPrice} MMK`;
    }
  }
} 