import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../category.service';
import { category } from '../category';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../ProductResponse';
import { MatSnackBar } from '@angular/material/snack-bar';

interface CategoryWithCount extends category {
  productCount?: number;
  imageUrl?: string;
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
  productList: ProductResponse[] = [];
  currentCategory: category | null = null;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private productService: ProductService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.urlParam = id;

      // Load current category
      this.categoryService.getCategoryById(id).subscribe({
        next: (data) => {
          this.currentCategory = data;
        },
        error: (err) => console.error('Error loading category:', err)
      });

      // Load subcategories
      this.categoryService.getSubCategories(id).subscribe({
        next: (data) => {
          console.log(data);
          this.categoryList = data.map(cat => ({
            ...cat,
            productCount: 0 // Initialize product count
          }));
          // Load product counts for each subcategory
          this.categoryList.forEach(cat => {
            if (cat.id) {
              this.productService.getProductsByCategory(cat.id).subscribe({
                next: (products) => {
                  
                  cat.productCount = products.length;
                },
                error: (err) => console.error('Error loading product count:', err)
              });
            }
          });
        },
        error: (err) => console.error('Error loading subcategories:', err)
      });

      // Load products
      this.productService.getProductsByCategory(id).subscribe({
        next: (data) => {
          this.productList = data;
          console.log(data);
        },
        error: (err) => console.error('Error loading products:', err)
      });
    });
  }

  navigateToSubCategory(id: number): void {
    this.router.navigate(['/sub-category', id]);
  }

  createSubCategory(): void {
    this.router.navigate(['/categoryRegister', this.urlParam]);
  }

  getPriceRange(product: ProductResponse): string {
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
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(productId).subscribe({
        next: () => {
          this.snackBar.open('Product deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          // Refresh the product list
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.snackBar.open('Error deleting product', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  private loadProducts(): void {
    if (this.urlParam) {
      this.productService.getProductsByCategory(Number(this.urlParam)).subscribe({
        next: (products) => {
          this.productList = products;
        },
        error: (error) => {
          console.error('Error loading products:', error);
        }
      });
    }
  }
}
