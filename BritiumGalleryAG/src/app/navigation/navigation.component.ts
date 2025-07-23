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
import { CartService } from '../services/cart.service';
import { NotificationService, Notification } from '../services/notification.service';
import { NotificationWebSocketService } from '../services/notification-websocket.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CronExpressionParser } from 'cron-parser';

interface CategoryWithSubs extends category {
  subcategories?: CategoryWithSubs[];
  products?: ProductResponse[];
}

@Component({
  selector: 'app-navigation',
  standalone:false,
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class NavigationComponent implements OnInit, OnDestroy {
  categories: CategoryWithSubs[] = [];
  activeCategory: CategoryWithSubs | null = null;
  activeSubcategory: CategoryWithSubs | null = null;
  activeSubSubcategory: CategoryWithSubs | null = null;
  isMegaMenuVisible = false;
  user: User | null = null;
  isProfileMenuVisible = false;
  cartItemCount = 0;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  selectedNotification: Notification | null = null;
  scheduledNotifications: any[] = [];
  private scheduledNotificationsRaw: any[] = [];
  private scheduledInterval: any;
  isInfoMenuVisible = false;
  private hideInfoMenuTimeout: any;
  
  private hideMenuTimeout: any;
  private hoverTimeout: any;
  private userSubscription: Subscription | undefined;

  // --- Notification UI helpers and stubs for template ---
  activeFilter: string = 'all';

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private router: Router,
    private userService: UserService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private notificationWebSocketService: NotificationWebSocketService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Load top-level categories and their children
    this.categoryService.getAllCategories().subscribe((categories: CategoryWithSubs[]) => {
      this.categories = categories.filter(cat => !cat.parent_category_id);
      this.loadCategoryChildren(this.categories).subscribe(() => {
        if (this.categories.length > 0) {
          this.setActiveCategory(this.categories[0]);
        }
      });
    });
  
    // Subscribe to user changes
    this.userSubscription = this.userService.currentUser.subscribe((user: User | null) => {
      this.user = user;
    });
  
    // ✅ Subscribe to cart count
    this.cartService.cartCount$.subscribe(count => {
      this.cartItemCount = count;
    });

    // Fetch notifications for logged-in user
    const user = this.userService.userValue || JSON.parse(localStorage.getItem('user') || 'null');
    
    if (user && user.id) {
      this.fetchNotifications(user.id);
      // Fetch scheduled notifications for this user
      this.notificationService.getUserScheduledNotifications(user.id).subscribe((scheduled: any[]) => {
        this.scheduledNotificationsRaw = scheduled;
        this.filterScheduledNotifications();
        // Apply filtering to regular notifications after scheduled notifications are loaded
        this.applyNotificationFiltering();
      });
      // Set up interval to re-filter every minute
      this.scheduledInterval = setInterval(() => {
        this.filterScheduledNotifications();
      }, 60000);
      // Subscribe to WebSocket after fetching notifications
      this.notificationWebSocketService.connect(user.id);
      this.notificationWebSocketService.notifications$.subscribe((noti) => {
        // Check if this is a scheduled notification that was pushed
        const now = new Date();
        const isScheduledNotification = this.scheduledNotificationsRaw.some(sched => sched.id === noti.id);
        
        if (isScheduledNotification) {
          // For scheduled notifications, check if they're within valid date range
          const scheduledNoti = this.scheduledNotificationsRaw.find(sched => sched.id === noti.id);
          if (scheduledNoti && !this.isScheduledNotificationInValidRange(scheduledNoti, now)) {
            return; // Don't add to notifications if outside date range
          }
          
          // Remove from scheduledNotifications if present (for real-time scheduled notis)
          this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== noti.id);
        }
        
        // Add to notifications if not present
        const idx = this.notifications.findIndex(n => n.id === noti.id);
        if (idx !== -1) {
          // Update existing notification (e.g., isRead status)
          this.notifications[idx] = { ...this.notifications[idx], ...noti };
        } else {
          // Add new notification to the top
          this.notifications.unshift(noti);
          // --- Play sound and vibrate for new notification ---
          this.playNotificationFeedback();
        }
        // Update unread count
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      });
      
      // Make debug method available globally for testing
      (window as any).debugNotifications = () => this.debugScheduledNotifications();
      (window as any).debugNotification = (notification: any) => this.debugNotification(notification);
      (window as any).debugAllNotifications = () => this.debugAllNotifications();
      (window as any).forceRefreshNotifications = () => this.forceRefreshNotifications();
      (window as any).testPaymentDueNotification = () => this.testPaymentDueNotification();
    }
  }

  // Test method for payment due notifications
  testPaymentDueNotification() {
    console.log('=== Testing Payment Due Notification ===');
    
    // Create a mock payment due notification
    const mockNotification: Notification = {
      id: 999999,
      title: 'Payment Due Soon',
      message: '⚠️ <b>Payment Due Alert</b><br><br>Your order <b>#TEST123</b> payment is due in <b style="color:red;">1 hour</b>.<br><br>💰 <b>Total Amount:</b> MMK 50000<br><br>Please complete your payment to avoid order cancellation. You can make payment through your order details page.',
      type: 'PAYMENT_DUE',
      relatedObjectId: 123,
      trackingCode: 'TEST123',
      isRead: false,
      createdAt: new Date().toISOString(),
      actionLink: '/customer-order-detail/123'
    };
    
    // Add to notifications
    this.notifications.unshift(mockNotification);
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    
    // Play notification sound
    this.playNotificationFeedback();
    
    console.log('Mock payment due notification added:', mockNotification);
    console.log('Current notifications count:', this.notifications.length);
    console.log('Unread count:', this.unreadCount);
  }
  

  ngOnDestroy(): void {
    if (this.scheduledInterval) {
      clearInterval(this.scheduledInterval);
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.hideMenuTimeout) {
      clearTimeout(this.hideMenuTimeout);
    }
    if (this.hideInfoMenuTimeout) {
      clearTimeout(this.hideInfoMenuTimeout);
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe(); // Unsubscribe to prevent memory leaks
    }
  }

  logout(): void {
  this.userService.logout(); // This will handle navigation
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
    },100); // Delay in ms (adjust to 500 if you want it longer)
  }

  cancelHideMegaMenu(): void {
    clearTimeout(this.hideMenuTimeout);
  }

  // Optional: if you want to override immediate hide
  hideMegaMenu(): void {
    
    this.isMegaMenuVisible = false;
  }

  showInfoMenu(): void {
    clearTimeout(this.hideInfoMenuTimeout);
    this.isInfoMenuVisible = true;
  }

  hideInfoMenuWithDelay(): void {
    this.hideInfoMenuTimeout = setTimeout(() => {
      this.isInfoMenuVisible = false;
    }, 100);
  }

  hideInfoMenu(): void {
    this.isInfoMenuVisible = false;
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

  goToProductDetail(productId: number | undefined) {
    if (productId !== undefined && productId !== null) {
      this.router.navigate(['/product-detail', productId]);
      this.closeNotifications();
      this.selectedNotification = null;
    }
  }

  goToCategoryProduct(categoryId: number): void {
    this.router.navigate(['/category-products', categoryId]);
    this.hideMegaMenu();
  }

  goToWishlist() {
    this.router.navigate(['/wishlist']);
  }

  goToCart(){
    this.router.navigate(['/cart-preview']);
  }

  goToLogin(){
    this.router.navigate(['/login']);
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

  fetchNotifications(userId: number) {
    this.notificationService.getUserNotifications(userId).subscribe(
      (notis) => {
        // Check if any of these are scheduled notifications
        notis.forEach(noti => {
          const scheduledNoti = this.scheduledNotificationsRaw.find(sched => sched.id === noti.id);
          if (scheduledNoti) {
            // console.log('🚨 SCHEDULED NOTIFICATION FOUND IN BACKEND RESPONSE:', noti.title, 'ID:', noti.id);
            // console.log('  Scheduled details:', scheduledNoti);
          }
        });
        
        // Store all notifications without filtering initially
        this.notifications = notis.sort((a, b) => b.id - a.id);
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        
        // Apply filtering after both regular and scheduled notifications are loaded
        this.applyNotificationFiltering();
      }
    );
  }

  // New method to apply filtering after both notification types are loaded
  private applyNotificationFiltering() {
    if (this.scheduledNotificationsRaw.length === 0) {
      return;
    }
    
    const now = new Date();
    
    const filteredNotis = this.notifications.filter(noti => {
      // Check if this notification is in our scheduled notifications list
      const scheduledNoti = this.scheduledNotificationsRaw.find(sched => sched.id === noti.id);
      if (scheduledNoti) {
        // First check if it's within valid date range
        const isInValidRange = this.isScheduledNotificationInValidRange(scheduledNoti, now);
        
        if (!isInValidRange) {
          return false;
        }
        
        // Then check if it's actually due according to cron schedule
        const isDue = this.isScheduledNotificationDue(scheduledNoti, now);
        
        if (!isDue) {
          return false;
        }
        
      }
      return true;
    });
    
    // Update notifications with filtered result
    this.notifications = filteredNotis;
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.selectedNotification = null; // Always close modal when toggling dropdown
  }

  openNotification(notification: Notification) {
    this.showNotifications = false; // Close dropdown first
    this.selectedNotification = notification;
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        notification.isRead = true;
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      });
    }
  }

  closeNotificationDetail() {
    this.selectedNotification = null;
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  get filteredNotifications(): Notification[] {
    // Start with regular notifications (already filtered in fetchNotifications)
    let merged: Notification[] = [...this.notifications];
    
    // Only add scheduled notifications that are within valid date range and due
    const now = new Date();
    
    for (const sn of this.scheduledNotifications) {
      // Check if this scheduled notification is within valid date range
      if (this.isScheduledNotificationInValidRange(sn, now)) {
        // Avoid duplicates by id
        if (!merged.some(n => n.id === sn.id)) {
          merged.push(sn);
        }
      }
    }
    
    if (this.activeFilter === 'all') return merged;
    if (this.activeFilter === 'unread') return merged.filter(n => !n.isRead);
    if (this.activeFilter === 'orders') return merged.filter(n => n.type === 'ORDER');
    if (this.activeFilter === 'refunds') return merged.filter(n => n.type === 'REFUND');
    if (this.activeFilter === 'payment-due') return merged.filter(n => n.type === 'PAYMENT_DUE');
    return merged;
  }

  trackByNotificationId(index: number, noti: Notification) {
    return noti.id;
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'ORDER': return 'icon-order';
      case 'SYSTEM_ALERT': return 'icon-system-alert';
      case 'REFUND': return 'icon-refund';
      case 'MESSAGE': return 'icon-message';
      case 'PAYMENT_DUE': return 'icon-payment-due';
      default: return 'icon-default';
    }
  }

  getRelativeTime(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
    return d.toLocaleDateString();
  }

  getMetaLabel(type: string): string {
    switch (type) {
      case 'ORDER': return 'Order ID';
      case 'REFUND': return 'Refund ID';
      default: return 'Related ID';
    }
  }

  hasAction(notification: Notification): boolean {
    // Example: only orders, refunds, and payment due notifications have actions
    return ['ORDER', 'REFUND', 'PAYMENT_DUE'].includes(notification.type);
  }

  handleNotificationAction(notification: Notification, event?: Event) {
    if (event) event.stopPropagation();
    if (notification.type === 'ORDER' && notification.relatedObjectId) {
      this.router.navigate(['/customer-order-detail', notification.relatedObjectId]);
      this.closeNotifications();
      this.selectedNotification = null;
    } else if (notification.type === 'REFUND') {
      this.router.navigate(['/customer-order-refund', notification.relatedObjectId]);
      this.closeNotifications();
      this.selectedNotification = null;
    } else if (notification.type === 'PAYMENT_DUE' && notification.relatedObjectId) {
      this.router.navigate(['/customer-order-detail', notification.relatedObjectId]);
      this.closeNotifications();
      this.selectedNotification = null;
    }
  }

  viewAllNotifications() {
    this.router.navigate(['/notification']);
    this.closeNotifications();
  }

  getActionLabel(type: string): string {
    switch (type) {
      case 'ORDER': return 'View Order';
      case 'REFUND': return 'View Refund';
      case 'PAYMENT_DUE': return 'View Order';
      default: return 'View';
    }
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  markAllAsRead() {
    // Mark all as read locally and optionally call backend for each
    this.notifications.forEach(n => {
      if (!n.isRead) {
        this.notificationService.markAsRead(n.id).subscribe(() => {
          n.isRead = true;
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        });
      }
    });
    this.unreadCount = 0;
  }

  /**
   * Extracts the rejection reason from the notification message if present.
   * Returns an empty string if not found or not applicable.
   */
  getRejectionReason(notification: Notification | null | undefined): string {
    if (!notification || !notification.message) return '';
    const idx = notification.message.indexOf('Reason:');
    if (idx === -1) return '';
    // Extract after 'Reason:' and before the next <br>
    const after = notification.message.substring(idx + 7); // 7 = 'Reason:'.length
    const brIdx = after.indexOf('<br>');
    if (brIdx === -1) return after.trim();
    return after.substring(0, brIdx).trim();
  }

  /**
   * Returns a summary for refund acceptance notifications in the preview.
   * Shows only the first product and total refund amount if possible.
   * For other notifications, returns the original message.
   */
  getNotificationPreviewMessage(notification: Notification): string {
    if (notification.type === 'REFUND' && notification.title && notification.title.toLowerCase().includes('approved')) {
      // Try to extract the first product and total amount from the HTML message
      const div = document.createElement('div');
      div.innerHTML = notification.message || '';
      // Find the first <li> for product name
      const li = div.querySelector('li');
      let productLine = '';
      if (li) {
        // Try to extract the product name from the <li>
        const match = li.innerHTML.match(/<b>Product:<\/b>\s*([^<]+)/i);
        if (match) {
          productLine = match[1].trim();
        }
      }
      // Find all <b>Amount:</b> $xx.xx
      const amounts = Array.from(div.querySelectorAll('li')).map(li => {
        const m = li.innerHTML.match(/<b>Amount:<\/b>\s*\$([0-9.,]+)/i);
        return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
      });
      const total = amounts.reduce((a, b) => a + b, 0);
      // Format as 000,000 MMK
      const formattedTotal = total > 0 ? `${Math.round(total).toLocaleString('en-US', { minimumFractionDigits: 0 })} MMK` : '';
      if (productLine && total > 0) {
        return `<b>Refunded:</b> ${productLine} <br><b>Total:</b> ${formattedTotal}`;
      } else if (productLine) {
        return `<b>Refunded:</b> ${productLine}`;
      } else if (total > 0) {
        return `<b>Refunded Total:</b> ${formattedTotal}`;
      }
    }
    // Fallback: show the original message (truncated if too long)
    if (notification.message && notification.message.length > 300) {
      return notification.message.slice(0, 300) + '...';
    }
    return notification.message || '';
  }

  playNotificationFeedback() {
    try {
      const audio = new Audio('assets/mp3/bell-sound.mp3');
      audio.play().then(() => {
      }).catch(e => {
      });
    } catch (e) {
    }
    if (navigator.vibrate) {
      const didVibrate = navigator.vibrate([200, 100, 200]);
    } else {
    }
  }

  getSanitizedMessage(message: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(message);
  }

  // Helper: is a scheduled notification due now?
  isScheduledNotificationDue(noti: any, now: Date): boolean {
    
    if (!noti.active) {
      return false;
    }
    if (!noti.cronExpression) {
      return false;
    }
    
    // Parse dates properly - handle both string and Date objects
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (noti.startDate) {
      startDate = typeof noti.startDate === 'string' ? new Date(noti.startDate) : noti.startDate;
    }
    
    if (noti.endDate) {
      endDate = typeof noti.endDate === 'string' ? new Date(noti.endDate) : noti.endDate;
    }
    
    // Check start date
    if (startDate && startDate > now) {
      return false;
    }
    
    // Check end date
    if (endDate && endDate < now) {
      return false;
    }
    
    try {
      const interval = CronExpressionParser.parse(noti.cronExpression, { currentDate: now });
      const next = interval.next();
      const timeUntilNext = next.getTime() - now.getTime();
      const isDue = timeUntilNext < 60000 && timeUntilNext >= 0; // Within next 1 minute
      
      return isDue;
    } catch (e) {
      return false;
    }
  }

  // Helper: is a scheduled notification within valid date range?
  isScheduledNotificationInValidRange(noti: any, now: Date): boolean {
    if (!noti.active) {
      return false;
    }
    
    // Parse dates properly - handle both string and Date objects
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    if (noti.startDate) {
      startDate = typeof noti.startDate === 'string' ? new Date(noti.startDate) : noti.startDate;
    }
    
    if (noti.endDate) {
      endDate = typeof noti.endDate === 'string' ? new Date(noti.endDate) : noti.endDate;
    }
    
    // Log timezone information for debugging
    
    // Check start date
    if (startDate && startDate > now) {
      return false;
    }
    
    // Check end date
    if (endDate && endDate < now) {
      return false;
    }
    
    return true;
  }

  filterScheduledNotifications() {
    const now = new Date();
    
    this.scheduledNotifications = (this.scheduledNotificationsRaw || []).filter(noti => {
      
      // First check if notification is within valid date range
      if (!this.isScheduledNotificationInValidRange(noti, now)) {
        return false;
      }
      
      // Then check if it's due based on cron expression
      try {
        const interval = CronExpressionParser.parse(noti.cronExpression, { currentDate: now });
        const next = interval.next();
        const isDue = this.isScheduledNotificationDue(noti, now);
        return isDue;
      } catch (e) {
        return false;
      }
    });
    
  }

  // Debug method to manually test filtering
  debugScheduledNotifications() {
    console.log('=== DEBUG: Manual filtering test ===');
    console.log('Current time:', new Date());
    console.log('Raw scheduled notifications:', this.scheduledNotificationsRaw);
    this.filterScheduledNotifications();
    console.log('Filtered result:', this.scheduledNotifications);
    console.log('=== END DEBUG ===');
  }

  // Helper method to check if a notification is a scheduled notification
  isScheduledNotification(notification: any): boolean {
    return this.scheduledNotificationsRaw.some(sched => sched.id === notification.id);
  }

  // Debug method to check notification details
  debugNotification(notification: any) {
    console.log('=== DEBUG: Notification Details ===');
    console.log('Notification:', notification);
    console.log('Is scheduled notification:', this.isScheduledNotification(notification));
    if (this.isScheduledNotification(notification)) {
      const scheduledNoti = this.scheduledNotificationsRaw.find(sched => sched.id === notification.id);
      console.log('Scheduled details:', scheduledNoti);
      const now = new Date();
      console.log('Date range check:', this.isScheduledNotificationInValidRange(scheduledNoti, now));
    }
    console.log('=== END DEBUG ===');
  }

  // Test method to check all notifications
  debugAllNotifications() {
    console.log('=== DEBUG: All Notifications ===');
    console.log('Regular notifications count:', this.notifications.length);
    console.log('Scheduled notifications count:', this.scheduledNotifications.length);
    console.log('Raw scheduled notifications count:', this.scheduledNotificationsRaw.length);
    
    console.log('\nRegular notifications:');
    this.notifications.forEach((noti, index) => {
      console.log(`${index + 1}. ID: ${noti.id}, Title: ${noti.title}, Type: ${noti.type}`);
    });
    
    console.log('\nScheduled notifications:');
    this.scheduledNotifications.forEach((noti, index) => {
      console.log(`${index + 1}. ID: ${noti.id}, Title: ${noti.title}, Active: ${noti.active}, Start: ${noti.startDate}, End: ${noti.endDate}`);
    });
    
    console.log('\nRaw scheduled notifications:');
    this.scheduledNotificationsRaw.forEach((noti, index) => {
      console.log(`${index + 1}. ID: ${noti.id}, Title: ${noti.title}, Active: ${noti.active}, Start: ${noti.startDate}, End: ${noti.endDate}`);
    });
    
    console.log('=== END DEBUG ===');
  }

  // Force refresh notifications for testing
  forceRefreshNotifications() {
    if (this.user && this.user.id) {
      this.fetchNotifications(this.user.id);
      this.notificationService.getUserScheduledNotifications(this.user.id).subscribe((scheduled: any[]) => {
        this.scheduledNotificationsRaw = scheduled;
        this.filterScheduledNotifications();
        // Apply filtering to regular notifications after scheduled notifications are loaded
        this.applyNotificationFiltering();
      });
    }
  }


}


