import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { User } from '../../user.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(private userService: UserService) {}

  /**
   * Get current user's role ID
   */
  getCurrentUserRoleId(): number | null {
    const user = this.userService.userValue;
    return user ? user.roleId : null;
  }

  /**
   * Check if user has permission to perform order management actions
   * Customer Support (roleId: 5) can only view, not modify
   */
  canManageOrders(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 4; // Super Admin, Admin, Manager
  }

  /**
   * Check if user has permission to perform refund management actions
   * Customer Support (roleId: 5) can only view, not approve/reject
   */
  canManageRefunds(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 4; // Super Admin, Admin, Manager
  }

  /**
   * Check if user can update order status
   */
  canUpdateOrderStatus(): boolean {
    return this.canManageOrders();
  }

  /**
   * Check if user can approve refunds
   */
  canApproveRefunds(): boolean {
    return this.canManageRefunds();
  }

  /**
   * Check if user can reject refunds
   */
  canRejectRefunds(): boolean {
    return this.canManageRefunds();
  }

  /**
   * Check if user can view orders (all roles that have access to orders)
   */
  canViewOrders(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 4 || roleId === 5; // All except Growth Lead
  }

  /**
   * Check if user can view refunds (all roles that have access to refunds)
   */
  canViewRefunds(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 4 || roleId === 5; // All except Growth Lead
  }

  /**
   * Check if user can manage products and categories
   */
  canManageProducts(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 4; // Super Admin, Admin, Manager
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 4; // Super Admin, Admin, Manager
  }

  /**
   * Check if user can manage notifications
   */
  canManageNotifications(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 5 || roleId === 6; // Super Admin, Admin, Customer Support, Growth Lead
  }

  /**
   * Check if user can manage promotions and sales
   */
  canManagePromotions(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2 || roleId === 6; // Super Admin, Admin, Growth Lead
  }

  /**
   * Check if user can manage system settings
   */
  canManageSystemSettings(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2; // Super Admin, Admin only
  }

  /**
   * Get role name for display purposes
   */
  getRoleName(roleId: number): string {
    switch (roleId) {
      case 1: return 'Super Admin';
      case 2: return 'Admin';
      case 3: return 'Customer';
      case 4: return 'Manager';
      case 5: return 'Customer Support';
      case 6: return 'Growth Lead';
      default: return 'Unknown';
    }
  }

  /**
   * Check if current user is customer support
   */
  isCustomerSupport(): boolean {
    return this.getCurrentUserRoleId() === 5;
  }

  /**
   * Check if current user is admin or super admin
   */
  isAdmin(): boolean {
    const roleId = this.getCurrentUserRoleId();
    return roleId === 1 || roleId === 2;
  }

  /**
   * Check if current user is manager
   */
  isManager(): boolean {
    return this.getCurrentUserRoleId() === 4;
  }
} 