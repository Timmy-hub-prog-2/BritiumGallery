import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CategoryService } from '../category.service';
import { ProductService } from '../services/product.service';
import { category } from '../category';
import { ProductResponse } from '../ProductResponse';
import { Router } from '@angular/router';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { User } from '../../user.model';

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
export class NavigationComponent implements OnInit, OnDestroy {
  categories: CategoryWithSubs[] = [];
  activeCategory: CategoryWithSubs | null = null;
  activeSubcategory: CategoryWithSubs | null = null;
  activeSubSubcategory: CategoryWithSubs | null = null;
  isMegaMenuVisible = false;
  user: User | null = null;
  isProfileMenuVisible = false;
  
  private hideMenuTimeout: any;
  private hoverTimeout: any;
  private userSubscription: Subscription | undefined;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private router: Router,
    private userService: UserService
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

    // Subscribe to user changes from UserService
    this.userSubscription = this.userService.currentUser.subscribe((user: User | null) => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.hideMenuTimeout) {
      clearTimeout(this.hideMenuTimeout);
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    }
  }

  logout(): void {
    this.userService.logout(); // Use UserService logout method
    this.router.navigate(['/login']);
    this.isProfileMenuVisible = false; // Hide the menu after logging out
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation(); // Prevent the document click listener from immediately closing it
    if (this.user) {
      this.isProfileMenuVisible = !this.isProfileMenuVisible;
    } else {
      this.router.navigate(['/login']);
    }
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
    clearTimeout(this.hideMenuTimeout); // Cancel any pending hide
    this.isMegaMenuVisible = true;
  }

  hideMegaMenuWithDelay(): void {
    this.hideMenuTimeout = setTimeout(() => {
      this.isMegaMenuVisible = false;
    }, 100); // Delay in ms (adjust to 500 if you want it longer)
  }

  cancelHideMegaMenu(): void {
    clearTimeout(this.hideMenuTimeout);
  }

  // Optional: if you want to override immediate hide
  hideMegaMenu(): void {
    clearTimeout(this.hideMenuTimeout);
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
    this.hideMegaMenu();
  }

  goToWishlist() {
    this.router.navigate(['/wishlist']);
  }

  goToCart(){
    this.router.navigate(['/cart']);
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const megaMenu = document.querySelector('.categories-mega-menu');
    const allCategoriesTrigger = document.querySelector('.all-categories-trigger');
    const profileButton = document.querySelector('.profile-button');
    const profileMenu = document.querySelector('.profile-dropdown-menu');

    if (megaMenu && !megaMenu.contains(target) && allCategoriesTrigger && !allCategoriesTrigger.contains(target)) {
      this.hideMegaMenu();
    }

    // Close profile menu if clicked outside
    if (profileMenu && !profileMenu.contains(target) && profileButton && !profileButton.contains(target)) {
      this.isProfileMenuVisible = false;
    }
  }
}


