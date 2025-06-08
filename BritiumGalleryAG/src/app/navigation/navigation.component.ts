import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../category.service';
import { ProductService } from '../product.service';
import { category } from '../category';
import { ProductResponse } from '../ProductResponse';

interface CategoryWithSubs extends category {
  subcategories?: CategoryWithSubs[];
  products?: ProductResponse[];
}

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  standalone:false,
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
  categories: CategoryWithSubs[] = [];
  isMegaMenuVisible: boolean = false;
  activeCategory: CategoryWithSubs | null = null;
  activeSubcategory: CategoryWithSubs | null = null;
  activeSubSubcategory: CategoryWithSubs | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        const map = new Map<number, CategoryWithSubs>();

        // Convert to map for quick lookup
        categories.forEach(cat => {
          map.set(cat.id, { ...cat, subcategories: [], products: [] });
        });

        // Build category tree
        map.forEach(cat => {
          if (cat.parent_category_id) {
            const parent = map.get(cat.parent_category_id);
            if (parent) {
              parent.subcategories!.push(cat);
            }
          }
        });

        // Set root categories
        this.categories = Array.from(map.values()).filter(cat => !cat.parent_category_id);

        // Load products for leaf categories
        this.categories.forEach(category => this.loadChildren(category));
      },
      error: (err) => console.error("Error loading categories:", err)
    });
  }

  loadChildren(parent: CategoryWithSubs): void {
    this.categoryService.getSubCategories(parent.id).subscribe({
      next: (subs) => {
        parent.subcategories = subs.map(sub => ({
          ...sub,
          subcategories: [],
          products: []
        }));

        // If no subcategories, load products
        if (parent.subcategories.length === 0) {
          this.loadProducts(parent);
        } else {
          // Load children for each subcategory
          parent.subcategories.forEach(sub => this.loadChildren(sub));
        }
      },
      error: err => console.error(err)
    });
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
    if (this.categories.length > 0 && !this.activeCategory) {
      this.setActiveCategory(this.categories[0]);
    }
  }

  hideMegaMenu(): void {
    this.isMegaMenuVisible = false;
    this.resetActiveCategories();
  }

  setActiveCategory(category: CategoryWithSubs): void {
    this.activeCategory = category;
    this.activeSubcategory = null;
    this.activeSubSubcategory = null;
    
    // If category has no subcategories, ensure products are loaded
    if (category.subcategories?.length === 0 && !category.products) {
      this.loadProducts(category);
    }
  }

  setActiveSubcategory(subcategory: CategoryWithSubs): void {
    this.activeSubcategory = subcategory;
    this.activeSubSubcategory = null;
    
    // If subcategory has no subcategories, ensure products are loaded
    if (subcategory.subcategories?.length === 0 && !subcategory.products) {
      this.loadProducts(subcategory);
    }
  }

  setActiveSubSubcategory(subSubcategory: CategoryWithSubs): void {
    this.activeSubSubcategory = subSubcategory;
    
    // If sub-subcategory has no subcategories, ensure products are loaded
    if (subSubcategory.subcategories?.length === 0 && !subSubcategory.products) {
      this.loadProducts(subSubcategory);
    }
  }

  resetActiveCategories(): void {
    this.activeCategory = null;
    this.activeSubcategory = null;
    this.activeSubSubcategory = null;
  }

  hasChildren(item: CategoryWithSubs): boolean {
  return !!((item.subcategories && item.subcategories.length > 0) || 
         (item.products && item.products.length > 0));
}

  get secondColumnItems(): (CategoryWithSubs | ProductResponse)[] | undefined {
    if (!this.activeCategory) return undefined;
    
    // If category has subcategories, show them
    if (this.activeCategory.subcategories && this.activeCategory.subcategories.length > 0) {
      return this.activeCategory.subcategories;
    }
    // Otherwise show products
    else if (this.activeCategory.products) {
      return this.activeCategory.products;
    }
    return undefined;
  }

  get thirdColumnItems(): (CategoryWithSubs | ProductResponse)[] | undefined {
    if (!this.activeSubcategory) return undefined;
    
    // If subcategory has subcategories, show them
    if (this.activeSubcategory.subcategories && this.activeSubcategory.subcategories.length > 0) {
      return this.activeSubcategory.subcategories;
    }
    // Otherwise show products
    else if (this.activeSubcategory.products) {
      return this.activeSubcategory.products;
    }
    return undefined;
  }

  isCategory(item: any): item is CategoryWithSubs {
    return item && typeof item.id === 'number' && 
           typeof item.name === 'string' && 
           Array.isArray(item.subcategories);
  }

  isProduct(item: any): item is ProductResponse {
    return item && typeof item.name === 'string' && 
           (typeof item.imageUrl === 'string' || item.imageUrl === undefined);
  }
}