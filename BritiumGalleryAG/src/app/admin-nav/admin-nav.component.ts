import { Component, ElementRef, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service'; // Adjust path as needed
import { User } from '../../user.model'; // Adjust path as needed
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../services/notification.service';
import { NotificationWebSocketService } from '../services/notification-websocket.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CronExpressionParser } from 'cron-parser';

@Component({
  selector: 'app-admin-nav',
  standalone: false,
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AdminNavComponent implements OnInit, OnDestroy {
  showUserBox = false;
  user: User | null = null;
  isProfileMenuVisible = false;
  private userSubscription: Subscription | undefined;

  // Notification properties
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  selectedNotification: Notification | null = null;
  activeFilter: string = 'all';
  
  // Scheduled notification properties
  scheduledNotifications: any[] = [];
  private scheduledNotificationsRaw: any[] = [];
  private scheduledInterval: any;

  constructor(
    private userService: UserService, 
    private router: Router, 
    private eRef: ElementRef,
    private notificationService: NotificationService,
    private notificationWebSocketService: NotificationWebSocketService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.currentUser.subscribe((user: User | null) => {
      this.user = user;
      
      // Fetch notifications for logged-in user
      if (user && user.id) {
        if (user.roleId === 2) {
          // Fetch admin notifications
          this.notificationService.getAdminNotifications().subscribe((notis) => {
            this.notifications = notis.sort((a, b) => b.id - a.id);
            this.unreadCount = this.notifications.filter(n => !n.isRead).length;
          });
          
          // Fetch scheduled notifications for admin
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
        } else {
          this.fetchNotifications(user.id);
          
          // Fetch scheduled notifications for regular users
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
        }
      }

      if (user) {
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
          
          const idx = this.notifications.findIndex(n => n.id === noti.id);
          if (idx !== -1) {
            // Update existing notification (e.g., isRead status)
            this.notifications[idx] = { ...this.notifications[idx], ...noti };
          } else {
            // Add new notification to the top
            this.notifications.unshift(noti);
            // Play sound and vibrate for new notification
            this.playNotificationFeedback();
          }
          // Update unread count
          this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.scheduledInterval) {
      clearInterval(this.scheduledInterval);
    }
  }

  toggleProfileMenu(event: Event): void {
    event.stopPropagation();
    if (this.user) {
      this.isProfileMenuVisible = !this.isProfileMenuVisible;
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.userService.logout();
    
    this.isProfileMenuVisible = false;
  }

  getProfileImageUrl(): string {
    if (this.user?.imageUrls && this.user.imageUrls.length > 0 && this.user.imageUrls[0]) {
      return this.user.imageUrls[0];
    }
    return 'https://res.cloudinary.com/dmbwaqjta/image/upload/v1748967961/Default_Photo_k8ihoe.png';
  }

  // Notification methods
  fetchNotifications(userId: number) {
    this.notificationService.getUserNotifications(userId).subscribe(
      (notis) => {
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
    return merged;
  }

  trackByNotificationId(index: number, noti: Notification) {
    return noti.id;
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'ORDER': return 'ORDER';
      case 'SYSTEM_ALERT': return 'SYSTEM_ALERT';
      case 'REFUND': return 'REFUND';
      case 'MESSAGE': return 'MESSAGE';
      default: return '';
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
    return ['ORDER', 'REFUND', 'STOCK'].includes(notification.type);
  }

  handleNotificationAction(notification: Notification, event?: Event) {
    if (event) event.stopPropagation();
    if (notification.type === 'ORDER' && notification.relatedObjectId) {
      this.router.navigate(['/admin-order-detail', notification.relatedObjectId]);
      this.closeNotifications();
      this.selectedNotification = null;
    } else if (notification.type === 'REFUND') {
      this.router.navigate(['/admin-order-refund', notification.relatedObjectId]);
      this.closeNotifications();
      this.selectedNotification = null;
    } else if (notification.type === 'STOCK' && notification.relatedObjectId) {
      // Go to product detail page
      this.router.navigate(['/product-edit', notification.relatedObjectId]);
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
      case 'STOCK': return 'Go to Product';
      default: return 'View';
    }
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  markAllAsRead() {
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

  getNotificationPreviewMessage(notification: Notification): string {
    if (notification.type === 'REFUND' && notification.title && notification.title.toLowerCase().includes('approved')) {
      const div = document.createElement('div');
      div.innerHTML = notification.message || '';
      const li = div.querySelector('li');
      let productLine = '';
      if (li) {
        const match = li.innerHTML.match(/<b>Product:<\/b>\s*([^<]+)/i);
        if (match) {
          productLine = match[1].trim();
        }
      }
      const amounts = Array.from(div.querySelectorAll('li')).map(li => {
        const m = li.innerHTML.match(/<b>Amount:<\/b>\s*\$([0-9.,]+)/i);
        return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
      });
      const total = amounts.reduce((a, b) => a + b, 0);
      const formattedTotal = total > 0 ? `${Math.round(total).toLocaleString('en-US', { minimumFractionDigits: 0 })} MMK` : '';
      if (productLine && total > 0) {
        return `<b>Refunded:</b> ${productLine} <br><b>Total:</b> ${formattedTotal}`;
      } else if (productLine) {
        return `<b>Refunded:</b> ${productLine}`;
      } else if (total > 0) {
        return `<b>Refunded Total:</b> ${formattedTotal}`;
      }
    }
    if (notification.message && notification.message.length > 300) {
      return notification.message.slice(0, 300) + '...';
    }
    return notification.message || '';
  }

  getSanitizedMessage(message: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(message);
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

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const profileButton = document.querySelector('.profile-button');
    const profileMenu = document.querySelector('.profile-dropdown-menu');
    const notificationTrigger = document.querySelector('.notification-trigger');
    const notificationDropdown = document.querySelector('.notification-dropdown');
    
    // Close profile menu if clicked outside
    if (profileMenu && !profileMenu.contains(target) && profileButton && !profileButton.contains(target)) {
      this.isProfileMenuVisible = false;
    }
    
    // Close notification dropdown if clicked outside
    if (notificationDropdown && !notificationDropdown.contains(target) && notificationTrigger && !notificationTrigger.contains(target)) {
      this.closeNotifications();
    }
  }
}