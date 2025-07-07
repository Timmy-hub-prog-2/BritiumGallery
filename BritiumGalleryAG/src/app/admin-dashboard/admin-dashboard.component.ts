import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { OrderService, ProductSearchParams, ProductSearchResult } from '../services/order.service';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexStroke,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip
} from 'ng-apexcharts';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  stats: any = null;
  loading = false;
  error = '';

  // Chart and filter state
  salesTrend: any[] = [];
  chartLabels: string[] = [];
  salesData: number[] = [];
  costData: number[] = [];
  profitData: number[] = [];

  // Chart type state
  chartType: 'line' | 'bar' = 'line';
  currentChartType: 'line' | 'bar' = 'line';

  // Modal states
  showFiltersModal = false;
  showExportModal = false;
  showChartModal = false;
  showTableModal = false;
  showDailyOrdersModal = false;
  showCustomerModal = false;
  showReportsModal = false;
  showSettingsModal = false;
  showProductSearchModal = false;

  // Table modal state
  currentTableType: 'sales' | 'products' = 'sales';
  currentTableTitle = '';

  // Export state
  exportFormat: 'excel' | 'csv' | 'pdf' = 'excel';
  exportOptions = {
    includeKPIs: true,
    includeTrend: true,
    includeProducts: true,
    includeChart: true
  };

  // Loading states
  loadingState = {
    stats: false,
    trend: false,
    export: false
  };

  // ApexCharts options
  public chartOptions: any = {
    series: [],
    chart: { type: 'line', height: 350 },
    xaxis: { categories: [] },
    title: { text: 'Sales, Cost, and Profit Trend' },
    stroke: { curve: 'smooth' },
    dataLabels: { enabled: false },
    legend: { show: true },
    tooltip: { enabled: true },
    colors: ['#008FFB', '#00E396', '#FEB019'],
    grid: {
      show: true,
      borderColor: '#e7e7e7',
      strokeDashArray: 4,
      position: 'back',
    },
  };

  // Modal chart options with larger height
  public modalChartOptions: any = {
    series: [],
    chart: { type: 'line', height: 500 },
    xaxis: { categories: [] },
    title: { text: 'Sales, Cost, and Profit Trend' },
    stroke: { curve: 'smooth' },
    dataLabels: { enabled: false },
    legend: { show: true },
    tooltip: { enabled: true },
    colors: ['#008FFB', '#00E396', '#FEB019'],
    grid: {
      show: true,
      borderColor: '#e7e7e7',
      strokeDashArray: 4,
      position: 'back',
    },
  };

  // Filters
  groupBy: string = 'day';
  groupByOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' }
  ];
  dateFrom: string;
  dateTo: string;

  totalPurchaseAmount: number = 0;
  normalCustomerCount: number = 0;
  loyaltyCustomerCount: number = 0;
  vipCustomerCount: number = 0;

  // --- New state for daily orders and best sellers ---
  selectedDate: string = '';
  dailyOrders: any[] = [];
  bestSellers: any[] = [];
  showDailyOrders: boolean = false;

  // Table data sources
  dailyOrdersDataSource = new MatTableDataSource<any>([]);
  bestSellersDataSource = new MatTableDataSource<any>([]);
  salesTrendDataSource = new MatTableDataSource<any>([]);

  // Table columns
  dailyOrdersColumns: string[] = ['orderId', 'trackingCode', 'customerName', 'sales', 'cost', 'deliveryFee', 'profit', 'status'];
  bestSellersColumns: string[] = ['rank', 'productName', 'variantName', 'totalQuantitySold', 'totalSales', 'totalCost', 'totalProfit', 'profitMargin'];
  salesTrendColumns: string[] = ['period', 'sales', 'cost', 'profit', 'margin', 'orderCount'];

  @ViewChild('salesTrendSort', { static: false }) salesTrendSort!: MatSort;
  @ViewChild('bestSellersSort', { static: false }) bestSellersSort!: MatSort;
  @ViewChild('dailyOrdersSort', { static: false }) dailyOrdersSort!: MatSort;
  @ViewChild('salesTrendModalSort', { static: false }) salesTrendModalSort!: MatSort;
  @ViewChild('bestSellersModalSort', { static: false }) bestSellersModalSort!: MatSort;

  // Product Search Properties
  productSearchQuery = '';
  productSearchType: 'all' | 'productId' | 'variantId' | 'sku' | 'name' | 'category' = 'all';
  productSearchCategory = '';
  productSearchStockStatus = '';
  productSearchPriceRange = '';
  productCategories: string[] = [];
  productSearchResults: ProductSearchResult[] = [];
  isProductSearchLoading = false;
  
  // Product View and Sort Properties - explicitly typed as string to avoid union type issues
  productViewMode: any = 'grid';
  productSortBy = 'name';
  activeProductActions: number | null = null;

  // Search type setter
  setSearchType(type: 'all' | 'productId' | 'variantId' | 'sku' | 'name' | 'category') {
    this.productSearchType = type;
    this.onProductSearch();
  }

  // Placeholder for search input
  getSearchPlaceholder(): string {
    switch (this.productSearchType) {
      case 'productId': return 'Enter Product ID...';
      case 'variantId': return 'Enter Variant ID...';
      case 'sku': return 'Enter SKU...';
      case 'name': return 'Enter Product Name...';
      case 'category': return 'Enter Category...';
      default: return 'Search products...';
    }
  }

  // Price range filter (stub, can be expanded)
  onProductSearchPriceRangeChange() {
    this.onProductSearch();
  }

  // View mode for product results (grid/list)
  setViewMode(mode: any) {
    this.productViewMode = mode;
  }

  // Sorting for product results
  sortProducts() {
    // Implement sorting logic as needed
    // Example: sort by price, name, etc.
    // For now, just a stub
  }

  // TrackBy for ngFor
  trackByProductId(index: number, product: any): number {
    return product.productId || index;
  }

  // Stock status text (already implemented as getProductStatusText, alias for compatibility)
  getStockStatusText(stockQuantity: number | undefined): string {
    if (!stockQuantity || stockQuantity <= 0) return 'Out of Stock';
    if (stockQuantity <= 10) return 'Low Stock';
    return 'In Stock';
  }

  // Profit status class (stub)
  getProfitStatusClass(profitMargin: number | undefined): string {
    if (!profitMargin) return 'profit-neutral';
    if (profitMargin >= 25) return 'profit-excellent';
    if (profitMargin >= 15) return 'profit-good';
    if (profitMargin >= 5) return 'profit-fair';
    return 'profit-poor';
  }

  // Stock badge class (stub)
  getStockBadgeClass(stockQuantity: number | undefined): string {
    if (!stockQuantity || stockQuantity <= 0) return 'badge-out-of-stock';
    if (stockQuantity <= 10) return 'badge-low-stock';
    return 'badge-in-stock';
  }

  // Performance class (stub)
  getPerformanceClass(profitMargin: number | undefined): string {
    if (!profitMargin) return 'performance-neutral';
    if (profitMargin >= 25) return 'performance-excellent';
    if (profitMargin >= 15) return 'performance-good';
    if (profitMargin >= 5) return 'performance-fair';
    return 'performance-poor';
  }

  // ROI and Performance Methods
  getROIClass(totalProfit: number | undefined, totalPurchasePrice: number | undefined): string {
    if (!totalProfit || !totalPurchasePrice || totalPurchasePrice === 0) return 'roi-neutral';
    const roi = (totalProfit / totalPurchasePrice) * 100;
    if (roi >= 20) return 'roi-excellent';
    if (roi >= 10) return 'roi-good';
    if (roi >= 5) return 'roi-fair';
    return 'roi-poor';
  }

  calculateROI(totalProfit: number | undefined, totalPurchasePrice: number | undefined): number {
    if (!totalProfit || !totalPurchasePrice || totalPurchasePrice === 0) return 0;
    return (totalProfit / totalPurchasePrice) * 100;
  }

  getTrendClass(product: any): string {
    // Implement trend analysis based on sales history
    const profitMargin = product.profitMargin || 0;
    if (profitMargin >= 25) return 'trend-up';
    if (profitMargin >= 15) return 'trend-stable';
    return 'trend-down';
  }

  // Product Actions
  viewProductDetails(product: any): void {
    // TODO: Implement product details view
    console.log('View product details:', product);
  }

  toggleProductActions(productId: number): void {
    this.activeProductActions = this.activeProductActions === productId ? null : productId;
  }

  duplicateProduct(product: any): void {
    // TODO: Implement product duplication
    console.log('Duplicate product:', product);
  }

  archiveProduct(product: any): void {
    // TODO: Implement product archiving
    console.log('Archive product:', product);
  }

  constructor(private orderService: OrderService) {
    // Default: last 30 days
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - 29);
    this.dateTo = today.toISOString().slice(0, 10);
    this.dateFrom = prior.toISOString().slice(0, 10);
    this.selectedDate = this.dateTo;

    // Set up custom sort functions for data sources
    this.setupDataSources();
  }

  setupDataSources() {
    // Sales trend data source with custom sort
    this.salesTrendDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'sales':
        case 'cost':
        case 'profit':
          return Number(item[property]);
        case 'margin':
          return Number(item[property]);
        case 'orderCount':
          return Number(item[property]);
        default:
          return item[property];
      }
    };

    // Best sellers data source with custom sort
    this.bestSellersDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'rank':
          return Number(item[property]);
        case 'totalQuantitySold':
          return Number(item[property]);
        case 'totalSales':
        case 'totalCost':
        case 'totalProfit':
          return Number(item[property]);
        case 'profitMargin':
          return Number(item[property]);
        default:
          return item[property];
      }
    };

    // Daily orders data source with custom sort
    this.dailyOrdersDataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'sales':
        case 'cost':
        case 'deliveryFee':
        case 'profit':
          return Number(item[property]);
        default:
          return item[property];
      }
    };
  }

  ngOnInit(): void {
    this.fetchStats();
    this.fetchSalesTrend();
    this.fetchBestSellers();
  }

  ngAfterViewInit() {
    this.assignSorts();
  }

  assignSorts() {
    if (this.salesTrendSort) {
      this.salesTrendDataSource.sort = this.salesTrendSort;
    }
    if (this.bestSellersSort) {
      this.bestSellersDataSource.sort = this.bestSellersSort;
    }
    if (this.bestSellersModalSort) {
      this.bestSellersDataSource.sort = this.bestSellersModalSort;
    }
    if (this.dailyOrdersSort) {
      this.dailyOrdersDataSource.sort = this.dailyOrdersSort;
    }
    if (this.salesTrendModalSort) {
      this.salesTrendDataSource.sort = this.salesTrendModalSort;
    }
  }

  // Modal methods
  openFiltersModal(): void {
    this.showFiltersModal = true;
  }

  openExportModal(): void {
    this.showExportModal = true;
  }

  openChartModal(): void {
    this.showChartModal = true;
  }

  openTableModal(type: 'sales' | 'products'): void {
    this.currentTableType = type;
    this.currentTableTitle = type === 'sales' ? 'Sales Analytics' : 'Top Products';
    this.showTableModal = true;
    setTimeout(() => this.assignSorts(), 0);
  }

  openDailyOrdersModal(): void {
    this.showDailyOrdersModal = true;
    this.fetchDailyOrders(this.selectedDate);
    setTimeout(() => {
      this.assignSorts();
      this.refreshSorting();
    }, 0);
  }

  openCustomerModal(): void {
    this.showCustomerModal = true;
  }

  openReportsModal(): void {
    this.showReportsModal = true;
  }

  openSettingsModal(): void {
    this.showSettingsModal = true;
  }

  openProductSearchModal(): void {
    this.showProductSearchModal = true;
    this.loadProductCategories();
  }

  closeModal(type: string): void {
    switch (type) {
      case 'filters':
        this.showFiltersModal = false;
        break;
      case 'export':
        this.showExportModal = false;
        break;
      case 'chart':
        this.showChartModal = false;
        break;
      case 'table':
        this.showTableModal = false;
        break;
      case 'dailyOrders':
        this.showDailyOrdersModal = false;
        break;
      case 'customer':
        this.showCustomerModal = false;
        break;
      case 'reports':
        this.showReportsModal = false;
        break;
      case 'settings':
        this.showSettingsModal = false;
        break;
      case 'productSearch':
        this.showProductSearchModal = false;
        this.clearProductSearch();
        break;
    }
  }

  // Dashboard refresh
  refreshDashboard(): void {
    this.fetchStats();
    this.fetchSalesTrend();
    this.fetchBestSellers();
  }

  // Filter methods
  setQuickRange(range: 'today' | 'week' | 'month' | 'quarter'): void {
    const today = new Date();
    const prior = new Date();
    
    switch (range) {
      case 'today':
        this.dateFrom = today.toISOString().slice(0, 10);
        this.dateTo = today.toISOString().slice(0, 10);
        break;
      case 'week':
        prior.setDate(today.getDate() - 6);
        this.dateFrom = prior.toISOString().slice(0, 10);
        this.dateTo = today.toISOString().slice(0, 10);
        break;
      case 'month':
        prior.setMonth(today.getMonth() - 1);
        this.dateFrom = prior.toISOString().slice(0, 10);
        this.dateTo = today.toISOString().slice(0, 10);
        break;
      case 'quarter':
        prior.setMonth(today.getMonth() - 3);
        this.dateFrom = prior.toISOString().slice(0, 10);
        this.dateTo = today.toISOString().slice(0, 10);
        break;
    }
  }

  applyFilters(): void {
    this.fetchSalesTrend();
    this.closeModal('filters');
  }

  // Chart methods
  toggleChartType(type: 'line' | 'bar'): void {
    this.currentChartType = type;
    this.chartType = type;
    this.updateChartOptions();
  }

  // Export methods
  performExport(): void {
    this.loadingState.export = true;
    // Simulate export process
    setTimeout(() => {
      this.loadingState.export = false;
      this.closeModal('export');
      // Here you would implement actual export logic
    }, 2000);
  }

  exportCurrentTable(): void {
    // Implement table export logic
    console.log('Exporting current table:', this.currentTableType);
  }

  // Refresh methods
  refreshBestSellers(): void {
    this.fetchBestSellers();
  }

  refreshDailyOrders(): void {
    this.fetchDailyOrders(this.selectedDate);
  }

  // Computed properties
  get totalCustomers(): number {
    return this.normalCustomerCount + this.loyaltyCustomerCount + this.vipCustomerCount;
  }

  get profitMargin(): number {
    if (this.totalSales === 0) return 0;
    return (this.stats?.profit / this.totalSales) * 100;
  }

  fetchStats(): void {
    this.loading = true;
    this.error = '';
    this.orderService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.totalPurchaseAmount = data.totalPurchaseAmount;
        this.normalCustomerCount = data.normalCustomerCount;
        this.loyaltyCustomerCount = data.loyaltyCustomerCount;
        this.vipCustomerCount = data.vipCustomerCount;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard stats.';
        this.loading = false;
      }
    });
  }

  fetchSalesTrend(): void {
    this.orderService.getSalesTrend(this.dateFrom, this.dateTo, this.groupBy).subscribe({
      next: (data: any[]) => {
        this.salesTrend = data;
        this.chartLabels = data.map(d => d.period);
        this.salesData = data.map(d => d.sales);
        this.costData = data.map(d => d.cost);
        this.profitData = data.map(d => d.profit);
        
        // Add margin and orderCount to sales trend data for table
        const salesTrendWithMargin = data.map((item, index) => ({
          ...item,
          margin: item.sales > 0 ? (item.profit / item.sales) * 100 : 0,
          orderCount: item.orderCount || 0
        }));
        this.salesTrendDataSource.data = salesTrendWithMargin;
        
        this.updateChartOptions();
        this.refreshSorting();
      },
      error: () => {
        this.salesTrend = [];
        this.chartLabels = [];
        this.salesData = [];
        this.costData = [];
        this.profitData = [];
        this.salesTrendDataSource.data = [];
        this.updateChartOptions();
      }
    });
  }

  updateChartOptions() {
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        { name: 'Sales', data: this.salesData },
        { name: 'Cost', data: this.costData },
        { name: 'Profit', data: this.profitData }
      ],
      xaxis: { categories: this.chartLabels },
      chart: { ...this.chartOptions.chart, type: this.chartType },
    };

    this.modalChartOptions = {
      ...this.modalChartOptions,
      series: [
        { name: 'Sales', data: this.salesData },
        { name: 'Cost', data: this.costData },
        { name: 'Profit', data: this.profitData }
      ],
      xaxis: { categories: this.chartLabels },
      chart: { ...this.modalChartOptions.chart, type: this.chartType },
    };
  }

  onFilterChange(): void {
    this.fetchSalesTrend();
  }

  // --- Totals for filtered range ---
  get totalSales(): number {
    return this.salesTrend.reduce((sum, r) => sum + r.sales, 0);
  }
  get totalCost(): number {
    // Use totalCost from dashboard stats if available, otherwise calculate from salesTrend
    if (this.stats && this.stats.totalCost !== undefined) {
      return this.stats.totalCost;
    }
    return this.salesTrend.reduce((sum, r) => sum + r.cost, 0);
  }
  get totalProfit(): number {
    return this.salesTrend.reduce((sum, r) => sum + r.profit, 0);
  }

  fetchDailyOrders(date: string) {
    this.selectedDate = date;
    this.orderService.getDailyOrderDetails(date).subscribe({
      next: (data: any[]) => {
        this.dailyOrders = data;
        this.dailyOrdersDataSource.data = data;
        
        // Ensure sorting is properly set up
        setTimeout(() => {
          if (this.dailyOrdersSort) {
            this.dailyOrdersDataSource.sort = this.dailyOrdersSort;
          }
          this.dailyOrdersDataSource._updateChangeSubscription();
        }, 100);
      },
      error: () => {
        this.dailyOrders = [];
        this.dailyOrdersDataSource.data = [];
      }
    });
  }

  fetchBestSellers(limit: number = 10) {
    this.orderService.getBestSellerProducts(limit).subscribe({
      next: (data: any[]) => {
        // Add rank property to each product
        const rankedProducts = data.map((product, index) => ({
          ...product,
          rank: index + 1
        }));
        this.bestSellers = rankedProducts;
        this.bestSellersDataSource.data = rankedProducts;
        this.refreshSorting();
      },
      error: () => {
        this.bestSellers = [];
        this.bestSellersDataSource.data = [];
      }
    });
  }

  exportData() {
    // Implement export functionality
    console.log('Exporting dashboard data');
  }

  resetFilters() {
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - 29);
    this.dateTo = today.toISOString().slice(0, 10);
    this.dateFrom = prior.toISOString().slice(0, 10);
    this.groupBy = 'day';
    this.fetchSalesTrend();
  }

  exportTable() {
    // Implement table export
    console.log('Exporting table data');
  }

  sortCurrencyData = (a: number, b: number, isAsc: boolean) => {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  };

  sortPercentageData = (a: number, b: number, isAsc: boolean) => {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  };

  refreshSorting() {
    // Assign sorts to data sources
    if (this.bestSellersSort) {
        this.bestSellersDataSource.sort = this.bestSellersSort;
    }
    if (this.bestSellersModalSort) {
      this.bestSellersDataSource.sort = this.bestSellersModalSort;
    }
    if (this.dailyOrdersSort) {
      this.dailyOrdersDataSource.sort = this.dailyOrdersSort;
    }
    if (this.salesTrendSort) {
      this.salesTrendDataSource.sort = this.salesTrendSort;
    }
    if (this.salesTrendModalSort) {
      this.salesTrendDataSource.sort = this.salesTrendModalSort;
    }

    // Trigger sort refresh for all data sources
    try {
      this.dailyOrdersDataSource._updateChangeSubscription();
      this.bestSellersDataSource._updateChangeSubscription();
      this.salesTrendDataSource._updateChangeSubscription();
    } catch (error) {
      console.warn('Error updating sort subscriptions:', error);
    }
  }

  // Product Search Methods
  loadProductCategories(): void {
    this.orderService.getProductCategories().subscribe({
      next: (categories) => {
        this.productCategories = categories;
      },
      error: (error) => {
        console.error('Error loading product categories:', error);
      }
    });
  }

  onProductSearch(): void {
    if (this.productSearchQuery.trim()) {
      this.performProductSearch();
    }
  }

  performProductSearch(): void {
    this.isProductSearchLoading = true;
    
    const searchParams: ProductSearchParams = {
      query: this.productSearchQuery,
      type: this.productSearchType,
      category: this.productSearchCategory || undefined,
      stockStatus: this.productSearchStockStatus || undefined
    };

    this.orderService.searchProducts(searchParams).subscribe({
      next: (results) => {
        this.productSearchResults = results;
        this.isProductSearchLoading = false;
      },
      error: (error) => {
        console.error('Error searching products:', error);
        this.isProductSearchLoading = false;
      }
    });
  }

  clearProductSearch(): void {
    this.productSearchQuery = '';
    this.productSearchType = 'all';
    this.productSearchCategory = '';
    this.productSearchStockStatus = '';
    this.productSearchResults = [];
  }

  // Product Status Methods
  getProductStatusClass(product: any): string {
    const stock = product.stockQuantity || 0;
    if (stock <= 0) return 'status-out-of-stock';
    if (stock <= 10) return 'status-low-stock';
    return 'status-in-stock';
  }

  getProductStatusText(product: any): string {
    const stock = product.stockQuantity || 0;
    if (stock <= 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  }

  getStockStatusClass(stockQuantity: number): string {
    if (stockQuantity <= 0) return 'out-of-stock';
    if (stockQuantity <= 10) return 'low-stock';
    return 'in-stock';
  }

  getQuantitySold(product: any): number {
    if (product.sellingPrice && product.sellingPrice > 0) {
      return Math.round(product.totalSales / product.sellingPrice);
    }
    return 0;
  }

  // Product Actions
  editProduct(product: any): void {
    // TODO: Implement product edit functionality
    console.log('Edit product:', product);
  }

  viewProductHistory(product: any): void {
    // TODO: Implement product history view
    console.log('View product history:', product);
  }

  exportProduct(product: any): void {
    // TODO: Implement single product export
    console.log('Export product:', product);
  }

  exportProductSearch(): void {
    // TODO: Implement search results export
    console.log('Export search results');
  }
}

// --- Interfaces moved outside the component for best practice ---

export interface DashboardStats {
  totalSales: number
  profit: number
  transactionCount: number
  totalPurchaseAmount: number
  normalCustomerCount: number
  loyaltyCustomerCount: number
  vipCustomerCount: number
  averageOrderValue?: number
  totalOrders?: number
  conversionRate?: number
}

export interface SalesTrendData {
  period: string
  sales: number
  cost: number
  profit: number
  orderCount?: number
  averageOrderValue?: number
}

export interface GroupByOption {
  value: "day" | "week" | "month" | "quarter" | "year"
  label: string
}

export interface DateRange {
  from: string
  to: string
}

export interface CustomerSegment {
  type: "normal" | "loyalty" | "vip"
  count: number
  percentage: number
  totalSpent?: number
  averageOrderValue?: number
}

export interface ChartConfig {
  type: "line" | "bar" | "area"
  height: number
  colors?: string[]
  showDataLabels: boolean
  showLegend: boolean
}

export interface DashboardStatsResponse {
  success: boolean
  data: DashboardStats
  message?: string
}

export interface SalesTrendResponse {
  success: boolean
  data: SalesTrendData[]
  message?: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  error?: any
  statusCode?: number
}

export interface LoadingState {
  stats: boolean
  trend: boolean
  export: boolean
}

export interface ExportOptions {
  format: "csv" | "excel" | "pdf"
  includeChart: boolean
  dateRange: DateRange
  groupBy: string
}
