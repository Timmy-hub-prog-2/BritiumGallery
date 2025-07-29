import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { UserService } from '../services/user.service';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ApexOptions } from 'ng-apexcharts';

export interface CustomerAnalytics {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  customerType: string;
  totalSpend: number;
  orderCount: number;
  averageOrderValue: number;
  lastOrderDate: string;
  isOnline: boolean;
  lastSeenAt: string;
  city: string;
  country: string;
  registrationDate: string;
  status: string;
}

export interface CustomerTypeStats {
  type: string;
  count: number;
  percentage: number;
  totalSpent: number;
  averageSpent: number;
  activeUsers: number;
}

export interface GeographicStats {
  location: string;
  count: number;
  percentage: number;
  totalSpent: number;
  averageSpent: number;
}

export interface ActiveUserStats {
  totalUsers: number;
  onlineUsers: number;
  recentUsers: number;
  offlineUsers: number;
  growthRate: number;
}

export interface CustomerGrowthData {
  period: string;
  count: number;
  cumulativeCount: number;
}

@Component({
  selector: 'app-customer-analysis',
  templateUrl: './customer-analysis.component.html',
  standalone:false,
  styleUrls: ['./customer-analysis.component.css']
})
export class CustomerAnalysisComponent implements OnInit, AfterViewInit {
  // Data sources
  customers: CustomerAnalytics[] = [];
  filteredCustomers: CustomerAnalytics[] = [];
  customerTypeStats: CustomerTypeStats[] = [];
  geographicStats: GeographicStats[] = [];
  activeUserStats: ActiveUserStats = {
    totalUsers: 0,
    onlineUsers: 0,
    recentUsers: 0,
    offlineUsers: 0,
    growthRate: 0
  };
  customerGrowthData: CustomerGrowthData[] = [];

  // Table data sources
  customersDataSource = new MatTableDataSource<CustomerAnalytics>([]);
  customerTypeDataSource = new MatTableDataSource<CustomerTypeStats>([]);
  geographicDataSource = new MatTableDataSource<GeographicStats>([]);

  // Table columns
  customersColumns: string[] = [
    'name', 'email', 'customerType', 'totalSpend', 'orderCount', 
    'averageOrderValue', 'lastOrderDate', 'isOnline', 'city', 'country'
  ];
  customerTypeColumns: string[] = ['type', 'count', 'percentage', 'totalSpent', 'averageSpent', 'activeUsers'];
  geographicColumns: string[] = ['location', 'count', 'percentage', 'totalSpent', 'averageSpent'];

  // ViewChild references
  @ViewChild('customersSort') customersSort!: MatSort;
  @ViewChild('customersPaginator') customersPaginator!: MatPaginator;
  @ViewChild('customerTypeSort') customerTypeSort!: MatSort;
  @ViewChild('geographicSort') geographicSort!: MatSort;

  // Filters
  selectedCustomerType: string = 'all';
  selectedStatus: string = 'all';
  selectedCity: string = 'all';
  selectedCountry: string = 'all';
  dateFrom: string = '';
  dateTo: string = '';
  searchQuery: string = '';

  // Chart options
  public customerGrowthChartOptions: ApexOptions = {
    series: [
      {
        name: 'New Customers',
        data: []
      },
      {
        name: 'Total Customers',
        data: []
      }
    ],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: true
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    colors: ['#3B82F6', '#10B981'],
    xaxis: {
      categories: []
    },
    yaxis: {
      title: {
        text: 'Number of Customers'
      }
    },
    legend: {
      position: 'top'
    },
    dataLabels: {
      enabled: false
    }
  };

  public customerTypeChartOptions: ApexOptions = {
    series: [],
    chart: {
      type: 'donut',
      height: 300
    },
    labels: [],
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%'
        }
      }
    }
  };

  public geographicChartOptions: ApexOptions = {
    series: [{
      name: 'Customers',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 300
    },
    colors: ['#3B82F6'],
    xaxis: {
      categories: []
    },
    yaxis: {
      title: {
        text: 'Number of Customers'
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4
      }
    }
  };

  public activeUsersChartOptions: ApexOptions = {
    series: [{
      name: 'Active Users',
      data: []
    }],
    chart: {
      type: 'area',
      height: 200
    },
    colors: ['#10B981'],
    xaxis: {
      categories: []
    },
    yaxis: {
      title: {
        text: 'Users'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    }
  };

  // Loading states
  loading = {
    customers: false,
    stats: false,
    charts: false
  };

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.setupTableSorting();
  }

  private initializeData(): void {
    this.loadCustomers();
    this.loadCustomerGrowth();
  }

  private setupFilters(): void {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    this.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
    this.dateTo = today.toISOString().split('T')[0];
  }

  private setupTableSorting(): void {
    this.customersDataSource.sort = this.customersSort;
    this.customersDataSource.paginator = this.customersPaginator;
    this.customerTypeDataSource.sort = this.customerTypeSort;
    this.geographicDataSource.sort = this.geographicSort;
  }

  private loadCustomers(): void {
    this.loading.customers = true;
    this.http.get<CustomerAnalytics[]>('http://localhost:8080/gallery/users/customers/analytics').subscribe({
      next: (data) => {
        console.log('Fetched customers:', data);
        this.customers = data;
        this.filteredCustomers = data;
        this.customersDataSource.data = data;
        this.loading.customers = false;
        this.loadCustomerTypeStats();
        this.loadGeographicStats();
        this.loadActiveUserStats();
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
          window.dispatchEvent(new Event('resize'));
        });
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.loading.customers = false;
        this.customers = [];
        this.filteredCustomers = [];
        this.customersDataSource.data = [];
        this.loadCustomerTypeStats();
        this.loadGeographicStats();
        this.loadActiveUserStats();
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
          window.dispatchEvent(new Event('resize'));
        });
      }
    });
  }

  private loadMockCustomers(): void {
    this.customers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        customerType: 'VIP',
        totalSpend: 8500000,
        orderCount: 15,
        averageOrderValue: 566667,
        lastOrderDate: '2024-01-15',
        isOnline: true,
        lastSeenAt: '2024-01-15T10:30:00',
        city: 'Yangon',
        country: 'Myanmar',
        registrationDate: '2023-01-15',
        status: 'Active'
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phoneNumber: '+1234567891',
        customerType: 'Loyalty',
        totalSpend: 4500000,
        orderCount: 8,
        averageOrderValue: 562500,
        lastOrderDate: '2024-01-14',
        isOnline: false,
        lastSeenAt: '2024-01-14T16:45:00',
        city: 'Mandalay',
        country: 'Myanmar',
        registrationDate: '2023-03-20',
        status: 'Active'
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phoneNumber: '+1234567892',
        customerType: 'Normal',
        totalSpend: 1200000,
        orderCount: 3,
        averageOrderValue: 400000,
        lastOrderDate: '2024-01-10',
        isOnline: true,
        lastSeenAt: '2024-01-15T09:15:00',
        city: 'Naypyidaw',
        country: 'Myanmar',
        registrationDate: '2023-06-10',
        status: 'Active'
      }
    ];
    
    this.filteredCustomers = this.customers;
    this.customersDataSource.data = this.customers;
  }

  private loadCustomerTypeStats(): void {
    this.loading.stats = true;
    const typeMap = new Map<string, CustomerTypeStats>();
    this.customers.forEach(customer => {
      const type = customer.customerType;
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          type: type,
          count: 0,
          percentage: 0,
          totalSpent: 0,
          averageSpent: 0,
          activeUsers: 0
        });
      }
      const stats = typeMap.get(type)!;
      stats.count++;
      stats.totalSpent += customer.totalSpend;
      if (customer.isOnline) stats.activeUsers++;
    });
    const totalCustomers = this.customers.length;
    this.customerTypeStats = Array.from(typeMap.values()).map(stats => ({
      ...stats,
      percentage: (stats.count / totalCustomers) * 100,
      averageSpent: stats.count > 0 ? stats.totalSpent / stats.count : 0
    }));
    this.customerTypeDataSource.data = this.customerTypeStats;
    this.updateCustomerTypeChart();
    this.loading.stats = false;
    console.log('Customer type stats:', this.customerTypeStats);
  }

  private loadGeographicStats(): void {
    const locationMap = new Map<string, GeographicStats>();
    this.customers.forEach(customer => {
      const location = customer.city;
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          location: location,
          count: 0,
          percentage: 0,
          totalSpent: 0,
          averageSpent: 0
        });
      }
      const stats = locationMap.get(location)!;
      stats.count++;
      stats.totalSpent += customer.totalSpend;
    });
    const totalCustomers = this.customers.length;
    this.geographicStats = Array.from(locationMap.values()).map(stats => ({
      ...stats,
      percentage: (stats.count / totalCustomers) * 100,
      averageSpent: stats.count > 0 ? stats.totalSpent / stats.count : 0
    }));
    this.geographicDataSource.data = this.geographicStats;
    this.updateGeographicChart();
    console.log('Geographic stats:', this.geographicStats);
  }

  private loadActiveUserStats(): void {
    const totalUsers = this.customers.length;
    const onlineUsers = this.customers.filter(c => c.isOnline).length;
    const recentUsers = this.customers.filter(c => {
      const lastSeen = new Date(c.lastSeenAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return lastSeen > oneHourAgo && !c.isOnline;
    }).length;
    const offlineUsers = totalUsers - onlineUsers - recentUsers;
    this.activeUserStats = {
      totalUsers,
      onlineUsers,
      recentUsers,
      offlineUsers,
      growthRate: 8.02 // Mock growth rate
    };
    this.updateActiveUsersChart();
    console.log('Active user stats:', this.activeUserStats);
  }

  public loadCustomerGrowth(): void {
    // Ensure dates are set
    if (!this.dateFrom || !this.dateTo) {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      this.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      this.dateTo = today.toISOString().split('T')[0];
    }
    this.userService.getCustomerGrowth(this.dateFrom, this.dateTo, 'day').subscribe({
      next: (data) => {
        this.customerGrowthData = data;
        this.updateCustomerGrowthChart();
      },
      error: (error) => {
        console.error('Error loading customer growth:', error);
        // Load mock data
        this.loadMockCustomerGrowth();
      }
    });
  }

  private loadMockCustomerGrowth(): void {
    this.customerGrowthData = [
      { period: '2024-01-10', count: 5, cumulativeCount: 150 },
      { period: '2024-01-11', count: 3, cumulativeCount: 153 },
      { period: '2024-01-12', count: 7, cumulativeCount: 160 },
      { period: '2024-01-13', count: 4, cumulativeCount: 164 },
      { period: '2024-01-14', count: 6, cumulativeCount: 170 },
      { period: '2024-01-15', count: 8, cumulativeCount: 178 }
    ];
    this.updateCustomerGrowthChart();
  }

  private updateCustomerGrowthChart(): void {
    this.customerGrowthChartOptions.series = [
      {
        name: 'New Customers',
        data: this.customerGrowthData.map(d => d.count)
      },
      {
        name: 'Total Customers',
        data: this.customerGrowthData.map(d => d.cumulativeCount)
      }
    ];
    this.customerGrowthChartOptions.xaxis = {
      categories: this.customerGrowthData.map(d => d.period)
    };
  }

  private updateCustomerTypeChart(): void {
    this.customerTypeChartOptions.series = this.customerTypeStats.map(s => s.count);
    this.customerTypeChartOptions.labels = this.customerTypeStats.map(s => s.type);
  }

  private updateGeographicChart(): void {
    this.geographicChartOptions.series = [{
      name: 'Customers',
      data: this.geographicStats.map(s => s.count)
    }];
    this.geographicChartOptions.xaxis = {
      categories: this.geographicStats.map(s => s.location)
    };
  }

  private updateActiveUsersChart(): void {
    this.activeUsersChartOptions.series = [{
      name: 'Active Users',
      data: [this.activeUserStats.onlineUsers, this.activeUserStats.recentUsers, this.activeUserStats.offlineUsers]
    }];
    this.activeUsersChartOptions.xaxis = {
      categories: ['Online', 'Recent', 'Offline']
    };
  }

  // Filter methods
  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(customer => {
      const typeMatch = this.selectedCustomerType === 'all' || customer.customerType === this.selectedCustomerType;
      const statusMatch = this.selectedStatus === 'all' || 
        (this.selectedStatus === 'online' && customer.isOnline) ||
        (this.selectedStatus === 'offline' && !customer.isOnline);
      const cityMatch = this.selectedCity === 'all' || customer.city === this.selectedCity;
      const countryMatch = this.selectedCountry === 'all' || customer.country === this.selectedCountry;
      const searchMatch = !this.searchQuery || 
        customer.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return typeMatch && statusMatch && cityMatch && countryMatch && searchMatch;
    });
    
    this.customersDataSource.data = this.filteredCustomers;
  }

  public clearFilters(): void {
    this.selectedCustomerType = 'all';
    this.selectedStatus = 'all';
    this.selectedCity = 'all';
    this.selectedCountry = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  // Export methods
  public exportCustomers(format: 'excel' | 'csv' | 'pdf' = 'excel'): void {
    console.log(`Exporting customers in ${format} format`);
    // Implement export logic
  }

  public exportCustomerTypeStats(format: 'excel' | 'csv' | 'pdf' = 'excel'): void {
    console.log(`Exporting customer type stats in ${format} format`);
    // Implement export logic
  }

  public exportGeographicStats(format: 'excel' | 'csv' | 'pdf' = 'excel'): void {
    console.log(`Exporting geographic stats in ${format} format`);
    // Implement export logic
  }

  // Utility methods
  getCustomerTypeColor(type: string): string {
    switch (type) {
      case 'VIP': return '#F59E0B';
      case 'Loyalty': return '#10B981';
      case 'Normal': return '#3B82F6';
      default: return '#6B7280';
    }
  }

  getStatusColor(isOnline: boolean): string {
    return isOnline ? '#10B981' : '#6B7280';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MMK',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getUniqueCities(): string[] {
    return [...new Set(this.customers.map(c => c.city))];
  }

  getUniqueCountries(): string[] {
    return [...new Set(this.customers.map(c => c.country))];
  }
} 