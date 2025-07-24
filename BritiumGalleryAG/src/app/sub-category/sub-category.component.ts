import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { category } from '../category';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../ProductResponse';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface CategoryWithCount extends category {
  productCount?: number;
  imageUrl?: string;
  status?: number;
}

// Extend ProductResponse to include status for UI
interface ProductWithStatus extends ProductResponse {
  status?: number;
}

@Component({
  selector: 'app-sub-category',
  standalone: false,
  templateUrl: './sub-category.component.html',
  styleUrls: ['./sub-category.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SubCategoryComponent implements OnInit {
  urlParam: number = 0;
  categoryList: CategoryWithCount[] = [];
  productList: ProductWithStatus[] = [];
  currentCategory: category | null = null;
  categoryPath: category[] = [];
  
  // Search related properties
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  filteredCategories: CategoryWithCount[] = [];
  filteredProducts: ProductWithStatus[] = [];
  allCategories: CategoryWithCount[] = [];
  allProducts: ProductWithStatus[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.performSearch();
    });
  }

  ngOnInit(): void {
    // Subscribe to route changes
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.urlParam = id;
      this.clearSearch(); // Clear search when navigating
      this.loadData(id);
      this.loadCategoryPath(id);
    });
  }

  private loadData(id: number): void {
    this.isLoading = true;
    this.categoryList = []; // Clear existing data
    this.productList = [];
    this.allCategories = [];
    this.allProducts = [];
    
    // Load current category
    this.categoryService.getCategoryById(id).subscribe({
      next: (data) => {
        this.currentCategory = data;
      },
      error: (err: Error) => {
        console.error('Error loading category:', err);
        this.showErrorAlert('Failed to load category');
      }
    });

    // Load all subcategories recursively
    this.categoryService.getAllSubCategories(id).subscribe({
      next: (categories: CategoryWithCount[]) => {
        this.allCategories = categories;
        this.categoryList = categories.filter((cat: CategoryWithCount) => cat.parent_category_id === id);
        
        // Load product counts for each category
        this.allCategories.forEach((cat: CategoryWithCount) => {
          if (cat.id) {
            this.productService.getProductsByCategory(cat.id).subscribe({
              next: (products) => {
                cat.productCount = products.length;
              },
              error: (err: Error) => {
                console.error('Error loading product count:', err);
              }
            });
          }
        });
      },
      error: (err: Error) => {
        console.error('Error loading subcategories:', err);
        this.showErrorAlert('Failed to load subcategories');
      }
    });

    // Load all products recursively
    this.productService.getAllProductsUnderCategory(id).subscribe({
      next: (products: ProductWithStatus[]) => {
        this.allProducts = products;
        this.productList = products.filter((prod: ProductWithStatus) => prod.categoryId === id);
        this.isLoading = false;
      },
      error: (err: Error) => {
        console.error('Error loading products:', err);
        this.showErrorAlert('Failed to load products');
        this.isLoading = false;
      }
    });
  }

  private loadCategoryPath(id: number): void {
    this.categoryService.getCategoryPath(id).subscribe({
      next: (path) => {
        this.categoryPath = path;
      },
      error: (err: Error) => {
        console.error('Error loading category path:', err);
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredCategories = [];
    this.filteredProducts = [];
  }

  private performSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [];
      this.filteredProducts = [];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();

    // Search in categories
    this.filteredCategories = this.allCategories.filter(category => {
      const idMatch = category.id.toString().includes(searchTermLower);
      const nameMatch = category.name.toLowerCase().includes(searchTermLower);
      return idMatch || nameMatch;
    });

    // Search in products
    this.filteredProducts = this.allProducts.filter(product => {
      const idMatch = product.id.toString().includes(searchTermLower);
      const nameMatch = product.name.toLowerCase().includes(searchTermLower);
      return idMatch || nameMatch;
    });
  }

  editCategory(category: CategoryWithCount): void {
    this.router.navigate(['/categoryEdit', category.id]);
  }

  deleteCategory(category: CategoryWithCount): void {
    Swal.fire({
      title: 'Delete Category?',
      text: `Are you sure you want to delete "${category.name}"? This will also delete all its products and cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.showSuccessAlert('Category deleted successfully');
            this.loadData(this.urlParam);
          },
          error: (err) => {
            console.log('Delete category error:', err);
            let errorObj = null;
            if (err && err.error) {
              errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
            }
            if (errorObj && errorObj.code === 'CATEGORY_PURCHASED') {
              Swal.fire({
                icon: 'info',
                title: 'Cannot Delete Category',
                text: 'This category has already been purchased by a customer. You can only hide it, not delete it completely.',
                showCancelButton: true,
                confirmButtonText: 'Hide Category',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#1976d2',
                cancelButtonColor: '#6c757d'
              }).then((hideResult) => {
                if (hideResult.isConfirmed) {
                  this.hideCategory(category);
                }
              });
            } else {
              this.showErrorAlert('Failed to delete category');
            }
          }
        });
      }
    });
  }

  navigateToSubCategory(id: number): void {
    // Only navigate if it's a different category
    if (id !== this.urlParam) {
      this.router.navigate(['/sub-category', id]);
    }
  }

  createSubCategory(): void {
    this.router.navigate(['/categoryRegister', this.urlParam]);
  }

  getPriceRange(product: ProductWithStatus): string {
    if (!product.variants || product.variants.length === 0) return 'N/A';

    const prices = product.variants.map(v => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `${min} MMK` : `${min} MMK – ${max} MMK`;
  }

  navigateToProduct(productId: number): void {
    this.router.navigate(['/product-detail', productId]);
  }

  navigateToProductEdit(productId: number) {
    this.router.navigate(['/product-edit', productId]);
  }

  deleteProduct(productId: number): void {
    Swal.fire({
      title: 'Delete Product?',
      text: 'Are you sure you want to delete this product? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            this.showSuccessAlert('Product deleted successfully');
            this.loadProducts();
          },
          error: (err) => {
            console.log('Delete product error:', err);
            let errorObj = null;
            if (err && err.error) {
              errorObj = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
            }
            if ((errorObj && errorObj.code === 'PRODUCT_PURCHASED') || (typeof err.error === 'string' && err.error.includes('SOFT_DELETE'))) {
              Swal.fire({
                icon: 'info',
                title: 'Cannot Delete Product',
                text: 'This product has already been purchased by a customer. You can only hide it, not delete it completely.',
                showCancelButton: true,
                confirmButtonText: 'Hide Product',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#1976d2',
                cancelButtonColor: '#6c757d'
              }).then((hideResult) => {
                if (hideResult.isConfirmed) {
                  this.productService.hideProduct(productId).subscribe(() => {
                    this.showSuccessAlert('Product hidden successfully');
                    this.loadProducts();
                  });
                }
              });
            } else {
              this.showErrorAlert('Failed to delete product');
            }
          }
        });
      }
    });
  }

  private loadProducts(): void {
    if (this.urlParam) {
      this.productService.getProductsByCategory(Number(this.urlParam)).subscribe({
        next: (products) => {
          this.productList = products;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.showErrorAlert('Failed to load products');
        }
      });
    }
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
      timer: 2000,
      showConfirmButton: false
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
  }

  hideCategory(category: CategoryWithCount): void {
    this.categoryService.hideCategory(category.id).subscribe({
      next: () => {
        this.showSuccessAlert('Category hidden successfully');
        this.loadData(this.urlParam);
      },
      error: () => {
        this.showErrorAlert('Failed to hide category');
      }
    });
  }

  unhideCategory(category: CategoryWithCount): void {
    if (category.parent_category_id) {
      this.categoryService.getCategoryById(category.parent_category_id).subscribe(parentCategory => {
        if (parentCategory && parentCategory.status !== 1) {
          Swal.fire({
            icon: 'error',
            title: 'Cannot Unhide Category',
            text: "You can't unhide this category since its parent category is hidden.",
            confirmButtonColor: '#222'
          });
          return;
        }
        this.categoryService.unhideCategory(category.id).subscribe({
          next: () => {
            this.showSuccessAlert('Category unhidden successfully');
            this.loadData(this.urlParam);
          },
          error: () => {
            this.showErrorAlert('Failed to unhide category');
          }
        });
      });
    } else {
      this.categoryService.unhideCategory(category.id).subscribe({
        next: () => {
          this.showSuccessAlert('Category unhidden successfully');
          this.loadData(this.urlParam);
        },
        error: () => {
          this.showErrorAlert('Failed to unhide category');
        }
      });
    }
  }

  hideProduct(productId: number): void {
    this.productService.hideProduct(productId).subscribe({
      next: () => {
        this.showSuccessAlert('Product hidden successfully');
        this.loadProducts();
      },
      error: () => {
        this.showErrorAlert('Failed to hide product');
      }
    });
  }

  unhideProduct(productId: number): void {
    // Find the product and its category
    const product = this.productList.find(p => p.id === productId);
    if (!product) {
      this.showErrorAlert('Product not found');
      return;
    }
    // Find the category (from allCategories or categoryList)
    const category = this.allCategories?.find(c => c.id === product.categoryId) || this.categoryList?.find(c => c.id === product.categoryId) || this.currentCategory;
    if (category && category.status !== 1) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Unhide Product',
        text: "You can't unhide this product since its category is hidden.",
        confirmButtonColor: '#222'
      });
      return;
    }
    this.productService.unhideProduct(productId).subscribe({
      next: () => {
        this.showSuccessAlert('Product unhidden successfully');
        this.loadProducts();
      },
      error: () => {
        this.showErrorAlert('Failed to unhide product');
      }
    });
  }
}
