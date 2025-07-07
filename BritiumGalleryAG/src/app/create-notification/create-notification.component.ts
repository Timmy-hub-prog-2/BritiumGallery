import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotificationService, CreateNotificationRequest } from '../services/notification.service';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { toHTML } from 'ngx-editor';

@Component({
  selector: 'app-create-notification',
  standalone: false,
  templateUrl: './create-notification.component.html',
  styleUrl: './create-notification.component.css'
})
export class CreateNotificationComponent implements OnInit {
  notificationForm: FormGroup;
  roles: any[] = [];
  customerTypes: any[] = [];
  isSubmitting = false;
  submitSuccess: string | null = null;
  submitError: string | null = null;
  editor!: Editor;
  toolbar: Toolbar = [
    [
      'bold', 'italic', 'underline', 'strike',
      'code', 'blockquote', 'ordered_list', 'bullet_list',
      'link', 'image', 'text_color', 'background_color',
      'align_left', 'align_center', 'align_right', 'align_justify',
      'undo', 'redo'
    ]
  ];

  showModal = false;
  editMode = false;
  editingNotificationId: number | null = null;
  scheduledNotifications: any[] = [];
  filterStatus: string = 'all';
  searchTerm: string = '';
  activeMenuId: number | null = null;

  // Returns the count of active scheduled notifications
  getActiveCount(): number {
    return this.scheduledNotifications.filter(n => n.active !== false).length;
  }

  // Returns the count of inactive scheduled notifications
  getInactiveCount(): number {
    return this.scheduledNotifications.filter(n => n.active === false).length;
  }

  setFilter(status: string) {
    this.filterStatus = status;
    this.onSearch();
  }

  onSearch() {
    // Triggers filteredNotifications getter to update
  }

  get filteredNotifications() {
    let filtered = this.scheduledNotifications;
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(n => n.active !== false);
    } else if (this.filterStatus === 'inactive') {
      filtered = filtered.filter(n => n.active === false);
    }
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(n =>
        (n.title && n.title.toLowerCase().includes(term)) ||
        (n.message && n.message.toLowerCase().includes(term)) ||
        (n.cronExpression && n.cronExpression.toLowerCase().includes(term))
      );
    }
    return filtered;
  }

  trackByNotificationId(index: number, noti: any) {
    return noti.id;
  }

  toggleActionMenu(id: number) {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  duplicateNotification(noti: any) {
    this.editMode = false;
    this.editingNotificationId = null;
    this.showModal = true;
    
    const formData = {
      mode: noti.mode || 'SCHEDULED',
      title: noti.title + ' (Copy)',
      message: noti.message,
      type: noti.type,
      roleIds: noti.roleIds || [],
      customerTypeIds: noti.customerTypeIds || [],
      actionLink: noti.actionLink || '',
      cronExpression: noti.cronExpression || '',
      startDate: this.formatDateForInput(noti.startDate),
      endDate: this.formatDateForInput(noti.endDate),
      active: noti.active !== false
    };
    
    // Use setTimeout to ensure the modal is fully rendered before patching values
    setTimeout(() => {
      this.notificationForm.patchValue(formData);
      
      // Trigger form validation
      this.notificationForm.updateValueAndValidity();
    }, 100);
  }

  toggleNotificationStatus(noti: any) {
    // Toggle status locally and call backend to persist
    const newActiveStatus = !noti.active;
    noti.active = newActiveStatus;
    
    // Call backend to update status
    this.notificationService.updateScheduledNotificationStatus(noti.id, newActiveStatus).subscribe({
      next: () => {
        // Success - status is already updated locally
        console.log('Notification status updated successfully');
      },
      error: (err) => {
        // Revert local change on error
        noti.active = !newActiveStatus;
        console.error('Failed to update notification status:', err);
        alert('Failed to update notification status. Please try again.');
      }
    });
  }

  constructor(private fb: FormBuilder, private notificationService: NotificationService) {
    this.notificationForm = this.fb.group({
      mode: ['INSTANT', Validators.required],
      title: ['', Validators.required],
      message: ['', Validators.required],
      type: ['', Validators.required],
      roleIds: [[], Validators.required],
      customerTypeIds: [[]],
      actionLink: [''],
      cronExpression: [''],
      startDate: [''],
      endDate: [''],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.editor = new Editor();
    this.notificationService.getAllRoles().subscribe(data => this.roles = data);
    this.notificationService.getAllCustomerTypes().subscribe(data => this.customerTypes = data);
    // Reset customerTypeIds if roles change and add validation
    this.notificationForm.get('roleIds')?.valueChanges.subscribe((roles: number[]) => {
      if (!roles.includes(3)) {
        this.notificationForm.patchValue({ customerTypeIds: [] });
        this.notificationForm.get('customerTypeIds')?.clearValidators();
      } else {
        // Add required validation for customer types when customer role is selected
        this.notificationForm.get('customerTypeIds')?.setValidators([Validators.required]);
      }
      this.notificationForm.get('customerTypeIds')?.updateValueAndValidity();
    });
    
    // Add validation for scheduled mode fields
    this.notificationForm.get('mode')?.valueChanges.subscribe((mode: string) => {
      if (mode === 'SCHEDULED') {
        this.notificationForm.get('cronExpression')?.setValidators([Validators.required]);
        this.notificationForm.get('startDate')?.setValidators([Validators.required]);
      } else {
        this.notificationForm.get('cronExpression')?.clearValidators();
        this.notificationForm.get('startDate')?.clearValidators();
      }
      this.notificationForm.get('cronExpression')?.updateValueAndValidity();
      this.notificationForm.get('startDate')?.updateValueAndValidity();
    });
    
    this.fetchScheduledNotifications();
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  get isScheduled(): boolean {
    return this.notificationForm.value.mode === 'SCHEDULED';
  }

  get showCustomerTypes(): boolean {
    return this.notificationForm.value.roleIds.includes(3);
  }

  openModal() {
    this.showModal = true;
    this.editMode = false;
    this.editingNotificationId = null;
    
    // Use setTimeout to ensure the modal is fully rendered before resetting
    setTimeout(() => {
      this.notificationForm.reset({ 
        mode: 'INSTANT', 
        roleIds: [], 
        customerTypeIds: [], 
        active: true 
      });
      
      // Trigger form validation
      this.notificationForm.updateValueAndValidity();
    }, 100);
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.editingNotificationId = null;
  }

  fetchScheduledNotifications() {
    this.notificationService.getScheduledNotifications().subscribe(data => {
      this.scheduledNotifications = data;
    });
  }

  // Helper method to format date for datetime-local input
  formatDateForInput(dateString: string | null): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Format to YYYY-MM-DDTHH:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  }

  editNotification(noti: any) {
    this.editMode = true;
    this.editingNotificationId = noti.id;
    this.showModal = true;
    
    // Use setTimeout to ensure the modal is fully rendered before patching values
    setTimeout(() => {
      const formData = {
        mode: noti.mode || 'SCHEDULED',
        title: noti.title,
        message: noti.message,
        type: noti.type,
        roleIds: noti.roleIds || [],
        customerTypeIds: noti.customerTypeIds || [],
        actionLink: noti.actionLink || '',
        cronExpression: noti.cronExpression || '',
        startDate: this.formatDateForInput(noti.startDate),
        endDate: this.formatDateForInput(noti.endDate),
        active: noti.active !== false
      };
      
      this.notificationForm.patchValue(formData);
      
      // Trigger form validation
      this.notificationForm.updateValueAndValidity();
      
      // Force change detection
      this.notificationForm.markAsTouched();
      this.notificationForm.markAsDirty();
    }, 100);
  }

  deleteNotification(noti: any) {
    if (confirm('Delete this notification?')) {
      this.notificationService.deleteScheduledNotification(noti.id).subscribe(() => {
        this.fetchScheduledNotifications();
      });
    }
  }

  onSubmit() {
    this.isSubmitting = true;
    this.submitSuccess = null;
    this.submitError = null;
    const formValue = this.notificationForm.value;
    // Get senderId from local storage (loggedInUser)
    let senderId: number | undefined = undefined;
    try {
      const user = localStorage.getItem('loggedInUser');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed && parsed.id) senderId = parsed.id;
      }
    } catch (e) {}
    // Convert message to HTML string if needed
    const messageHtml = typeof formValue.message === 'string' ? formValue.message : toHTML(formValue.message);
    const payload: CreateNotificationRequest = {
      mode: formValue.mode,
      title: formValue.title,
      message: messageHtml,
      type: formValue.type,
      roleIds: formValue.roleIds,
      customerTypeIds: formValue.roleIds.includes(3) ? formValue.customerTypeIds : undefined,
      actionLink: formValue.actionLink || undefined,
      cronExpression: this.isScheduled ? formValue.cronExpression : undefined,
      startDate: this.isScheduled ? formValue.startDate : undefined,
      endDate: this.isScheduled ? formValue.endDate : undefined,
      active: formValue.active,
      ...(senderId ? { senderId } : {})
    };
    
    if (this.editMode && this.editingNotificationId) {
      this.notificationService.updateScheduledNotification(this.editingNotificationId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = 'Notification updated successfully!';
          this.closeModal();
          this.fetchScheduledNotifications();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = err?.error?.error || 'Failed to update notification.';
          console.error('Backend error:', err?.error);
        }
      });
    } else {
      this.notificationService.createNotification(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = 'Notification created successfully!';
          this.closeModal();
          this.fetchScheduledNotifications();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.submitError = err?.error?.error || 'Failed to create notification.';
          console.error('Backend error:', err?.error);
        }
      });
    }
  }

  // Helper to get role name from id
  getRoleName(id: number): string {
    const role = this.roles.find(r => r.id === id);
    return role ? role.type : String(id);
  }

  // Helper to get customer type name from id
  getCustomerTypeName(id: number): string {
    const ct = this.customerTypes.find(c => c.id === id);
    return ct ? ct.name : String(id);
  }
}
