import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../category.service';
import { ProductResponse } from '../ProductResponse';
import { category, CategoryAttribute } from '../category';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-category-product',
  templateUrl: './category-product.component.html',
  styleUrls: ['./category-product.component.css'],
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule]
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
  brands: string[] = [];
  selectedBrands: string[] = [];
  minPrice: number | null = null;
  maxPrice: number | null = null;
  priceRangeMin: number = 0;
  priceRangeMax: number = 0;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  filteredProducts: ProductResponse[] = [];
  sortOption: string = 'featured';
  showSortMenu: boolean = false;

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
        // Reset all filter state
        this.selectedAttributeFilters = {};
        this.expandedFilters = {};
        this.selectedBrands = [];
        this.minPrice = null;
        this.maxPrice = null;
        this.areAllFiltersHidden = true;
        this.searchTerm = '';
        this.filteredProducts = [];
        this.loadCategoryDetails();
        this.loadProducts();
        this.loadAvailableAttributes();
        this.loadBreadcrumb();
        this.loadBrands();
        this.updatePriceRange();
      }
    });
    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.performSearch();
    });
  }

  loadCategoryDetails(): void {
    if (this.categoryId) {
      this.categoryService.getCategoryById(this.categoryId).subscribe(category => {
        this.currentCategory = category;
        
        // Always load direct subcategories of the current category
        if (this.categoryId) {
          this.categoryService.getSubCategories(this.categoryId).subscribe(subCats => {
            this.subCategories = subCats.filter(cat => cat.status === 1);
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
      this.productService.getFilteredProducts(this.categoryId, this.selectedAttributeFilters, this.searchTerm).subscribe(products => {
        this.products = products.filter(product => product.status === 1);
        this.sortProducts();
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

  loadBrands(): void {
    if (this.categoryId) {
      this.productService.getBrandsForCategory(this.categoryId).subscribe(brands => {
        this.brands = brands;
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
    const filters = { ...this.selectedAttributeFilters };
    if (this.selectedBrands.length > 0) {
      filters['brand'] = this.selectedBrands;
    }
    if (this.minPrice !== null) {
      filters['minPrice'] = [this.minPrice.toString()];
    }
    if (this.maxPrice !== null) {
      filters['maxPrice'] = [this.maxPrice.toString()];
    }
    this.productService.getFilteredProducts(this.categoryId!, filters, this.searchTerm).subscribe(products => {
      this.products = products;
      this.sortProducts();
    });
    console.log('Applying filters:', filters, 'Search:', this.searchTerm);
  }

  toggleBrandFilter(brand: string): void {
    if (this.selectedBrands.includes(brand)) {
      this.selectedBrands = this.selectedBrands.filter(b => b !== brand);
    } else {
      this.selectedBrands.push(brand);
    }
    this.applyFilters();
  }

  toggleAllFilters(): void {
    this.areAllFiltersHidden = !this.areAllFiltersHidden;
    this.availableAttributes.forEach(attr => {
      this.expandedFilters[attr.name] = !this.areAllFiltersHidden;
    });
  }

  navigateToCategory(id: number): void {
    // Reset all filter state
    this.selectedAttributeFilters = {};
    this.expandedFilters = {};
    this.selectedBrands = [];
    this.minPrice = null;
    this.maxPrice = null;
    this.areAllFiltersHidden = true;
    this.searchTerm = '';
    this.filteredProducts = [];
    this.router.navigate(['/category-products', id]);
  }

  goToCategoryProduct(id: number): void {
    // Reset all filter state
    this.selectedAttributeFilters = {};
    this.expandedFilters = {};
    this.selectedBrands = [];
    this.minPrice = null;
    this.maxPrice = null;
    this.areAllFiltersHidden = true;
    this.searchTerm = '';
    this.filteredProducts = [];
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

  updatePriceRange(): void {
    if (this.categoryId) {
      this.productService.getMinMaxPriceForCategory(this.categoryId).subscribe(range => {
        this.priceRangeMin = range.min;
        this.priceRangeMax = range.max;
        // Set minPrice and maxPrice to full range if not already set
        if (this.minPrice === null || this.minPrice < this.priceRangeMin) {
          this.minPrice = this.priceRangeMin;
        }
        if (this.maxPrice === null || this.maxPrice > this.priceRangeMax) {
          this.maxPrice = this.priceRangeMax;
        }
      });
    }
  }

  onMinPriceInput(): void {
    if (this.minPrice === null) this.minPrice = this.priceRangeMin;
    if (this.maxPrice === null) this.maxPrice = this.priceRangeMax;
    if (this.minPrice > this.maxPrice) {
      this.minPrice = this.maxPrice;
    }
    this.applyFilters();
  }

  onMaxPriceInput(): void {
    if (this.minPrice === null) this.minPrice = this.priceRangeMin;
    if (this.maxPrice === null) this.maxPrice = this.priceRangeMax;
    if (this.maxPrice < this.minPrice) {
      this.maxPrice = this.minPrice;
    }
    this.applyFilters();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  performSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredProducts = [];
      return;
    }
    // Filter products
    this.filteredProducts = this.products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(term);
      const brandMatch = product.brand?.toLowerCase().includes(term);
      // Check all variants for SKU match
      const skuMatch = product.variants?.some(variant => variant.sku?.toLowerCase().includes(term));
      return nameMatch || brandMatch || skuMatch;
    });
    this.sortProducts();
  }

  onSortChange(option: string): void {
    this.sortOption = option;
    this.sortProducts();
  }

  sortProducts(): void {
    const sortFn = (a: ProductResponse, b: ProductResponse) => {
      switch (this.sortOption) {
        case 'newest':
          // Assuming higher id means newer
          return (b.id || 0) - (a.id || 0);
        case 'price-high-low': {
          const aMax = Math.max(...(a.variants?.map(v => v.price) || [0]));
          const bMax = Math.max(...(b.variants?.map(v => v.price) || [0]));
          return bMax - aMax;
        }
        case 'price-low-high': {
          const aMin = Math.min(...(a.variants?.map(v => v.price) || [Infinity]));
          const bMin = Math.min(...(b.variants?.map(v => v.price) || [Infinity]));
          return aMin - bMin;
        }
        case 'featured':
        default:
          return 0;
      }
    };
    if (this.searchTerm) {
      this.filteredProducts = [...this.filteredProducts].sort(sortFn);
    } else {
      this.products = [...this.products].sort(sortFn);
    }
  }
} 