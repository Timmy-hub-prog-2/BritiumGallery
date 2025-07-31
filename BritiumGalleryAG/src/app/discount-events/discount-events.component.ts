import { Component, type OnInit, ChangeDetectorRef } from "@angular/core"
import { DiscountEventService } from "../discount-event.service"
import { CategoryService } from "../category.service"
import { ProductVariantService } from "../services/product-variant.service"
import { ProductService } from "../services/product.service"
import { BrandService } from "../services/brand.service"
import { PeopleService } from "../people.service"
import { Brand } from "../models/product.model"
import { forkJoin } from 'rxjs'
import { HostListener } from '@angular/core'
import { CategoryFilterPipe } from '../category-filter.pipe'
import { ProductFilterPipe } from '../product-filter.pipe'
import Swal from 'sweetalert2';

export interface CascadeNode {
  name: string
  children?: CascadeNode[]
  type: "category" | "sub-category" | "product" | "variant" | "brand"
  discount?: number
  imageUrls?: string[]
  attributes?: { [key: string]: string }
  id?: number | string
}

export interface DiscountRule {
  id: string
  targetType: "category" | "product" | "brand"
  selectedPath: CascadeNode[]
  discountPercent: number | null
  targetLevel: "category" | "subcategory" | "product" | "variant" | "brand"
}

@Component({
  selector: "app-discount-events",
  standalone: false,
  templateUrl: "./discount-events.component.html",
  styleUrls: ["./discount-events.component.css"],
})
export class DiscountEventsComponent implements OnInit {
  // Add new filter-related properties
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  filterStartDate: string = '';
  filterEndDate: string = '';
  filterEventName: string = '';
  allEvents: any[] = []; // Store all events before filtering

  events: any[] = []
  loading = false
  error = ""
  showCreateModal = false
  todayString = new Date().toISOString().split("T")[0]

  categories: any[] = []
  productVariants: any[] = []
  products: any[] = []
  brands: Brand[] = []

  newEvent: any = {
    name: "",
    startDate: "",
    endDate: "",
    rules: [] as DiscountRule[],
  }

  showEditModal = false
  showHistoryModal = false
  editEvent: any = null
  eventHistory: any[] = []

  // Cascade navigation state
  cascadeRoot: CascadeNode[] = []
  cascadePath: CascadeNode[] = []
  cascadeHoverPath: CascadeNode[] = []

  // Rule management state
  currentRuleIndex: number | null = null
  showRuleBuilder = false
  builderType: "category" | "product" | "brand" = "category"
  selectedProduct: CascadeNode | null = null
  selectedBrand: Brand | null = null

  showEditRuleBuilder: boolean = false;
  currentEditRuleIndex: number | null = null;

  productBreadcrumbs: { [productId: string]: string[] } = {};
  productSearchTerm: string = '';
  expandedProductIds: Set<number> = new Set();

  // For new product selection flow
  subCategorySearchTerm: string = '';
  selectedSubCategory: any = null;
  productListSearchTerm: string = '';
  selectedProductForVariants: any = null;

  // Generalized multi-select state
  selectedVariants: CascadeNode[] = [];
  selectedProducts: CascadeNode[] = [];
  selectedCategories: CascadeNode[] = [];
  selectedBrands: Brand[] = [];

  // UI state for feedback
  selectedCount: number = 0;
  toastMessage: string = '';
  showToast: boolean = false;

  editVariantId: string | number | null = null;

  // Form validation error messages
  nameError: string = '';
  startDateError: string = '';
  endDateError: string = '';
  createFormGeneralError: string = '';

  // Edit form validation error messages
  editNameError: string = '';
  editStartDateError: string = '';
  editEndDateError: string = '';

  // Category dropdown state
  showCategoryDropdown: boolean = false;
  categorySearchTerm: string = '';
  editCategorySearchTerm: string = ''; // Separate search term for edit modal
  expandedCategoryIds: Set<number> = new Set();
  sortedCategories: any[] = [];
  parentCategories: any[] = [];

  showProductDropdown: boolean = false;
  showBrandDropdown: boolean = false;

  // Add modal state for product variant selection
  showProductVariantModal = false;
  selectedProductForVariant: any = null;
  openVariantProductId: number | null = null;

  brandSearchTerm: string = '';
  get filteredBrands() {
    if (!this.brandSearchTerm) return this.brands;
    const term = this.brandSearchTerm.toLowerCase();
    return this.brands.filter(b => b.name.toLowerCase().includes(term));
  }

  // Edit modal multi-select state
  editSelectedProducts: CascadeNode[] = [];
  editSelectedVariants: CascadeNode[] = [];
  editSelectedBrands: Brand[] = [];
  editSelectedCategories: CascadeNode[] = [];

  showDateRange: boolean = false;

  searchEventName: string = '';

  showActionToggle: boolean = false;
  actionToggle: 'show' | 'history' | 'delete' | null = null;

  // Admin data for history
  admins: any[] = [];
  adminMap: { [key: number]: string } = {};

  // Memoized filtered categories for dropdown
  private _filteredCategoriesForDropdown: any[] = [];
  private _lastCategorySearchTerm = '';
  private _lastCategoriesSnapshot: any[] = [];

  get filteredCategoriesForDropdown() {
    // Always recalculate to ensure UI is in sync
    this._filteredCategoriesForDropdown = this._calculateFilteredCategories(this.categorySearchTerm);
    this._lastCategorySearchTerm = this.categorySearchTerm;
    this._lastCategoriesSnapshot = this.categories;
    
    return this._filteredCategoriesForDropdown;
  }

  get filteredEditCategoriesForDropdown() {
    // Calculate filtered categories for edit modal
    return this._calculateFilteredCategories(this.editCategorySearchTerm);
  }

  private _calculateFilteredCategories(searchTerm?: string) {
    const term = searchTerm?.toLowerCase() || this.categorySearchTerm?.toLowerCase() || '';
    
    // Helper: recursively build category tree with children
    const buildCategoryTree = (parent: any): any => {
      const children = this.getCategoryChildren(parent.id).map(buildCategoryTree);
      return { ...parent, children };
    };
    
    // Helper: check if category matches search term
    const categoryMatches = (category: any): boolean => {
      return category.name.toLowerCase().includes(term);
    };
    
    // Helper: recursively filter children based on search term
    const filterTree = (parent: any): any => {
      const children: any[] = this.getCategoryChildren(parent.id).map(filterTree).filter(Boolean);
      const parentMatches = categoryMatches(parent);
      
      if (parentMatches) {
        // If parent matches, show only its children that also match the search term
        const matchingChildren = this.getCategoryChildren(parent.id).map(filterTree).filter(Boolean);
        return { ...parent, children: matchingChildren };
      } else if (children.length > 0) {
        // If any child matches, show only those children
        return { ...parent, children };
      }
      // If neither parent nor children match, exclude
      return null;
    };
    
    // For search, we want to show ALL categories that match, not just parent categories
    if (!term) {
      // No search: show all parents and all children
      return this.parentCategories.map(buildCategoryTree).filter(cat => cat && cat.id);
    } else {
      // Search: maintain hierarchy but show categories that match
      return this.parentCategories.map(filterTree).filter(Boolean).filter(cat => cat && cat.id);
    }
  }

  constructor(
    private eventService: DiscountEventService,
    private categoryService: CategoryService,
    private productVariantService: ProductVariantService,
    private productService: ProductService,
    private brandService: BrandService,
    private peopleService: PeopleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchEvents()
    this.fetchCategories()
    this.fetchProducts()
    this.fetchProductVariants()
    this.fetchBrands()
    this.fetchAdmins()
  }

  fetchEvents() {
    this.loading = true
    this.eventService.getAllEvents().subscribe({
      next: (data: any[]) => {
        this.allEvents = data; // Store all events
        this.events = data; // Initial display of all events
        this.loading = false;
        this.applyFilters(); // Apply any existing filters
        this.updateDiscountedIds(); // Update discounted IDs for create modal
      },
      error: (err: any) => {
        this.error = "Failed to load events."
        this.loading = false
      },
    })
  }

  // Add new filter methods
  filterByStatus(status: 'all' | 'active' | 'inactive') {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyDateFilter() {
    this.applyFilters();
  }

  clearDateFilter() {
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.applyFilters();
  }

  applyEventNameFilter() {
    this.applyFilters();
  }

  private applyFilters() {
    let filteredEvents = [...this.allEvents];

    // Apply status filter
    if (this.selectedStatus !== 'all') {
      const now = new Date();
      filteredEvents = filteredEvents.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const isActive = startDate <= now && endDate >= now;
        return this.selectedStatus === 'active' ? isActive : !isActive;
      });
    }

    // Apply date range filter
    if (this.filterStartDate || this.filterEndDate) {
      filteredEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        
        if (this.filterStartDate && this.filterEndDate) {
          const filterStart = new Date(this.filterStartDate);
          const filterEnd = new Date(this.filterEndDate);
          // Event overlaps with filter range
          return eventStart <= filterEnd && eventEnd >= filterStart;
        } else if (this.filterStartDate) {
          const filterStart = new Date(this.filterStartDate);
          return eventEnd >= filterStart;
        } else if (this.filterEndDate) {
          const filterEnd = new Date(this.filterEndDate);
          return eventStart <= filterEnd;
        }
        return true;
      });
    }

    // Apply event name filter
    if (this.filterEventName && this.filterEventName.trim() !== '') {
      const term = this.filterEventName.trim().toLowerCase();
      filteredEvents = filteredEvents.filter(event =>
        event.name && event.name.toLowerCase().includes(term)
      );
    }

    this.events = filteredEvents;
  }

  fetchCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data: any[]) => {
        this.categories = data;
        this.buildSortedCategories();
        this.tryBuildCascadeTree();
        // Build nested tree for dropdown
        this.parentCategories = this.buildCategoryTree(this.categories);
      },
      error: (error) => {
        this.categories = [];
      },
    });
  }

  buildSortedCategories() {
    // Sort categories alphabetically
    this.sortedCategories = [...this.categories].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    
    // Get parent categories (those without parent_category_id)
    this.parentCategories = this.sortedCategories.filter(cat => 
      cat.parent_category_id == null
    )
    
    console.log('Sorted categories:', this.sortedCategories);
    console.log('Parent categories:', this.parentCategories);
  }

  getCategoryChildren(parentId: number): any[] {
    return this.sortedCategories.filter(cat => cat.parent_category_id === parentId)
  }

  toggleCategoryExpansion(categoryId: number) {
    if (this.expandedCategoryIds.has(categoryId)) {
      this.expandedCategoryIds.delete(categoryId)
    } else {
      this.expandedCategoryIds.add(categoryId)
    }
  }

  isCategoryExpanded(categoryId: number): boolean {
    return this.expandedCategoryIds.has(categoryId)
  }

  toggleCategoryDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.disableDocumentClick = true;
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.categorySearchTerm = '';
      this.expandedCategoryIds.clear();
      // Removed setTimeout for positionDropdown
    }
    this.cdr.detectChanges();
    setTimeout(() => {
      this.disableDocumentClick = false;
    }, 100);
  }

  onCategorySearchInput(event: any) {
    this.categorySearchTerm = event.target.value
    
    // Clear previous selections when searching
    if (this.categorySearchTerm) {
      this.selectedCategories = [];
      this.selectedCount = 0;
    }
    
    // Auto-expand categories that match search
    if (this.categorySearchTerm) {
      this.expandedCategoryIds.clear()
      this.sortedCategories.forEach(category => {
        if (category.name.toLowerCase().includes(this.categorySearchTerm.toLowerCase())) {
          if (category.parent_category_id) {
            this.expandedCategoryIds.add(category.parent_category_id)
          }
          // Also expand the category itself if it has children
          if (this.getCategoryChildren(category.id).length > 0) {
            this.expandedCategoryIds.add(category.id)
          }
        }
      })
    }
    // Force recalculation of filtered categories
    this._filteredCategoriesForDropdown = [];
    this._lastCategorySearchTerm = '';
    this._lastCategoriesSnapshot = []; // Force recalculation
    
    // Force change detection to update UI immediately
    this.cdr.detectChanges();
  }

  onEditCategorySearchInput(event: any) {
    this.editCategorySearchTerm = event.target.value
    console.log('Edit modal search term:', this.editCategorySearchTerm);
    
    // Auto-expand categories that match search
    if (this.editCategorySearchTerm) {
      this.expandedCategoryIds.clear()
      this.sortedCategories.forEach(category => {
        if (category.name.toLowerCase().includes(this.editCategorySearchTerm.toLowerCase())) {
          if (category.parent_category_id) {
            this.expandedCategoryIds.add(category.parent_category_id)
          }
        }
      })
    }
    
    // Force change detection to update UI immediately
    this.cdr.detectChanges();
  }

  trackByCategoryId(index: number, category: any): number {
    return category.id;
  }

  toggleProductDropdown() {
    this.showProductDropdown = !this.showProductDropdown
    if (this.showProductDropdown) {
      this.productSearchTerm = ''
      this.expandedProductIds.clear()
      // Position dropdown after it's rendered
      setTimeout(() => {
        this.positionDropdown('.product-dropdown-trigger', '.product-dropdown-content')
        const searchInput = document.querySelector('.product-search-input') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }, 10)
    }
  }

  onProductSearchInput(event: any) {
    this.productSearchTerm = event.target.value
    // Auto-expand products that match search
    if (this.productSearchTerm) {
      this.expandedProductIds.clear()
      this.products.forEach(product => {
        if (product.name.toLowerCase().includes(this.productSearchTerm.toLowerCase())) {
          this.expandedProductIds.add(product.id)
        }
      })
    }
  }

  get filteredProductsForDropdown() {
    const term = (this.productSearchTerm || '').toLowerCase().trim();
    if (!term) {
      return this.products;
    }
    return this.products.filter(product => {
      const name = (product.name || '').toLowerCase();
      return name.includes(term);
    });
  }

  toggleBrandDropdown() {
    this.showBrandDropdown = !this.showBrandDropdown;
    if (this.showBrandDropdown) {
      // Position dropdown after it's rendered
      setTimeout(() => {
        this.positionDropdown('.brand-dropdown-trigger', '.brand-dropdown-content')
      }, 10)
    }
  }

  // Add flag to disable document click temporarily
  private disableDocumentClick = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any) {
    // Skip if document click is temporarily disabled
    if (this.disableDocumentClick) {
      return;
    }
    // CATEGORY
    if (this.showCategoryDropdown) {
      const trigger = event.target.closest('.category-dropdown-trigger');
      const content = event.target.closest('.category-dropdown-content');
      const container = event.target.closest('.category-dropdown-container');
      // Only close if clicking outside the entire dropdown container
      if (!container) {
        this.showCategoryDropdown = false;
      }
    }
    // PRODUCT
    if (this.showProductDropdown) {
      const trigger = event.target.closest('.category-dropdown-trigger');
      const content = event.target.closest('.category-dropdown-content');
      const container = event.target.closest('.category-dropdown-container');
      if (!container) {
        this.showProductDropdown = false;
      }
    }
    // BRAND
    if (this.showBrandDropdown) {
      const trigger = event.target.closest('.category-dropdown-trigger');
      const content = event.target.closest('.category-dropdown-content');
      const container = event.target.closest('.category-dropdown-container');
      if (!container) {
        this.showBrandDropdown = false;
      }
    }
  }

  fetchProducts() {
    this.productService.getAllProducts().subscribe({
      next: (data: any[]) => {
        this.products = data.map((product) => ({
          ...product,
          discount: undefined,
          variants: [], // Initialize empty variants array
        }))
        this.fetchProductBreadcrumbs();
        // Attach variants after products are loaded
        this.attachVariantsToProducts();
        this.tryBuildCascadeTree()
      },
      error: () => {
        this.products = []
      },
    })
  }

  fetchProductBreadcrumbs() {
    if (!this.products || !this.products.length) return;
    const requests = this.products.map(product =>
      this.productService.getProductBreadcrumb(product.id)
    );
    forkJoin(requests).subscribe((breadcrumbs: string[][]) => {
      this.products.forEach((product, idx) => {
        this.productBreadcrumbs[product.id] = breadcrumbs[idx];
      });
    });
  }

  get filteredProducts() {
    if (!this.productSearchTerm) return this.products;
    const term = this.productSearchTerm.toLowerCase();
    return this.products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(term);
      const breadcrumb = this.productBreadcrumbs[product.id]?.join(' → ') || '';
      const breadcrumbMatch = breadcrumb.toLowerCase().includes(term);
      return nameMatch || breadcrumbMatch;
    });
  }

  fetchProductVariants() {
    this.productVariantService.getAll().subscribe({
      next: (data: any[]) => {
        this.productVariants = data;
        // Attach variants after variants are loaded
        this.attachVariantsToProducts();
        this.tryBuildCascadeTree();
      },
      error: (error) => {
        this.productVariants = [];
      },
    })
  }

  attachVariantsToProducts() {
    if (!this.products || !this.productVariants) return;
    this.products.forEach(product => {
      product.variants = this.productVariants.filter((v: any) => v.productId === product.id);
    });
  }

  fetchBrands() {
    this.brandService.getAllBrands().subscribe({
      next: (data: Brand[]) => {
        this.brands = data.map((b) => ({
          ...b,
          discount: undefined,
        }))
      },
      error: () => {
        this.brands = []
      },
    })
  }

  fetchAdmins() {
    this.peopleService.getAdmins().subscribe({
      next: (data: any[]) => {
        this.admins = data;
        // Create a map for quick admin name lookup
        this.adminMap = {};
        data.forEach(admin => {
          this.adminMap[admin.id] = admin.name;
        });
      },
      error: () => {
        this.admins = [];
        this.adminMap = {};
      },
    })
  }

  getAdminName(adminId: number): string {
    return this.adminMap[adminId] || `Admin ${adminId}`;
  }

  getActionIcon(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATED':
        return 'fas fa-plus-circle';
      case 'UPDATED':
        return 'fas fa-edit';
      case 'DELETED':
        return 'fas fa-trash';
      case 'ACTIVATED':
        return 'fas fa-play-circle';
      case 'DEACTIVATED':
        return 'fas fa-pause-circle';
      default:
        return 'fas fa-circle';
    }
  }

  getActionIconClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATED':
        return 'icon-created';
      case 'UPDATED':
        return 'icon-updated';
      case 'DELETED':
        return 'icon-deleted';
      case 'ACTIVATED':
        return 'icon-activated';
      case 'DEACTIVATED':
        return 'icon-deactivated';
      default:
        return 'icon-default';
    }
  }

  getActionBadgeClass(action: string): string {
    switch (action?.toUpperCase()) {
      case 'CREATED':
        return 'badge-created';
      case 'UPDATED':
        return 'badge-updated';
      case 'DELETED':
        return 'badge-deleted';
      case 'ACTIVATED':
        return 'badge-activated';
      case 'DEACTIVATED':
        return 'badge-deactivated';
      default:
        return 'badge-default';
    }
  }

  private dataLoadedCount = 0
  private tryBuildCascadeTree() {
    this.dataLoadedCount++
    if (this.dataLoadedCount >= 3) {
      this.buildCascadeTree()
    }
  }

  buildCascadeTree() {
    if (!this.categories.length || !this.products.length) return

    const categoryMap = new Map<number, CascadeNode>()
    this.categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        name: cat.name,
        type: "category",
        children: [],
        id: cat.id,
        discount: undefined,
      })
    })

    // Attach products to their categories
    this.products.forEach((prod) => {
      const prodNode: CascadeNode = {
        name: prod.name,
        type: "product",
        children: [],
        id: prod.id,
        discount: undefined,
      }

      // Attach variants to product from the separate productVariants array
      const productVariants = this.productVariants.filter((v: any) => v.productId === prod.id)
      if (productVariants.length > 0) {
        prodNode.children = productVariants.map((v: any) => ({
          name: this.getVariantDisplayName(v),
          type: "variant" as const,
          attributes: v.attributes,
          imageUrls: v.imageUrls,
          id: v.id,
          discount: undefined,
          children: [],
        }))
      }

      const catNode = categoryMap.get(prod.categoryId)
      if (catNode) {
        catNode.children = catNode.children || []
        catNode.children.push(prodNode)
      }
    })

    // Build the root categories
    this.cascadeRoot = this.categories
      .filter((cat) => cat.parent_category_id == null)
      .map((cat) => categoryMap.get(cat.id)!)
      .filter((node) => node)

    // Attach sub-categories
    this.categories.forEach((cat) => {
      if (cat.parent_category_id != null) {
        const parent = categoryMap.get(cat.parent_category_id)
        if (parent) {
          parent.children = parent.children || []
          const childNode = categoryMap.get(cat.id)
          if (childNode) {
            parent.children.push(childNode)
          }
        }
      }
    })

    // Ensure all nodes have children arrays
    const ensureChildrenArray = (node: CascadeNode) => {
      if (!node.children) node.children = []
      node.children.forEach(ensureChildrenArray)
    }
    this.cascadeRoot.forEach(ensureChildrenArray)
  }

  getVariantDisplayName(variant: any): string {
    if (variant.attributes) {
      return Object.values(variant.attributes).join(", ")
    }
    return variant.name || "Variant"
  }

  get cascadeLevels(): CascadeNode[][] {
    const levels: CascadeNode[][] = []
    let currentLevel: CascadeNode[] = this.cascadeRoot || []

    // Always show the first level
    if (currentLevel.length) levels.push(currentLevel)

    // Use hover path if available, otherwise cascade path
    const path = this.cascadeHoverPath.length ? this.cascadeHoverPath : this.cascadePath

    // Build subsequent levels based on the path
    for (let i = 0; i < path.length; i++) {
      const node = path[i]
      if (node && node.children && node.children.length) {
        levels.push(node.children)
      }
    }

    return levels
  }

  getColumnHeader(colIdx: number): string {
    const headers = ["Categories", "Subcategories", "Sub-subcategories", "Products", "Product Variants"]
    return headers[colIdx] || `Level ${colIdx + 1}`
  }

  // Rule Management Methods
  addNewRule() {
    const newRule: DiscountRule = {
      id: Date.now().toString(),
      targetType: "category",
      selectedPath: [],
      discountPercent: null,
      targetLevel: "category",
    }

    this.newEvent.rules.push(newRule)
    this.currentRuleIndex = this.newEvent.rules.length - 1
    this.builderType = "category"
    this.showRuleBuilder = true
    this.resetCascadeState()
  }

  removeRule(i: number) {
    this.newEvent.rules.splice(i, 1);
    if (this.currentRuleIndex === i) {
      this.showRuleBuilder = false;
      this.resetCascadeState();
      this.currentRuleIndex = null;
    } else if (this.currentRuleIndex && this.currentRuleIndex > i) {
      this.currentRuleIndex--;
    }
  }

  editRule(index: number) {
    this.currentRuleIndex = index
    const rule = this.newEvent.rules[index]
    this.builderType = rule.targetType
    this.showRuleBuilder = true
    this.cascadePath = rule.selectedPath || []
    this.cascadeHoverPath = []
  }

  updateRuleType(index: number, type: "category" | "product" | "brand") {
    const rule = this.newEvent.rules[index];
    rule.targetType = type;
    rule.selectedPath = [];
    rule.targetLevel = type;
    if (this.currentRuleIndex === index) {
      this.builderType = type;
      this.selectedProduct = null;
      this.selectedBrand = null;
      this.cascadePath = [];
      this.cascadeHoverPath = [];
    }
  }

  get currentRule(): DiscountRule | null {
    return this.currentRuleIndex !== null ? this.newEvent.rules[this.currentRuleIndex] : null
  }

  // Cascade Navigation Methods
  onCascadeHover(level: number, node: CascadeNode) {
    this.cascadeHoverPath = this.cascadePath.slice(0, level)
    this.cascadeHoverPath[level] = node

    if (node.type === "product") {
      this.selectedProduct = node
    }
  }

  onCascadeMouseLeave(level: number) {
    this.cascadeHoverPath = []
    
    // Keep selected product from stable path
    const stableProduct = this.cascadePath.find((n) => n && n.type === "product")
    if (stableProduct) {
      this.selectedProduct = stableProduct
    } else {
      this.selectedProduct = null
    }
  }

  onCascadeClick(level: number, node: CascadeNode) {
    this.cascadePath = this.cascadePath.slice(0, level)
    this.cascadePath[level] = node
    this.cascadeHoverPath = []

    if (node.type === "product") {
      this.selectedProduct = node
    }
  }

  isCascadeSelected(level: number, node: CascadeNode): boolean {
    return this.cascadePath[level] === node
  }

  isCascadeInPath(level: number, node: CascadeNode): boolean {
    return this.cascadePath[level] === node
  }

  isNodeHovered(level: number, node: CascadeNode): boolean {
    return this.cascadeHoverPath[level] === node
  }

  hasChildren(node: CascadeNode): boolean {
    return !!(node.children && node.children.length > 0)
  }

  // Selection Application Methods
  applySelectionToRule(level: number, node: CascadeNode) {
    if (this.currentRuleIndex === null) return;
    const pathToNode = [...this.cascadePath.slice(0, level), node];
    const rule = this.newEvent.rules[this.currentRuleIndex];
    rule.selectedPath = pathToNode;
    rule.targetLevel = node.type;
    // Set correct ID fields for backend
    rule.categoryId = node.type === 'category' ? node.id : null;
    rule.productId = node.type === 'product' ? node.id : null;
    rule.productVariantId = node.type === 'variant' ? node.id : null;
    rule.brandId = null;
  }

  applyProductSelection(product: CascadeNode) {
    if (this.currentRuleIndex === null) return;
    const rule = this.newEvent.rules[this.currentRuleIndex];
    rule.selectedPath = [product];
    rule.targetLevel = 'product';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = product.id;
    rule.productVariantId = null;
    rule.brandId = null;
    // Automatically expand the product to show variants
    this.expandedProductIds.add(product.id as number);
    this.resetCascadeState();
  }

  applyVariantSelection(variant: CascadeNode) {
    if (this.currentRuleIndex === null || !this.currentRule) {
      return;
    }
    // Find the parent product for this variant
    const parentProduct = this.products.find(p => Array.isArray(p.variants) && p.variants.some((v: any) => v.id === variant.id));
    if (!parentProduct) {
      return;
    }
    // Update the rule's selectedPath to include both product and variant
    const rule = this.newEvent.rules[this.currentRuleIndex];
    rule.selectedPath = [parentProduct, variant];
    rule.targetLevel = 'variant';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = parentProduct.id;
    rule.productVariantId = variant.id;
    rule.brandId = null;
    this.resetCascadeState();
    this.showToastMessage('Variant selected for discount rule!');
  }

  applyBrandSelection(brand: Brand) {
    if (this.currentRuleIndex === null) return;
    const rule = this.newEvent.rules[this.currentRuleIndex];
    rule.selectedPath = [brand as any];
    rule.targetLevel = 'brand';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = null;
    rule.productVariantId = null;
    rule.brandId = brand.id;
    this.resetCascadeState();
  }

  confirmTargetSelection(index: number) {
    if (this.currentRuleIndex !== index) return;
    if (this.builderType === 'product' && this.selectedProduct) {
      this.applyProductSelection(this.selectedProduct);
    } else if (this.builderType === 'brand' && this.selectedBrand) {
      this.applyBrandSelection(this.selectedBrand);
    } else if (this.builderType === 'category' && this.cascadePath.length > 0) {
      this.applySelectionToRule(this.cascadePath.length - 1, this.cascadePath[this.cascadePath.length - 1]);
      this.showRuleBuilder = false;
      this.resetCascadeState();
    }
  }

  cancelTargetSelection(index: number) {
    if (this.currentRuleIndex !== index) return;
    this.showRuleBuilder = false;
    this.resetCascadeState();
  }

  // Product and Brand Selection
  onProductSelect(product: CascadeNode) {
    this.selectedProduct = product
  }

  onBrandSelect(brand: Brand) {
    this.selectedBrand = brand
  }

  // Helper Methods
  getProductNameByVariant(variant: any): string {
    const product = this.products.find(p => Array.isArray(p.variants) && p.variants.some((v: any) => v.id === variant.id));
    return product ? product.name : '';
  }

  getProductVariants(node: CascadeNode): CascadeNode[] {
    return (node.children || []).filter((child) => child.type === "variant")
  }

  getVariantAttributes(variant: CascadeNode): Array<{ key: string; value: string }> {
    if (!variant.attributes) return []
    return Object.entries(variant.attributes).map(([key, value]) => ({ key, value }))
  }

  getPathDisplay(path: CascadeNode[]): string {
    return path.map((node) => node.name).join(" → ")
  }

  resetCascadeState() {
    this.cascadePath = []
    this.cascadeHoverPath = []
    this.selectedProduct = null
    this.selectedBrand = null
  }

  // Event Management Methods
  createEvent() {
    // Clear previous errors
    this.clearFormErrors();
    this.createFormGeneralError = '';
    // Validate form fields
    if (!this.validateCreateForm()) {
      // If there is a general error, show it as a toast and above the form
      if (this.createFormGeneralError) {
        this.showToastMessage(this.createFormGeneralError);
      }
      return;
    }

    const eventPayload = {
      name: this.newEvent.name,
      startDate: this.newEvent.startDate,
      endDate: this.newEvent.endDate,
      rules: this.newEvent.rules,
      adminId: 1,
    }

    this.eventService.createEvent(eventPayload).subscribe({
      next: () => {
        this.showCreateModal = false
        this.newEvent = { name: "", startDate: "", endDate: "", rules: [] }
        this.currentRuleIndex = null
        this.showRuleBuilder = false
        this.resetCascadeState()
        this.fetchEvents()
        this.showToastMessage("Discount event created successfully!")
      },
      error: (err) => {
        this.handleCreateEventError(err);
      },
    })
  }

  private handleCreateEventError(err: any) {
    const errorMessage = err?.error || err?.message || "Unknown error";
    
    // Handle specific hierarchy validation error
    if (errorMessage.includes("Cannot create product discount when category or variant discounts exist")) {
      this.showToastMessage("⚠️ Discount Conflict: Cannot create product-level discount when category or variant discounts already exist for the same product. Please remove conflicting discounts first.");
    } else if (errorMessage.includes("Cannot create variant discount when category or product discounts exist")) {
      this.showToastMessage("⚠️ Discount Conflict: Cannot create variant-level discount when category or product discounts already exist for the same product. Please remove conflicting discounts first.");
    } else if (errorMessage.includes("Cannot create category discount when product or variant discounts exist")) {
      this.showToastMessage("⚠️ Discount Conflict: Cannot create category-level discount when product or variant discounts already exist for products in this category. Please remove conflicting discounts first.");
    } else if (errorMessage.includes("discount hierarchy")) {
      this.showToastMessage("⚠️ Discount Hierarchy Error: Please ensure your discount rules follow the hierarchy (Category → Product → Variant). Remove any conflicting discounts.");
    } else {
      // Generic error handling
      this.showToastMessage("❌ Failed to create event: " + errorMessage);
    }
  }

  // Form validation methods
  validateCreateForm(): boolean {
    let isValid = true;
    let generalErrors: string[] = [];

    // Validate event name
    if (!this.newEvent.name || this.newEvent.name.trim() === '') {
      this.nameError = 'Event name is required';
      generalErrors.push('Event name is required');
      isValid = false;
    } else if (this.newEvent.name.trim().length < 3) {
      this.nameError = 'Event name must be at least 3 characters long';
      generalErrors.push('Event name must be at least 3 characters long');
      isValid = false;
    }

    // Validate start date
    if (!this.newEvent.startDate) {
      this.startDateError = 'Start date is required';
      generalErrors.push('Start date is required');
      isValid = false;
    } else {
      const startDate = new Date(this.newEvent.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        this.startDateError = 'Start date cannot be in the past';
        generalErrors.push('Start date cannot be in the past');
        isValid = false;
      }
    }

    // Validate end date
    if (!this.newEvent.endDate) {
      this.endDateError = 'End date is required';
      generalErrors.push('End date is required');
      isValid = false;
    } else if (this.newEvent.startDate && this.newEvent.endDate) {
      const startDate = new Date(this.newEvent.startDate);
      const endDate = new Date(this.newEvent.endDate);
      if (endDate <= startDate) {
        this.endDateError = 'End date must be after start date';
        generalErrors.push('End date must be after start date');
        isValid = false;
      }
    }

    // Validate at least one rule
    if (!this.newEvent.rules || this.newEvent.rules.length === 0) {
      generalErrors.push('At least one discount rule is required');
      isValid = false;
    } else {
      // Validate each rule
      this.newEvent.rules.forEach((rule: any, idx: number) => {
        if (!rule.selectedPath || rule.selectedPath.length === 0) {
          generalErrors.push(`Rule ${idx + 1}: Target is required`);
          isValid = false;
        }
        if (rule.discountPercent == null || rule.discountPercent === '' || isNaN(rule.discountPercent)) {
          generalErrors.push(`Rule ${idx + 1}: Discount percent is required`);
          isValid = false;
        } else if (rule.discountPercent < 1 || rule.discountPercent > 100) {
          generalErrors.push(`Rule ${idx + 1}: Discount percent must be between 1 and 100`);
          isValid = false;
        }
      });
    }

    if (generalErrors.length > 0) {
      this.createFormGeneralError = generalErrors.join('. ') + '.';
    } else {
      this.createFormGeneralError = '';
    }
    return isValid;
  }

  clearFormErrors() {
    this.nameError = '';
    this.startDateError = '';
    this.endDateError = '';
    this.createFormGeneralError = '';
  }

  openEditModal(event: any) {
    this.editEvent = {
      ...event,
      rules: (event.rules || []).map((rule: any) => {
        let targetType = '';
        let selectedPath: any[] = [];
        let expandedProductId = null;
        let editVariantId = null;
        if (rule.categoryId) {
          targetType = 'category';
          const cat = this.categories.find((c) => c.id === rule.categoryId);
          if (cat) selectedPath = [{ name: cat.name, id: cat.id, type: 'category' }];
        } else if (rule.productId) {
          targetType = 'product';
          const prod = this.products.find((p) => p.id === rule.productId);
          if (prod) selectedPath = [{ name: prod.name, id: prod.id, type: 'product' }];
        } else if (rule.productVariantId) {
          targetType = 'product';
          const variant = this.productVariants.find((v) => v.id === rule.productVariantId);
          if (variant) {
            const prod = this.products.find((p) => p.id === variant.productId);
            if (prod) {
              selectedPath = [
                { name: prod.name, id: prod.id, type: 'product' },
                { name: variant.name || '', id: variant.id, type: 'variant', attributes: variant.attributes }
              ];
              expandedProductId = prod.id;
              editVariantId = variant.id;
            } else {
              selectedPath = [
                { name: variant.name || '', id: variant.id, type: 'variant', attributes: variant.attributes }
              ];
              editVariantId = variant.id;
            }
          }
        } else if (rule.brandId) {
          targetType = 'brand';
          const brand = this.brands.find((b) => b.id === rule.brandId);
          if (brand) selectedPath = [{ name: brand.name, id: brand.id, type: 'brand' }];
        }
        return {
          ...rule,
          targetType,
          selectedPath,
          expandedProductId,
          editVariantId
        };
      }),
    };
    this.showEditModal = true;
    // Do NOT set showEditRuleBuilder, builderType, expandedProductId, or editVariantId here
    this.showEditRuleBuilder = false;
    this.builderType = 'category';
    this.expandedProductIds.clear();
    this.editVariantId = null;
    this.currentEditRuleIndex = null;
    this.cascadePath = [];
    this.cascadeHoverPath = [];
    this.updateCurrentEditEventDiscountedIds(); // Use new helper
  }

  addEditRule() {
    if (!this.editEvent.rules) {
      this.editEvent.rules = []
    }
    const newRule: DiscountRule = {
      id: Date.now().toString(),
      targetType: "category",
      selectedPath: [],
      discountPercent: null,
      targetLevel: "category",
    }
    this.editEvent.rules.push(newRule)
    this.updateCurrentEditEventDiscountedIds();
  }

  removeEditRule(index: number) {
    if (this.editEvent && this.editEvent.rules) {
      this.editEvent.rules.splice(index, 1)
    }
  }

  updateEvent() {
    if (!this.editEvent || !this.editEvent.id) return

    // Clear previous errors
    this.clearEditFormErrors();
    
    // Validate form fields
    if (!this.validateEditForm()) {
      return;
    }

this.eventService.updateEvent(this.editEvent.id, this.editEvent).subscribe({
  next: () => {
    this.showEditModal = false;
    this.editEvent = null;
    this.fetchEvents();

    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Discount event updated successfully!',
      timer: 2000,
      showConfirmButton: false
    });
  },
  error: (err) => {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: err?.error?.message || 'Something went wrong while updating the event.'
    });

    // Optional: If you still want to handle errors with your method
    this.handleUpdateEventError(err);
  }
});

  }

  private handleUpdateEventError(err: any) {
    const errorMessage = err?.error || err?.message || "Unknown error";
    
    // Handle specific hierarchy validation error
    if (errorMessage.includes("Cannot create product discount when category or variant discounts exist")) {
      this.showToastMessage("⚠️ Discount Conflict: Cannot create product-level discount when category or variant discounts already exist for the same product. Please remove conflicting discounts first.");
    } else if (errorMessage.includes("Cannot create variant discount when category or product discounts exist")) {
      this.showToastMessage("⚠️ Discount Conflict: Cannot create variant-level discount when category or product discounts already exist for the same product. Please remove conflicting discounts first.");
    } else if (errorMessage.includes("Cannot create category discount when product or variant discounts exist")) {
      this.showToastMessage("⚠️ Discount Conflict: Cannot create category-level discount when product or variant discounts already exist for products in this category. Please remove conflicting discounts first.");
    } else if (errorMessage.includes("discount hierarchy")) {
      this.showToastMessage("⚠️ Discount Hierarchy Error: Please ensure your discount rules follow the hierarchy (Category → Product → Variant). Remove any conflicting discounts.");
    } else {
      // Generic error handling
      this.showToastMessage("❌ Failed to update event: " + errorMessage);
    }
  }

  // Edit form validation methods
  validateEditForm(): boolean {
    let isValid = true;

    // Validate event name
    if (!this.editEvent.name || this.editEvent.name.trim() === '') {
      this.editNameError = 'Event name is required';
      isValid = false;
    } else if (this.editEvent.name.trim().length < 3) {
      this.editNameError = 'Event name must be at least 3 characters long';
      isValid = false;
    }

    // Validate start date (no past date restriction for editing)
    if (!this.editEvent.startDate) {
      this.editStartDateError = 'Start date is required';
      isValid = false;
    }

    // Validate end date
    if (!this.editEvent.endDate) {
      this.editEndDateError = 'End date is required';
      isValid = false;
    } else if (this.editEvent.startDate && this.editEvent.endDate) {
      const startDate = new Date(this.editEvent.startDate);
      const endDate = new Date(this.editEvent.endDate);
      if (endDate <= startDate) {
        this.editEndDateError = 'End date must be after start date';
        isValid = false;
      }
    }

    return isValid;
  }

  clearEditFormErrors() {
    this.editNameError = '';
    this.editStartDateError = '';
    this.editEndDateError = '';
  }
deleteEvent(eventId: number) {
  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you really want to delete this event?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.eventService.deleteEvent(eventId).subscribe(() => {
        this.fetchEvents();
        Swal.fire('Deleted!', 'The event has been deleted.', 'success');
      });
    }
  });
}
  viewHistory(eventId: number) {
    this.eventService.getEventHistory(eventId).subscribe((history) => {
      this.eventHistory = history
      this.showHistoryModal = true
    })
  }

  closeEditModal() {
    this.showEditModal = false
    this.editEvent = null
  }

  closeHistoryModal() {
    this.showHistoryModal = false
    this.eventHistory = []
  }

  getRuleType(rule: any): string {
    if (rule.categoryId) return "category";
    if (rule.productId) return "product";
    if (rule.productVariantId) return "productVariant";
    if (rule.brandId) return "brand";
    if (rule.targetType) return rule.targetType;
    return "unknown";
  }

  getRulePath(rule: any): string {
    if (rule.selectedPath && rule.selectedPath.length > 0) {
      return this.getPathDisplay(rule.selectedPath)
    }
    
    if (rule.categoryId) {
      const category = this.categories.find((c) => c.id === rule.categoryId)
      return category ? `Category: ${category.name}` : "Category: Unknown"
    }

    if (rule.productId) {
      const product = this.products.find((p) => p.id === rule.productId)
      return product ? `Product: ${product.name}` : "Product: Unknown"
    }

    if (rule.productVariantId) {
      const variant = this.productVariants.find((v) => v.id === rule.productVariantId)
      if (variant) {
        const prod = this.products.find((p) => p.id === variant.productId);
        let details = '';
        if (variant.attributes) {
          details = Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return prod ? `${prod.name}${details ? ' - ' + details : ''}` : (details || variant.name || '');
      }
      return '';
    }

    if (rule.brandId) {
      const brand = this.brands.find((b) => b.id === rule.brandId)
      return brand ? `Brand: ${brand.name}` : "Brand: Unknown"
    }

    return "No target selected"
  }

  getHistoryDiffs(h: any): string[] {
    const diffs: string[] = [];
    try {
      const oldVals = h.oldValues ? JSON.parse(h.oldValues) : {};
      const newVals = h.newValues ? JSON.parse(h.newValues) : {};

      // Order fields: Start Date, End Date, Name
      const fieldOrder = ['startDate', 'endDate', 'name'];
      fieldOrder.forEach((key) => {
        if (JSON.stringify(oldVals[key]) !== JSON.stringify(newVals[key])) {
          let oldVal = oldVals[key];
          let newVal = newVals[key];
          if (oldVal === undefined || oldVal === null || oldVal === "undefined") oldVal = '';
          if (newVal === undefined || newVal === null || newVal === "undefined") newVal = '';
          if (oldVal !== newVal) {
            diffs.push(`${this.formatFieldName(key)}: ${oldVal} → ${newVal}`);
          }
        }
      });

      // Discount Rules
      const oldRules = Array.isArray(oldVals['rules']) ? oldVals['rules'] : [];
      const newRules = Array.isArray(newVals['rules']) ? newVals['rules'] : [];
      if (!oldRules.length && newRules.length) {
        // CREATED: Just list the initial rules
        diffs.push('Discount Rules:');
        newRules.forEach(rule => {
          diffs.push('  • ' + this.formatRuleLevel(rule) + (this.getRuleTargetName(rule) ? ': ' + this.getRuleTargetName(rule) : '') + ` — ${rule.discountPercent != null ? rule.discountPercent + '%' : ''} discount`);
        });
      } else if (JSON.stringify(oldRules) !== JSON.stringify(newRules)) {
        // UPDATED: Only show changed rules
        const changedRules = this.getChangedRulesDetailed(oldRules, newRules);
        if (changedRules.length > 0) {
          diffs.push('Discount Rules:');
          changedRules.forEach(line => diffs.push('  • ' + line));
        }
      }
    } catch (e) {
      if (h.oldValues) diffs.push("Old: " + h.oldValues);
      if (h.newValues) diffs.push("New: " + h.newValues);
    }
    return diffs.length ? diffs : ["No changes"];
  }

  private getChangedRulesDetailed(oldRules: any[], newRules: any[]): string[] {
    const changes: string[] = [];
    const ruleKey = (rule: any) => {
      if (rule.categoryId) return `category:${rule.categoryId}`;
      if (rule.productId) return `product:${rule.productId}`;
      if (rule.productVariantId) return `productVariant:${rule.productVariantId}`;
      if (rule.brandId) return `brand:${rule.brandId}`;
      return '';
    };

    const oldMap = new Map<string, any>();
    oldRules.forEach(rule => {
      const key = ruleKey(rule);
      if (key) oldMap.set(key, rule);
    });
    const newMap = new Map<string, any>();
    newRules.forEach(rule => {
      const key = ruleKey(rule);
      if (key) newMap.set(key, rule);
    });

    // Check for removed rules
    oldMap.forEach((oldRule, key) => {
      if (!newMap.has(key)) {
        let target = this.getRuleTargetName(oldRule);
        changes.push(`Removed: ${this.formatRuleLevel(oldRule)}${target ? ': ' + target : ''} — ${oldRule.discountPercent != null ? oldRule.discountPercent + '%' : ''} discount`);
      }
    });

    // Check for added rules
    newMap.forEach((newRule, key) => {
      if (!oldMap.has(key)) {
        let target = this.getRuleTargetName(newRule);
        changes.push(`Added: ${this.formatRuleLevel(newRule)}${target ? ': ' + target : ''} — ${newRule.discountPercent != null ? newRule.discountPercent + '%' : ''} discount`);
      }
    });

    // Check for changed discount percentages
    oldMap.forEach((oldRule, key) => {
      if (newMap.has(key)) {
        const newRule = newMap.get(key);
        if (oldRule.discountPercent !== newRule.discountPercent) {
          let target = this.getRuleTargetName(oldRule);
          changes.push(`Updated: ${this.formatRuleLevel(oldRule)}${target ? ': ' + target : ''} — ${oldRule.discountPercent}% → ${newRule.discountPercent}% discount`);
        }
      }
    });

    return changes;
  }

  private isStrictlySameRuleTarget(ruleA: any, ruleB: any): boolean {
    if (!ruleA || !ruleB) return false;
    const typeA = this.getRuleTypeKey(ruleA);
    const typeB = this.getRuleTypeKey(ruleB);
    if (typeA !== typeB) return false;
    switch (typeA) {
      case 'category':
        return ruleA.categoryId === ruleB.categoryId;
      case 'product':
        return ruleA.productId === ruleB.productId;
      case 'productVariant':
        return ruleA.productVariantId === ruleB.productVariantId;
      case 'brand':
        return ruleA.brandId === ruleB.brandId;
      default:
        return false;
    }
  }

  private getRuleTypeKey(rule: any): string {
    if (rule.categoryId) return 'category';
    if (rule.productId) return 'product';
    if (rule.productVariantId) return 'productVariant';
    if (rule.brandId) return 'brand';
    return '';
  }

  get isCascadeLoading(): boolean {
    return !this.categories.length || !this.products.length
  }

  confirmRule(i: number) {
    if (this.currentRuleIndex !== i) return;
    this.showRuleBuilder = false;
    this.resetCascadeState();
  }

  filterCategoryNodes(nodes: CascadeNode[]): CascadeNode[] {
    return nodes.filter(node => node.type === 'category');
  }

  onEditRuleTypeChange(index: number, type: 'category' | 'product' | 'brand') {
    const rule = this.editEvent.rules[index];
    rule.targetType = type;
    rule.selectedPath = [];
    rule.targetLevel = type;
    // Reset ID fields when changing rule type
    rule.categoryId = null;
    rule.productId = null;
    rule.productVariantId = null;
    rule.brandId = null;
    this.currentEditRuleIndex = index;
    this.showEditRuleBuilder = true;
    this.builderType = type;
    this.selectedProduct = null;
    this.selectedBrand = null;
    this.cascadePath = [];
    this.cascadeHoverPath = [];
    // For product-variant, auto-expand product and highlight variant
    if (type === 'product' && rule.productVariantId) {
      const variant = this.productVariants.find((v) => v.id === rule.productVariantId);
      if (variant) {
        const prod = this.products.find((p) => p.id === variant.productId);
        if (prod) {
          this.expandedProductIds.clear();
          this.expandedProductIds.add(prod.id);
          this.editVariantId = variant.id;
        }
      }
    } else {
      this.expandedProductIds.clear();
      this.editVariantId = null;
    }
  }

  // Edit Event Rule Selection Methods
  applyEditSelectionToRule(level: number, node: CascadeNode) {
    if (this.currentEditRuleIndex === null) return;
    const pathToNode = [...this.cascadePath.slice(0, level), node];
    const rule = this.editEvent.rules[this.currentEditRuleIndex];
    rule.selectedPath = pathToNode;
    rule.targetLevel = node.type;
    // Set correct ID fields for backend
    rule.categoryId = node.type === 'category' ? node.id : null;
    rule.productId = node.type === 'product' ? node.id : null;
    rule.productVariantId = node.type === 'variant' ? node.id : null;
    rule.brandId = null;
  }

  applyEditCategorySelection(category: any) {
    if (this.currentEditRuleIndex === null) return;
    const rule = this.editEvent.rules[this.currentEditRuleIndex];
    rule.selectedPath = [category];
    rule.targetLevel = 'category';
    // Set correct ID fields for backend
    rule.categoryId = category.id;
    rule.productId = null;
    rule.productVariantId = null;
    rule.brandId = null;
    this.showEditRuleBuilder = false;
    this.resetCascadeState();
  }

  applyEditProductSelection(product: CascadeNode) {
    if (this.currentEditRuleIndex === null) return;
    this.selectedProduct = product;
    const rule = this.editEvent.rules[this.currentEditRuleIndex];
    rule.selectedPath = [product];
    rule.targetLevel = 'product';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = product.id;
    rule.productVariantId = null;
    rule.brandId = null;
  }

  applyEditVariantSelection(variant: CascadeNode) {
    if (this.currentEditRuleIndex === null || !this.selectedProduct) return;
    const rule = this.editEvent.rules[this.currentEditRuleIndex];
    rule.selectedPath = [this.selectedProduct, variant];
    rule.targetLevel = 'variant';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = null;
    rule.productVariantId = variant.id;
    rule.brandId = null;
  }

  applyEditBrandSelection(brand: Brand) {
    if (this.currentEditRuleIndex === null) return;
    this.selectedBrand = brand;
    const rule = this.editEvent.rules[this.currentEditRuleIndex];
    rule.selectedPath = [brand as any];
    rule.targetLevel = 'brand';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = null;
    rule.productVariantId = null;
    rule.brandId = brand.id;
  }

  confirmEditTargetSelection(index: number) {
    if (this.currentEditRuleIndex !== index) return;
    if (this.builderType === 'product' && this.selectedProduct) {
      this.applyEditProductSelection(this.selectedProduct);
      this.showEditRuleBuilder = false;
      this.resetCascadeState();
    } else if (this.builderType === 'brand' && this.selectedBrand) {
      this.applyEditBrandSelection(this.selectedBrand);
      this.showEditRuleBuilder = false;
      this.resetCascadeState();
    } else if (this.builderType === 'category' && this.cascadePath.length > 0) {
      this.applyEditSelectionToRule(this.cascadePath.length - 1, this.cascadePath[this.cascadePath.length - 1]);
      this.showEditRuleBuilder = false;
      this.resetCascadeState();
    }
  }

  cancelEditTargetSelection(index: number) {
    if (this.currentEditRuleIndex !== index) return;
    this.showEditRuleBuilder = false;
    this.resetCascadeState();
  }

  private formatFieldName(key: string): string {
    // Make field names more readable
    if (key === 'startDate') return 'Start Date';
    if (key === 'endDate') return 'End Date';
    if (key === 'name') return 'Event Name';
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  private formatRuleLevel(rule: any): string {
    if (rule.type === 'productVariant' || rule.targetType === 'productVariant') {
      return 'Product-variant';
    }
    if (rule.type) {
      // Capitalize and add spaces for better readability
      return rule.type.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()).trim();
    }
    if (rule.targetType) {
      return rule.targetType.charAt(0).toUpperCase() + rule.targetType.slice(1);
    }
    return 'Rule';
  }

  getRuleTargetName(rule: any): string {
    if (rule.categoryId) {
      const category = this.categories.find((c) => c.id === rule.categoryId);
      return category ? category.name : '';
    }
    if (rule.productId) {
      const product = this.products.find((p) => p.id === rule.productId);
      return product ? product.name : '';
    }
    if (rule.productVariantId) {
      const variant = this.productVariants.find((v) => v.id === rule.productVariantId);
      if (variant) {
        const prod = this.products.find((p) => p.id === variant.productId);
        let details = '';
        if (variant.attributes) {
          details = Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ');
        }
        return prod ? `${prod.name}${details ? ' - ' + details : ''}` : (details || variant.name || '');
      }
      return '';
    }
    if (rule.brandId) {
      const brand = this.brands.find((b) => b.id === rule.brandId);
      return brand ? brand.name : '';
    }
    return '';
  }

  private isSameRuleType(ruleA: any, ruleB: any): boolean {
    // Only match on type (not target)
    if (!ruleA || !ruleB) return false;
    return (ruleA.type || ruleA.targetType) === (ruleB.type || ruleB.targetType);
  }

  // Add: Open the picker/configure box for a rule in the edit modal when the type dropdown is clicked
  openEditRuleBuilder(index: number) {
    this.currentEditRuleIndex = index;
    this.showEditRuleBuilder = true;
    const rule = this.editEvent.rules[index];
    this.builderType = rule.targetType;
    this.cascadePath = rule.selectedPath || [];
    this.cascadeHoverPath = [];
    if (rule.productVariantId) {
      const variant = this.productVariants.find((v) => v.id === rule.productVariantId);
      if (variant) {
        const prod = this.products.find((p) => p.id === variant.productId);
        if (prod) {
          this.expandedProductIds.clear();
          this.expandedProductIds.add(prod.id);
          this.editVariantId = variant.id;
          this.selectedProduct = prod;
          if (!this.expandedProductIds.has(prod.id)) {
            this.expandedProductIds.add(prod.id);
          }
        }
      }
    } else {
      this.expandedProductIds.clear();
      this.editVariantId = null;
      this.selectedProduct = null;
    }
    // Clear edit selections
    this.editSelectedProducts = [];
    this.editSelectedVariants = [];
    this.editSelectedBrands = [];
    this.editSelectedCategories = [];
  }

  // Add: Clear the selected target for a rule in edit modal
  clearEditRuleTarget(index: number) {
    const rule = this.editEvent.rules[index];
    rule.selectedPath = [];
    rule.categoryId = null;
    rule.productId = null;
    rule.productVariantId = null;
    rule.brandId = null;
    rule.targetLevel = rule.targetType;
    this.currentEditRuleIndex = index;
    this.showEditRuleBuilder = true;
    this.cascadePath = [];
    this.cascadeHoverPath = [];
  }

  get selectedProductBreadcrumb(): string[] | null {
    const id = this.selectedProduct?.id;
    if (id && this.productBreadcrumbs[id]) {
      return this.productBreadcrumbs[id];
    }
    return null;
  }

  get lastLevelSubCategories() {
    return this.categories.filter(cat => cat.subcategoryCount === 0 && cat.productCount > 0);
  }

  get filteredSubCategories() {
    if (!this.subCategorySearchTerm) return this.lastLevelSubCategories;
    const term = this.subCategorySearchTerm.toLowerCase();
    return this.lastLevelSubCategories.filter(cat => cat.name.toLowerCase().includes(term));
  }

  get filteredProductsForSelectedSubCategory() {
    if (!this.selectedSubCategory) return [];
    let products = this.products.filter(p => p.categoryId == this.selectedSubCategory.id);
    if (this.productListSearchTerm) {
      const term = this.productListSearchTerm.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(term));
    }
    return products;
  }

  onSelectSubCategory(subCat: any) {
    this.selectedSubCategory = subCat;
    this.selectedProductForVariants = null;
    this.productListSearchTerm = '';
  }

  onSelectProductForVariants(product: any) {
    this.expandedProductIds.clear();
    this.expandedProductIds.add(product.id);
    this.selectedProduct = product;
  }

  clearProductVariantSelection() {
    this.selectedProductForVariant = null;
  }

  clearSubCategorySelection() {
    this.selectedSubCategory = null;
    this.selectedProductForVariants = null;
    this.productListSearchTerm = '';
  }

  // Generalized multi-select helpers
  isSelected(item: any, type: 'variant' | 'product' | 'category' | 'brand'): boolean {
    switch (type) {
      case 'variant': return this.selectedVariants.some(v => v.id === item.id);
      case 'product': return this.selectedProducts.some(p => p.id === item.id);
      case 'category': return this.selectedCategories.some(c => c.id === item.id);
      case 'brand': return this.selectedBrands.some(b => b.id === item.id);
    }
  }

  toggleSelection(item: any, type: 'variant' | 'product' | 'category' | 'brand') {
    switch (type) {
      case 'variant':
        if (this.isSelected(item, 'variant')) {
          this.selectedVariants = this.selectedVariants.filter(v => v.id !== item.id);
        } else {
          this.selectedVariants.push(item);
        }
        this.selectedCount = this.selectedVariants.length;
        break;
      case 'product':
        if (this.isSelected(item, 'product')) {
          this.selectedProducts = this.selectedProducts.filter(p => p.id !== item.id);
        } else {
          this.selectedProducts.push(item);
        }
        this.selectedCount = this.selectedProducts.length;
        break;
      case 'category':
        if (this.isSelected(item, 'category')) {
          this.selectedCategories = this.selectedCategories.filter(c => c.id !== item.id);
        } else {
          this.selectedCategories.push(item);
        }
        this.selectedCount = this.selectedCategories.length;
        break;
      case 'brand':
        if (this.isSelected(item, 'brand')) {
          this.selectedBrands = this.selectedBrands.filter(b => b.id !== item.id);
        } else {
          this.selectedBrands.push(item);
        }
        this.selectedCount = this.selectedBrands.length;
        break;
    }
  }

  selectAll(items: any[], type: 'variant' | 'product' | 'category' | 'brand') {
    switch (type) {
      case 'variant':
        if (this.selectedVariants.length === items.length) {
          this.selectedVariants = [];
        } else {
          this.selectedVariants = [...items];
        }
        this.selectedCount = this.selectedVariants.length;
        break;
      case 'product':
        if (this.selectedProducts.length === items.length) {
          this.selectedProducts = [];
        } else {
          this.selectedProducts = [...items];
        }
        this.selectedCount = this.selectedProducts.length;
        break;
      case 'category':
        if (this.selectedCategories.length === items.length) {
          this.selectedCategories = [];
        } else {
          this.selectedCategories = [...items];
        }
        this.selectedCount = this.selectedCategories.length;
        break;
      case 'brand':
        if (this.selectedBrands.length === items.length) {
          this.selectedBrands = [];
        } else {
          this.selectedBrands = [...items];
        }
        this.selectedCount = this.selectedBrands.length;
        break;
    }
  }

  clearSelection(type: 'variant' | 'product' | 'category' | 'brand') {
    switch (type) {
      case 'variant': this.selectedVariants = []; this.selectedCount = 0; break;
      case 'product': this.selectedProducts = []; this.selectedCount = 0; break;
      case 'category': this.selectedCategories = []; this.selectedCount = 0; break;
      case 'brand': this.selectedBrands = []; this.selectedCount = 0; break;
    }
  }

  // Toast/Confirmation
  showToastMessage(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    setTimeout(() => { this.showToast = false; }, 2500);
  }

  // Apply Discount to Selected (Generalized)
  applyDiscountToSelected(type: 'variant' | 'product' | 'category' | 'brand') {
    if (this.currentRuleIndex === null) return;
    const rule = this.newEvent.rules[this.currentRuleIndex];
    const discountPercent = rule.discountPercent;
    let count = 0;
    switch (type) {
      case 'variant': {
        if (!this.selectedProduct) {
          this.showToastMessage('No product selected for variants!');
          return;
        }
        if (this.selectedVariants.length > 0) {
          // Fix: handle empty rule
          const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
          this.selectedVariants.forEach((variant, idx) => {
            if (idx === 0 && !shouldRemoveCurrent && this.selectedProduct) {
              // Update the current rule
              rule.selectedPath = [this.selectedProduct, variant];
              rule.targetLevel = 'variant';
              rule.categoryId = null;
              rule.productId = null; // Don't set productId for variant-level discounts
              rule.productVariantId = variant.id;
              rule.brandId = null;
              rule.discountPercent = discountPercent;
            } else if (this.selectedProduct) {
              // Add new rules for the rest (or all if current is empty)
              this.newEvent.rules.push({
                id: Date.now().toString() + '-' + variant.id,
                targetType: 'product',
                selectedPath: [this.selectedProduct, variant],
                discountPercent: discountPercent,
                targetLevel: 'variant',
                categoryId: null,
                productId: null, // Don't set productId for variant-level discounts
                productVariantId: variant.id,
                brandId: null
              });
            }
            count++;
          });
          if (shouldRemoveCurrent) {
            this.newEvent.rules.splice(this.currentRuleIndex, 1);
            this.currentRuleIndex = null;
          }
          // Close the rule builder after applying
          this.showRuleBuilder = false;
          this.resetCascadeState();
        } else {
          this.showToastMessage('No variants selected!');
        }
        this.clearSelection('variant');
        // DO NOT close the product dropdown here!
        // this.showProductDropdown = false;
        break;
      }
      case 'product': {
        // Fix: handle empty rule
        const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
        let appliedProduct = false;
        this.selectedProducts.forEach((product, idx) => {
          if (idx === 0 && !shouldRemoveCurrent) {
            // Update the current rule
            rule.selectedPath = [product];
            rule.targetLevel = 'product';
            rule.categoryId = null;
            rule.productId = product.id;
            rule.productVariantId = null;
            rule.brandId = null;
            rule.discountPercent = discountPercent;
          } else {
            // Add new rules for the rest (or all if current is empty)
            this.newEvent.rules.push({
              id: Date.now().toString() + '-' + product.id,
              targetType: 'product',
              selectedPath: [product],
              discountPercent: discountPercent,
              targetLevel: 'product',
              categoryId: null,
              productId: product.id,
              productVariantId: null,
              brandId: null
            });
          }
          count++;
          appliedProduct = true;
        });
        // Also handle selectedVariants (from any product)
        this.selectedVariants.forEach((variant, idx) => {
          const product = this.products.find(p => Array.isArray(p.variants) && p.variants.some((v: any) => v.id === variant.id));
          this.newEvent.rules.push({
            id: Date.now().toString() + '-variant-' + variant.id,
            targetType: 'product',
            selectedPath: product ? [product, variant] : [variant],
            discountPercent: discountPercent,
            targetLevel: 'variant',
            categoryId: null,
            productId: null, // Don't set productId for variant-level discounts
            productVariantId: variant.id,
            brandId: null
          });
          count++;
        });
        if (shouldRemoveCurrent) {
          this.newEvent.rules.splice(this.currentRuleIndex, 1);
          this.currentRuleIndex = null;
        }
        this.clearSelection('product');
        this.clearSelection('variant');
        if (appliedProduct) {
          console.log('CLOSE: showProductDropdown = false (appliedProduct)');
          this.showProductDropdown = false;
        }
        break;
      }
      case 'category':
        if (this.selectedCategories.length > 0) {
          // If the current rule has no target, remove it after adding new rules
          const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
          this.selectedCategories.forEach((category, idx) => {
            if (idx === 0 && !shouldRemoveCurrent) {
              // Update the current rule
              rule.selectedPath = [category];
              rule.targetLevel = 'category';
              rule.categoryId = category.id;
              rule.productId = null;
              rule.productVariantId = null;
              rule.brandId = null;
              rule.discountPercent = discountPercent;
            } else {
              // Add new rules for the rest (or all if current is empty)
              this.newEvent.rules.push({
                id: Date.now().toString() + '-' + category.id,
                targetType: 'category',
                selectedPath: [category],
                discountPercent: discountPercent,
                targetLevel: 'category',
                categoryId: category.id,
                productId: null,
                productVariantId: null,
                brandId: null
              });
            }
            count++;
          });
          if (shouldRemoveCurrent) {
            this.newEvent.rules.splice(this.currentRuleIndex, 1);
            this.currentRuleIndex = null;
          }
        }
        this.clearSelection('category');
        break;
      case 'brand':
        if (this.selectedBrands.length > 0) {
          const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
          this.selectedBrands.forEach((brand, idx) => {
            if (idx === 0 && !shouldRemoveCurrent) {
              // Update the current rule
              rule.selectedPath = [brand];
              rule.targetLevel = 'brand';
              rule.categoryId = null;
              rule.productId = null;
              rule.productVariantId = null;
              rule.brandId = brand.id;
              rule.discountPercent = discountPercent;
            } else {
              // Add new rules for the rest (or all if current is empty)
              this.newEvent.rules.push({
                id: Date.now().toString() + '-' + brand.id,
                targetType: 'brand',
                selectedPath: [brand],
                discountPercent: discountPercent,
                targetLevel: 'brand',
                categoryId: null,
                productId: null,
                productVariantId: null,
                brandId: brand.id
              });
            }
            count++;
          });
          if (shouldRemoveCurrent) {
            this.newEvent.rules.splice(this.currentRuleIndex, 1);
            this.currentRuleIndex = null;
          }
        }
        this.clearSelection('brand');
        break;
    }
    if (count > 0) {
      this.showToastMessage(`Discount applied to ${count} ${type}${count > 1 ? 's' : ''}!`);
    }
  }

  isProductExpandedOrHasEditVariant(product: any): boolean {
    const isExpanded = this.expandedProductIds.has(product.id);
    const hasEditVariant = this.editVariantId && product.variants && product.variants.some((v: any) => v.id === this.editVariantId);
    return isExpanded || hasEditVariant;
  }

  toggleProductExpansion(productId: number) {
    const product = this.products.find(p => p.id === productId);
    if (this.expandedProductIds.has(productId)) {
      this.expandedProductIds.delete(productId);
      if (this.selectedProduct && this.selectedProduct.id === productId) {
        this.selectedProduct = null;
      }
    } else {
      this.expandedProductIds.add(productId);
      if (product) {
        this.selectedProduct = product;
      }
    }
  }

  // Add: Open the product variant modal
  openProductVariantModal(product: any) {
    this.selectedProductForVariant = product;
    this.selectedProduct = product; // Set the selected product for variant context (works for both create and edit)
    this.showProductVariantModal = true;
    this.openVariantProductId = product.id;
    // Do NOT clear previous variant selections when opening modal
    // this.clearSelection('variant');
  }

  // Add: Close the product variant modal and keep selectedVariants (for Add button)
  addSelectedVariantsAndCloseModal() {
    console.log('addSelectedVariantsAndCloseModal called');
    this.disableDocumentClick = true;
    // For edit modal: copy selectedVariants to editSelectedVariants
    if (this.showEditModal) {
      this.editSelectedVariants = [...this.selectedVariants];
    }
    this.showProductVariantModal = false;
    this.selectedProductForVariant = null;
    this.selectedProduct = null;
    this.openVariantProductId = null;
    if (this.cdr) this.cdr.detectChanges();
    setTimeout(() => { this.disableDocumentClick = false; }, 150);
  }

  // Add: Close the product variant modal and clear selectedVariants (for Cancel button)
  cancelVariantSelectionAndCloseModal() {
    console.log('cancelVariantSelectionAndCloseModal called');
    this.disableDocumentClick = true;
    this.showProductVariantModal = false;
    this.selectedProductForVariant = null;
    this.selectedProduct = null;
    this.openVariantProductId = null;
    this.clearSelection('variant');
    setTimeout(() => { this.disableDocumentClick = false; }, 150);
  }

  // Update: Only use this for cancel logic
  closeProductVariantModal() {
    this.cancelVariantSelectionAndCloseModal();
  }

  // Add: Apply a variant to the current rule
  applyVariantToRule(variant: any) {
    // Add to selectedVariants if not already present
    if (!this.selectedVariants.some(v => v.id === variant.id)) {
      this.selectedVariants.push(variant);
    }
    this.addSelectedVariantsAndCloseModal(); // Close modal, keep selection
    // Do not create rule here; user will use main Apply button
    this.showToastMessage('Variant added to selection!');
  }

  // Edit modal multi-select helpers
  isEditSelected(item: any, type: 'variant' | 'product' | 'brand' | 'category'): boolean {
    switch (type) {
      case 'variant': return this.editSelectedVariants.some(v => v.id === item.id);
      case 'product': return this.editSelectedProducts.some(p => p.id === item.id);
      case 'brand': return this.editSelectedBrands.some(b => b.id === item.id);
      case 'category': return this.editSelectedCategories.some(c => c.id === item.id);
    }
  }

  toggleEditSelection(item: any, type: 'variant' | 'product' | 'brand' | 'category') {
    switch (type) {
      case 'variant':
        if (this.isEditSelected(item, 'variant')) {
          this.editSelectedVariants = this.editSelectedVariants.filter(v => v.id !== item.id);
        } else {
          this.editSelectedVariants.push(item);
        }
        break;
      case 'product':
        if (this.isEditSelected(item, 'product')) {
          this.editSelectedProducts = this.editSelectedProducts.filter(p => p.id !== item.id);
        } else {
          this.editSelectedProducts.push(item);
        }
        break;
      case 'brand':
        if (this.isEditSelected(item, 'brand')) {
          this.editSelectedBrands = this.editSelectedBrands.filter(b => b.id !== item.id);
        } else {
          this.editSelectedBrands.push(item);
        }
        break;
      case 'category':
        if (this.isEditSelected(item, 'category')) {
          this.editSelectedCategories = this.editSelectedCategories.filter(c => c.id !== item.id);
        } else {
          this.editSelectedCategories.push(item);
        }
        break;
    }
  }

  selectAllEdit(items: any[], type: 'variant' | 'product' | 'brand' | 'category') {
    switch (type) {
      case 'variant':
        if (this.editSelectedVariants.length === items.length) {
          this.editSelectedVariants = [];
        } else {
          this.editSelectedVariants = [...items];
        }
        break;
      case 'product':
        if (this.editSelectedProducts.length === items.length) {
          this.editSelectedProducts = [];
        } else {
          this.editSelectedProducts = [...items];
        }
        break;
      case 'brand':
        if (this.editSelectedBrands.length === items.length) {
          this.editSelectedBrands = [];
        } else {
          this.editSelectedBrands = [...items];
        }
        break;
      case 'category':
        if (this.editSelectedCategories.length === items.length) {
          this.editSelectedCategories = [];
        } else {
          this.editSelectedCategories = [...items];
        }
        break;
    }
  }

  clearEditSelection(type: 'variant' | 'product' | 'brand' | 'category') {
    switch (type) {
      case 'variant': this.editSelectedVariants = []; break;
      case 'product': this.editSelectedProducts = []; break;
      case 'brand': this.editSelectedBrands = []; break;
      case 'category': this.editSelectedCategories = []; break;
    }
  }

  // Apply discount to selected (edit modal)
  applyEditDiscountToSelected(type: 'variant' | 'product' | 'brand' | 'category') {
    console.log('applyEditDiscountToSelected called with type:', type);
    console.log('editSelectedProducts:', this.editSelectedProducts);
    console.log('editSelectedVariants:', this.editSelectedVariants);
    if (this.currentEditRuleIndex === null) return;
    const rule = this.editEvent.rules[this.currentEditRuleIndex];
    const discountPercent = rule.discountPercent;
    let count = 0;
    switch (type) {
      case 'variant': {
        if (!this.selectedProduct) return;
        if (this.editSelectedVariants.length > 0) {
          const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
          this.editSelectedVariants.forEach((variant, idx) => {
            if (idx === 0 && !shouldRemoveCurrent && this.selectedProduct) {
              rule.selectedPath = [this.selectedProduct, variant];
              rule.targetLevel = 'variant';
              rule.categoryId = null;
              rule.productId = null; // Don't set productId for variant-level discounts
              rule.productVariantId = variant.id;
              rule.brandId = null;
              rule.discountPercent = discountPercent;
            } else if (this.selectedProduct) {
              this.editEvent.rules.push({
                id: Date.now().toString() + '-' + variant.id,
                targetType: 'product',
                selectedPath: [this.selectedProduct, variant],
                discountPercent: discountPercent,
                targetLevel: 'variant',
                categoryId: null,
                productId: null, // Don't set productId for variant-level discounts
                productVariantId: variant.id,
                brandId: null
              });
            }
            count++;
          });
          if (shouldRemoveCurrent) {
            this.editEvent.rules.splice(this.currentEditRuleIndex, 1);
            this.currentEditRuleIndex = null;
          }
          this.showEditRuleBuilder = false;
          this.resetCascadeState();
        }
        this.clearEditSelection('variant');
        break;
      }
      case 'product': {
        const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
        this.editSelectedProducts.forEach((product, idx) => {
          if (idx === 0 && !shouldRemoveCurrent) {
            rule.selectedPath = [product];
            rule.targetLevel = 'product';
            rule.categoryId = null;
            rule.productId = product.id;
            rule.productVariantId = null;
            rule.brandId = null;
            rule.discountPercent = discountPercent;
          } else {
            this.editEvent.rules.push({
              id: Date.now().toString() + '-' + product.id,
              targetType: 'product',
              selectedPath: [product],
              discountPercent: discountPercent,
              targetLevel: 'product',
              categoryId: null,
              productId: product.id,
              productVariantId: null,
              brandId: null
            });
          }
          count++;
        });
        // Also handle selectedVariants
        this.editSelectedVariants.forEach((variant, idx) => {
          const product = this.products.find(p => Array.isArray(p.variants) && p.variants.some((v: any) => v.id === variant.id));
          this.editEvent.rules.push({
            id: Date.now().toString() + '-variant-' + variant.id,
            targetType: 'product',
            selectedPath: product ? [product, variant] : [variant],
            discountPercent: discountPercent,
            targetLevel: 'variant',
            categoryId: null,
            productId: null, // Don't set productId for variant-level discounts
            productVariantId: variant.id,
            brandId: null
          });
          count++;
        });
        if (shouldRemoveCurrent) {
          this.editEvent.rules.splice(this.currentEditRuleIndex, 1);
          this.currentEditRuleIndex = null;
        }
        this.clearEditSelection('product');
        this.clearEditSelection('variant');
        this.showEditRuleBuilder = false;
        this.resetCascadeState();
        break;
      }
      case 'brand': {
        if (this.editSelectedBrands.length > 0) {
          const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
          this.editSelectedBrands.forEach((brand, idx) => {
            if (idx === 0 && !shouldRemoveCurrent) {
              rule.selectedPath = [brand];
              rule.targetLevel = 'brand';
              rule.categoryId = null;
              rule.productId = null;
              rule.productVariantId = null;
              rule.brandId = brand.id;
              rule.discountPercent = discountPercent;
            } else {
              this.editEvent.rules.push({
                id: Date.now().toString() + '-' + brand.id,
                targetType: 'brand',
                selectedPath: [brand],
                discountPercent: discountPercent,
                targetLevel: 'brand',
                categoryId: null,
                productId: null,
                productVariantId: null,
                brandId: brand.id
              });
            }
            count++;
          });
          if (shouldRemoveCurrent) {
            this.editEvent.rules.splice(this.currentEditRuleIndex, 1);
            this.currentEditRuleIndex = null;
          }
          this.clearEditSelection('brand');
          this.showEditRuleBuilder = false;
          this.resetCascadeState();
        }
        break;
      }
      case 'category': {
        if (this.editSelectedCategories.length > 0) {
          const shouldRemoveCurrent = !rule.selectedPath || rule.selectedPath.length === 0;
          this.editSelectedCategories.forEach((category, idx) => {
            if (idx === 0 && !shouldRemoveCurrent) {
              rule.selectedPath = [category];
              rule.targetLevel = 'category';
              rule.categoryId = category.id;
              rule.productId = null;
              rule.productVariantId = null;
              rule.brandId = null;
              rule.discountPercent = discountPercent;
            } else {
              this.editEvent.rules.push({
                id: Date.now().toString() + '-' + category.id,
                targetType: 'category',
                selectedPath: [category],
                discountPercent: discountPercent,
                targetLevel: 'category',
                categoryId: category.id,
                productId: null,
                productVariantId: null,
                brandId: null
              });
            }
            count++;
          });
          if (shouldRemoveCurrent) {
            this.editEvent.rules.splice(this.currentEditRuleIndex, 1);
            this.currentEditRuleIndex = null;
          }
          this.clearEditSelection('category');
          this.showEditRuleBuilder = false;
          this.resetCascadeState();
        }
        break;
      }
    }
    console.log('editEvent.rules after apply:', this.editEvent.rules);
    if (count > 0) {
      this.showToastMessage(`Discount applied to ${count} ${type}${count > 1 ? 's' : ''}!`);
    }
  }

  // Add or update the applySearch method to use searchEventName
  applySearch() {
    this.filterEventName = this.searchEventName;
    this.applyFilters();
  }

  toggleAction(action: 'show' | 'history' | 'delete') {
    this.actionToggle = action;
  }

  clearActionToggle() {
    this.actionToggle = null;
    this.showActionToggle = false;
  }

  // Method to position dropdowns dynamically
  private positionDropdown(triggerSelector: string, dropdownSelector: string): void {
    const trigger = document.querySelector(triggerSelector) as HTMLElement;
    const dropdown = document.querySelector(dropdownSelector) as HTMLElement;
    
    if (!trigger || !dropdown) return;
    
    const triggerRect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownHeight = 300; // Max height from CSS
    const dropdownWidth = Math.min(500, Math.max(300, triggerRect.width)); // Between 300-500px
    
    // Calculate position
    let top = triggerRect.bottom + window.scrollY;
    let left = triggerRect.left + window.scrollX;
    
    // Check if dropdown would go off-screen vertically
    if (triggerRect.bottom + dropdownHeight > viewportHeight) {
      // Position above the trigger if there's space
      if (triggerRect.top - dropdownHeight > 0) {
        top = triggerRect.top + window.scrollY - dropdownHeight;
      } else {
        // Position at the bottom of viewport with some padding
        top = viewportHeight - dropdownHeight - 20 + window.scrollY;
      }
    }
    
    // Check if dropdown would go off-screen horizontally
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 20;
    }
    
    // Ensure dropdown doesn't go off-screen to the left
    if (left < 20) {
      left = 20;
    }
    
    // Apply positioning
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
    dropdown.style.width = `${dropdownWidth}px`;
    dropdown.style.zIndex = '10001';
    
    // Removed backdrop to prevent shadow effect and unwanted closing
  }

  // DEBUG: Force open dropdown
  debugOpenDropdown() {
    // Temporarily disable document click
    this.disableDocumentClick = true;
    
    this.currentRuleIndex = 0;
    this.showRuleBuilder = true;
    this.builderType = 'category';
    this.showCategoryDropdown = true;
    console.log('[Debug] Force open dropdown called. showCategoryDropdown set to', this.showCategoryDropdown);
    this.cdr.detectChanges();
    
    // Re-enable document click after a short delay
    setTimeout(() => {
      this.disableDocumentClick = false;
    }, 100);
  }

  // Add this function to build a nested category tree from a flat array
  private buildCategoryTree(flatCategories: any[]): any[] {
    const idToNode: { [id: number]: any } = {};
    const roots: any[] = [];
    // First, create a map of id to node
    flatCategories.forEach(cat => {
      idToNode[cat.id] = { ...cat, children: [] };
    });
    // Then, assign children to their parents
    flatCategories.forEach(cat => {
      if (cat.parent_category_id && idToNode[cat.parent_category_id]) {
        idToNode[cat.parent_category_id].children.push(idToNode[cat.id]);
      } else if (cat.parent_category_id == null) {
        roots.push(idToNode[cat.id]);
      }
    });
    return roots;
  }

  isParentCategory(cat: any): boolean {
    if ('type' in cat) {
      return cat.type === 'category';
    }
    return cat.parent_category_id === null || cat.parent_category_id === undefined;
  }

  // Add these helper methods to the DiscountEventsComponent class
  getParentCategoryCount(): number {
    return this.selectedCategories.filter(cat => this.isParentCategory(cat)).length;
  }

  getChildCategoryCount(): number {
    return this.selectedCategories.filter(cat => !this.isParentCategory(cat)).length;
  }

  // New methods for combined category-product dropdown
  getProductsInCategory(categoryId: number): any[] {
    return this.products.filter(product => product.categoryId === categoryId);
  }

  isProductVisible(product: any): boolean {
    if (!this.productSearchTerm) {
      return true;
    }
    return product.name.toLowerCase().includes(this.productSearchTerm.toLowerCase());
  }

  // --- Discounted IDs logic ---
  /**
   * Updates the sets of discounted IDs based on active events only.
   * This allows creating new discounts for items that were previously discounted by inactive events.
   * 
   * @param excludeEventId - Optional event ID to exclude from consideration (used during editing)
   */
  updateDiscountedIds(excludeEventId: number | null = null) {
    this.discountedCategoryIds.clear();
    this.discountedProductIds.clear();
    this.discountedVariantIds.clear();
    this.discountedBrandIds.clear();
    
    // Only consider active events when determining discount availability
    // This allows items from inactive events to be available for new discounts
    const now = new Date();
    const eventsToCheck = excludeEventId
      ? this.allEvents.filter(e => e.id !== excludeEventId)
      : this.allEvents;
      
    for (const event of eventsToCheck) {
      // Only consider active events (both event.active and date range check)
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const isActive = event.active && startDate <= now && endDate >= now;
      
      if (!isActive || !event.rules) continue;
      
      for (const rule of event.rules) {
        if (rule.categoryId) this.discountedCategoryIds.add(rule.categoryId);
        if (rule.productId) this.discountedProductIds.add(rule.productId);
        if (rule.productVariantId) this.discountedVariantIds.add(rule.productVariantId);
        if (rule.brandId) this.discountedBrandIds.add(rule.brandId);
      }
    }
  }

  // Helper methods for UI - these now only consider active events
  isCategoryDiscounted(cat: any): boolean {
    // Hide if discounted in any other active event, or already in any rule of the current event
    if (this.discountedCategoryIds.has(cat.id)) {
      return true;
    }
    if (this.editEvent && this.editEvent.rules) {
      for (const rule of this.editEvent.rules) {
        if (rule.categoryId === cat.id) {
          return true;
        }
      }
    }
    return false;
  }
  isProductDiscounted(prod: any): boolean {
    if (this.discountedProductIds.has(prod.id)) return true;
    if (this.editEvent && this.editEvent.rules) {
      for (const rule of this.editEvent.rules) {
        if (rule.productId === prod.id) return true;
      }
    }
    return false;
  }
  isVariantDiscounted(variant: any): boolean {
    if (this.discountedVariantIds.has(variant.id)) return true;
    if (this.editEvent && this.editEvent.rules) {
      for (const rule of this.editEvent.rules) {
        if (rule.productVariantId === variant.id) return true;
      }
    }
    return false;
  }
  isBrandDiscounted(brand: any): boolean {
    if (this.discountedBrandIds.has(brand.id)) return true;
    if (this.editEvent && this.editEvent.rules) {
      for (const rule of this.editEvent.rules) {
        if (rule.brandId === brand.id) return true;
      }
    }
    return false;
  }

  // Discounted ID sets
  discountedCategoryIds: Set<number> = new Set();
  discountedProductIds: Set<number> = new Set();
  discountedVariantIds: Set<number> = new Set();
  discountedBrandIds: Set<number> = new Set();

  // Toggle state tracking
  togglingEventIds: Set<number> = new Set();

  openCreateModal() {
    this.updateDiscountedIds();
    console.log('Discounted category IDs:', Array.from(this.discountedCategoryIds));
    console.log('Discounted product IDs:', Array.from(this.discountedProductIds));
    console.log('Discounted variant IDs:', Array.from(this.discountedVariantIds));
    console.log('Discounted brand IDs:', Array.from(this.discountedBrandIds));
    this.showCreateModal = true;
    if (this.cdr) this.cdr.detectChanges();
  }

  /**
   * Toggles the active status of an event
   * @param event - The event to toggle
   */
  toggleEventStatus(event: any) {
    if (this.togglingEventIds.has(event.id)) {
      return; // Prevent multiple simultaneous toggles
    }

    this.togglingEventIds.add(event.id);
    
    const newActiveStatus = !event.active;
    const action = newActiveStatus ? 'ACTIVATED' : 'DEACTIVATED';
    
    // Update the event locally for immediate UI feedback
    event.active = newActiveStatus;
    
    // Call the appropriate backend endpoint
    const apiCall = newActiveStatus 
      ? this.eventService.activateEvent(event.id)
      : this.eventService.deactivateEvent(event.id);
    
    apiCall.subscribe({
      next: (updatedEvent) => {
        // Update the event in our local array
        const index = this.allEvents.findIndex(e => e.id === event.id);
        if (index !== -1) {
          this.allEvents[index] = updatedEvent;
        }
        
        // Update discounted IDs since event status changed
        this.updateDiscountedIds();
        
        // Show success message
        this.showToastMessage(`Event ${action.toLowerCase()} successfully`);
        
        this.togglingEventIds.delete(event.id);
        if (this.cdr) this.cdr.detectChanges();
      },
      error: (error) => {
        // Revert the local change on error
        event.active = !newActiveStatus;
        
        console.error('Failed to toggle event status:', error);
        this.showToastMessage(`Failed to ${action.toLowerCase()} event. Please try again.`);
        
        this.togglingEventIds.delete(event.id);
        if (this.cdr) this.cdr.detectChanges();
      }
    });
  }

  /**
   * Checks if an event is currently being toggled
   * @param eventId - The ID of the event to check
   * @returns True if the event is being toggled
   */
  isTogglingEvent(eventId: number): boolean {
    return this.togglingEventIds.has(eventId);
  }

  /**
   * Gets the actual active status considering both the active field and date range
   * @param event - The event to check
   * @returns true if the event is actually active (both active field and date range)
   */
  getActualActiveStatus(event: any): boolean {
    if (!event.active) return false;
    
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    return startDate <= now && endDate >= now;
  }

  /**
   * Gets the display status for the toggle switch
   * @param event - The event to check
   * @returns true if the toggle should be checked (active field is true)
   */
  getToggleStatus(event: any): boolean {
    return event.active;
  }

  /**
   * Gets the status text with date information
   * @param event - The event to check
   * @returns status text with date info
   */
  getStatusText(event: any): string {
    const isActive = this.getActualActiveStatus(event);
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    if (isActive) {
      return 'Active';
    } else if (!event.active) {
      return 'Inactive (Toggled Off)';
    } else if (startDate > now) {
      return 'Inactive (Future Date)';
    } else if (endDate < now) {
      return 'Inactive (Expired)';
    } else {
      return 'Inactive';
    }
  }

  // Returns true if the category has at least one product that is not discounted
  hasVisibleProducts(categoryId: number): boolean {
    return this.getProductsInCategory(categoryId).some(product => !this.isProductDiscounted(product));
  }

  // Discounted IDs in the current event being edited
  currentEditEventCategoryIds: Set<number> = new Set();
  currentEditEventProductIds: Set<number> = new Set();
  currentEditEventVariantIds: Set<number> = new Set();
  currentEditEventBrandIds: Set<number> = new Set();

  // Helpers to check if an item is discounted in the current event being edited
  isDiscountedInCurrentEditEventCategory(cat: any): boolean {
    return this.currentEditEventCategoryIds.has(cat.id);
  }
  isDiscountedInCurrentEditEventProduct(prod: any): boolean {
    return this.currentEditEventProductIds.has(prod.id);
  }
  isDiscountedInCurrentEditEventVariant(variant: any): boolean {
    return this.currentEditEventVariantIds.has(variant.id);
  }
  isDiscountedInCurrentEditEventBrand(brand: any): boolean {
    return this.currentEditEventBrandIds.has(brand.id);
  }

  // Helper to update discounted IDs in the current event being edited
  updateCurrentEditEventDiscountedIds() {
    this.currentEditEventCategoryIds.clear();
    this.currentEditEventProductIds.clear();
    this.currentEditEventVariantIds.clear();
    this.currentEditEventBrandIds.clear();
    if (this.editEvent && this.editEvent.rules) {
      for (const rule of this.editEvent.rules) {
        if (rule.categoryId) this.currentEditEventCategoryIds.add(rule.categoryId);
        if (rule.productId) this.currentEditEventProductIds.add(rule.productId);
        if (rule.productVariantId) this.currentEditEventVariantIds.add(rule.productVariantId);
        if (rule.brandId) this.currentEditEventBrandIds.add(rule.brandId);
      }
    }
  }

  // Returns true if any sub-category of the given category is discounted in any event or in the current event being edited
  hasDiscountedSubCategory(category: any): boolean {
    // Find all sub-categories (recursive)
    const findAllSubCategories = (cat: any): any[] => {
      let subs = this.sortedCategories.filter(c => c.parent_category_id === cat.id);
      for (const sub of subs) {
        subs = subs.concat(findAllSubCategories(sub));
      }
      return subs;
    };
    const subCategories = findAllSubCategories(category);
    for (const sub of subCategories) {
      if (this.discountedCategoryIds.has(sub.id)) return true;
      if (this.editEvent && this.editEvent.rules) {
        for (const rule of this.editEvent.rules) {
          if (rule.categoryId === sub.id) return true;
        }
      }
    }
    return false;
  }

}
