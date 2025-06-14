import { Component, OnInit, HostListener } from '@angular/core';
import { CategoryService } from '../category.service';
import { ProductService } from '../product.service';
import { category } from '../category';
import { ProductResponse } from '../ProductResponse';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

interface CategoryWithSubs extends category {
  subcategories?: CategoryWithSubs[];
  products?: ProductResponse[];
}

@Component({
  selector: 'app-navigation',
  standalone:false,
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  categories: CategoryWithSubs[] = [];
  activeCategory: CategoryWithSubs | null = null;
  activeSubcategory: CategoryWithSubs | null = null;
  activeSubSubcategory: CategoryWithSubs | null = null;
  isMegaMenuVisible = false;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getAllCategories().subscribe((categories: CategoryWithSubs[]) => {
      this.categories = categories.filter(cat => !cat.parent_category_id); // Filter top-level categories
      this.loadCategoryChildren(this.categories).subscribe(() => {
        if (this.categories.length > 0) {
          this.setActiveCategory(this.categories[0]);
        }
      });
    });
  }

  private loadCategoryChildren(categories: CategoryWithSubs[]): Observable<any> {
    if (!categories || categories.length === 0) {
      return of(null);
    }

    const observables: Observable<any>[] = categories.map(cat => {
      return this.categoryService.getSubCategories(cat.id).pipe(
        switchMap(subcategories => {
          cat.subcategories = subcategories;
          if (subcategories.length > 0) {
            return this.loadCategoryChildren(subcategories); // Recursively load children
          } else {
            // If no subcategories, load products for this category
            return this.productService.getProductsByCategory(cat.id).pipe(
              map(products => {
                cat.products = products.map(product => ({
                  ...product,
                  imageUrl: product.basePhotoUrl || 'assets/img/phone.jpg' // Fallback image
                }));
                return products;
              }),
              catchError(err => {
                console.error(`Error loading products for category ${cat.name}:`, err);
                cat.products = [];
                return of(null);
              })
            );
          }
        }),
        catchError(err => {
          console.error(`Error loading subcategories for ${cat.name}:`, err);
          cat.subcategories = [];
          return of(null);
        })
      );
    });
    return forkJoin(observables);
  }

  loadProducts(category: CategoryWithSubs): void {
    this.productService.getProductsByCategory(category.id).subscribe({
      next: (products) => {
        // Ensure each product has an imageUrl or fallback
        category.products = products.map(product => ({
          ...product,
          imageUrl: product.basePhotoUrl || 'assets/img/phone.jpg' // Fallback image
        }));
      },
      error: err => console.error(err)
    });
  }

  showMegaMenu(): void {
    this.isMegaMenuVisible = true;
  }

  hideMegaMenu(): void {
    this.isMegaMenuVisible = false;
  }

  setActiveCategory(category: CategoryWithSubs): void {
    this.activeCategory = category;
    this.activeSubcategory = null;
    this.activeSubSubcategory = null;
    // Ensure products are loaded if this is a leaf category
    if (!category.subcategories || category.subcategories.length === 0) {
      this.loadProducts(category);
    }
  }

  setActiveSubcategory(subcategory: CategoryWithSubs): void {
    this.activeSubcategory = subcategory;
    this.activeSubSubcategory = null;
    // Ensure products are loaded if this is a leaf subcategory
    if (!subcategory.subcategories || subcategory.subcategories.length === 0) {
      this.loadProducts(subcategory);
    }
  }

  isProduct(item: any): item is ProductResponse {
    return (item as ProductResponse).variants !== undefined;
  }

  hasChildren(item: CategoryWithSubs): boolean {
    return !!((item.subcategories && item.subcategories.length > 0) || 
           (item.products && item.products.length > 0));
  }

  get secondColumnItems(): (CategoryWithSubs | ProductResponse)[] | undefined {
    if (this.activeCategory) {
      if (this.activeCategory.subcategories && this.activeCategory.subcategories.length > 0) {
        return this.activeCategory.subcategories;
      } else if (this.activeCategory.products && this.activeCategory.products.length > 0) {
        return this.activeCategory.products;
      }
    }
    return undefined;
  }

  get thirdColumnItems(): ProductResponse[] | undefined {
    if (this.activeSubcategory) {
      if (this.activeSubcategory.products && this.activeSubcategory.products.length > 0) {
        return this.activeSubcategory.products;
      }
    }
    return undefined;
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product-detail', productId]);
    this.hideMegaMenu(); // Hide the mega menu after navigation
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const megaMenu = document.querySelector('.categories-mega-menu');
    const allCategoriesTrigger = document.querySelector('.all-categories-trigger');

    if (megaMenu && !megaMenu.contains(target) && allCategoriesTrigger && !allCategoriesTrigger.contains(target)) {
      this.hideMegaMenu();
    }
  }
}


