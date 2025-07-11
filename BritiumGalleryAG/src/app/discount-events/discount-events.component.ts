import { Component, type OnInit } from "@angular/core"
import { DiscountEventService } from "../discount-event.service"
import { CategoryService } from "../category.service"
import { ProductVariantService } from "../services/product-variant.service"
import { ProductService } from "../services/product.service"
import { BrandService } from "../services/brand.service"
import { Brand } from "../models/product.model"
import { forkJoin } from 'rxjs'

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
  expandedProductId: string | null = null;

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

  constructor(
    private eventService: DiscountEventService,
    private categoryService: CategoryService,
    private productVariantService: ProductVariantService,
    private productService: ProductService,
    private brandService: BrandService,
  ) {}

  ngOnInit(): void {
    this.fetchEvents()
    this.fetchCategories()
    this.fetchProducts()
    this.fetchProductVariants()
    this.fetchBrands()
  }

  fetchEvents() {
    this.loading = true
    this.eventService.getAllEvents().subscribe({
      next: (data: any[]) => {
        this.events = data
        this.loading = false
      },
      error: (err: any) => {
        this.error = "Failed to load events."
        this.loading = false
      },
    })
  }

  fetchCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data: any[]) => {
        this.categories = data
        this.tryBuildCascadeTree()
      },
      error: () => {
        this.categories = []
      },
    })
  }

  fetchProducts() {
    this.productService.getAllProducts().subscribe({
      next: (data: any[]) => {
        this.products = data.map((product) => ({
          ...product,
          discount: undefined,
        }))
        this.fetchProductBreadcrumbs();
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
        this.productVariants = data
        this.tryBuildCascadeTree()
      },
      error: () => {
        this.productVariants = []
      },
    })
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

      // Attach variants to product
      if (prod.variants && prod.variants.length) {
        prodNode.children = prod.variants.map((v: any) => ({
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
    this.resetCascadeState();
  }

  applyVariantSelection(variant: CascadeNode) {
    console.log('DEBUG: Apply Variant Clicked', variant, 'currentRuleIndex:', this.currentRuleIndex, 'selectedProduct:', this.selectedProduct);
    if (this.currentRuleIndex === null || !this.selectedProduct) return;
    const rule = this.newEvent.rules[this.currentRuleIndex];
    rule.selectedPath = [this.selectedProduct, variant];
    rule.targetLevel = 'variant';
    // Set correct ID fields for backend
    rule.categoryId = null;
    rule.productId = null;
    rule.productVariantId = variant.id;
    rule.brandId = null;
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
      },
      error: (err) => {
        alert("Failed to create event: " + (err?.error || "Unknown error"))
      },
    })
  }

  openEditModal(event: any) {
    this.editEvent = {
      ...event,
      rules: (event.rules || []).map((rule: any) => {
        let targetType = '';
        let selectedPath: any[] = [];
        if (rule.categoryId) {
          targetType = 'category';
          const cat = this.categories.find((c) => c.id === rule.categoryId);
          if (cat) selectedPath = [{ name: cat.name, id: cat.id, type: 'category' }];
        } else if (rule.productId) {
          targetType = 'product';
          const prod = this.products.find((p) => p.id === rule.productId);
          if (prod) selectedPath = [{ name: prod.name, id: prod.id, type: 'product' }];
        } else if (rule.brandId) {
          targetType = 'brand';
          const brand = this.brands.find((b) => b.id === rule.brandId);
          if (brand) selectedPath = [{ name: brand.name, id: brand.id, type: 'brand' }];
        }
        return {
          ...rule,
          targetType,
          selectedPath,
        };
      }),
    };
    this.showEditModal = true;
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
  }

  removeEditRule(index: number) {
    if (this.editEvent && this.editEvent.rules) {
      this.editEvent.rules.splice(index, 1)
    }
  }

  updateEvent() {
    if (!this.editEvent || !this.editEvent.id) return

    this.eventService.updateEvent(this.editEvent.id, this.editEvent).subscribe(() => {
      this.showEditModal = false
      this.editEvent = null
      this.fetchEvents()
    })
  }

  deleteEvent(eventId: number) {
    if (confirm("Are you sure you want to delete this event?")) {
      this.eventService.deleteEvent(eventId).subscribe(() => {
        this.fetchEvents()
      })
    }
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
      return variant ? `Variant: ${variant.name}` : "Variant: Unknown"
    }

    if (rule.brandId) {
      const brand = this.brands.find((b) => b.id === rule.brandId)
      return brand ? `Brand: ${brand.name}` : "Brand: Unknown"
    }

    return "No target selected"
  }

  getHistoryDiffs(h: any): string[] {
    console.log('getHistoryDiffs CALLED', h);
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
    console.log('getChangedRulesDetailed CALLED', { oldRules, newRules });
    const changes: string[] = [];
    const ruleKey = (rule: any) => {
      if (rule.categoryId) return `category:${rule.categoryId}`;
      if (rule.productId) return `product:${rule.productId}`;
      if (rule.productVariantId) return `productVariant:${rule.productVariantId}`;
      if (rule.brandId) return `brand:${rule.brandId}`;
      return '';
    };
    console.log('--- DEBUG: Old Rules ---', oldRules);
    console.log('--- DEBUG: New Rules ---', newRules);

    const oldMap = new Map<string, any>();
    oldRules.forEach(rule => {
      const key = ruleKey(rule);
      console.log('Old Rule Key:', key, rule);
      if (key) oldMap.set(key, rule);
    });
    const newMap = new Map<string, any>();
    newRules.forEach(rule => {
      const key = ruleKey(rule);
      console.log('New Rule Key:', key, rule);
      if (key) newMap.set(key, rule);
    });

    // Check for changed or removed rules
    oldMap.forEach((oldRule, key) => {
      if (newMap.has(key)) {
        const newRule = newMap.get(key);
        if (oldRule.discountPercent !== newRule.discountPercent) {
          let target = this.getRuleTargetName(oldRule);
          changes.push(`${this.formatRuleLevel(oldRule)}${target ? ': ' + target : ''} — ${oldRule.discountPercent}% → ${newRule.discountPercent}% discount`);
        }
      }
    });
    // Check for added rules
    newMap.forEach((newRule, key) => {
      if (!oldMap.has(key)) {
        let target = this.getRuleTargetName(newRule);
        changes.push(`${this.formatRuleLevel(newRule)}${target ? ': ' + target : ''} — ${newRule.discountPercent != null ? newRule.discountPercent + '%' : ''} discount`);
      }
    });
    console.log('--- DEBUG: Detected Changes ---', changes);
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
    // Reset any selection state as needed
    this.builderType = type;
    this.selectedProduct = null;
    this.selectedBrand = null;
    this.cascadePath = [];
    this.cascadeHoverPath = [];
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
      return variant ? variant.name : '';
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
    this.builderType = this.editEvent.rules[index].targetType;
    this.cascadePath = this.editEvent.rules[index].selectedPath || [];
    this.cascadeHoverPath = [];
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
    this.expandedProductId = this.expandedProductId === product.id ? null : product.id;
    this.selectedProduct = product;
  }

  clearProductVariantSelection() {
    this.selectedProductForVariants = null;
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
      case 'variant':
        if (!this.selectedProduct) return;
        this.selectedVariants.forEach(variant => {
          this.newEvent.rules.push({
            id: Date.now().toString() + '-' + variant.id,
            targetType: 'product',
            selectedPath: [this.selectedProduct, variant],
            discountPercent: discountPercent,
            targetLevel: 'variant',
            categoryId: null,
            productId: null,
            productVariantId: variant.id,
            brandId: null
          });
          count++;
        });
        this.clearSelection('variant');
        break;
      case 'product':
        this.selectedProducts.forEach(product => {
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
          count++;
        });
        this.clearSelection('product');
        break;
      case 'category':
        this.selectedCategories.forEach(category => {
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
          count++;
        });
        this.clearSelection('category');
        break;
      case 'brand':
        this.selectedBrands.forEach(brand => {
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
          count++;
        });
        this.clearSelection('brand');
        break;
    }
    if (count > 0) {
      this.showToastMessage(`Discount applied to ${count} ${type}${count > 1 ? 's' : ''}!`);
    }
  }
}