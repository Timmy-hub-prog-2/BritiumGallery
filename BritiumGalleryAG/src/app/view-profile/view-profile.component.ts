import { ChangeDetectorRef, Component } from '@angular/core';

import { User } from '../../user.model';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AddressService } from '../address.service';
import { AddressDTO } from '../../AddressDTO';

@Component({
  selector: 'app-view-profile',
  standalone: false,
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css',
})
export class ViewProfileComponent {
  user: User = {
    id: 0,
    name: '',
    email: '',
    phoneNumber: '',
    imageUrls: [],
    gender: '',
    password:'',
    status: 0,
    roleId: 3,
    address: '',
    customerType: '',
    totalSpend: 0
  };

  selectedFile?: File;
  profileImageUrlWithTimestamp: string = '';
  mainAddress: string = 'Loading...';
  isSaving: boolean = false;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private addressService: AddressService
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      const localUser = JSON.parse(storedUser);
      // Always fetch the latest profile from backend
      this.userService.getUserProfileById(localUser.id).subscribe({
        next: (profile) => {
          this.user = { ...localUser, ...profile };
          console.log('Loaded user profile:', this.user);
          this.updateProfileImageUrl();
          this.loadMainAddress(this.user.id);
        },
        error: (err) => {
          // fallback to local user if backend fails
          this.user = localUser;
          this.updateProfileImageUrl();
          this.loadMainAddress(this.user.id);
        }
      });
    }
  }

  loadMainAddress(userId: number): void {
    this.addressService.getMainAddressByUserId(userId).subscribe({
      next: (address: AddressDTO | null) => {
        if (address) {
          this.mainAddress = `${address.houseNumber}, ${address.wardName},${address.street}, ${address.township}, ${address.city},${address.state}`;
        } else {
          this.mainAddress = 'No address found';
        }
      },
      error: (err) => {
        console.error('Error loading main address', err);
        this.mainAddress = 'No address found';
      }
    });
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.imageUrls = [e.target.result];
        this.updateProfileImageUrl();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  saveProfile(): void {
    this.isSaving = true;
    console.log('this user : ', this.user);
    console.log('file : ', this.selectedFile);

    this.userService.updateUserProfile(this.user, this.selectedFile).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.userService.setLoggedInUser(updatedUser);
        this.updateProfileImageUrl();
        alert('Profile saved successfully!');
        this.isSaving = false;
      },
      error: () => {
        alert('Failed to save profile. Please try again.');
        this.isSaving = false;
      },
    });
  }

  updateProfileImageUrl(): void {
    if (this.user?.imageUrls && this.user.imageUrls.length > 0 && this.user.imageUrls[0]) {
      const baseUrl = this.user.imageUrls[0];
      const isBase64 = baseUrl.startsWith('data:image');
  
      this.profileImageUrlWithTimestamp = isBase64
        ? baseUrl // no timestamp for preview
        : baseUrl + '?t=' + new Date().getTime(); // for real URLs
    } else {
      // Use Cloudinary default image URL as fallback
      this.profileImageUrlWithTimestamp = 'https://res.cloudinary.com/dmbwaqjta/image/upload/v1748967961/Default_Photo_k8ihoe.png';
    }
  
    this.cdr.detectChanges();
  }
    

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }

  getCustomerTypeRange(): string {
    if (!this.user || typeof this.user.totalSpend !== 'number') return '';
    const spend = this.user.totalSpend;
    if (spend < 3000000) {
      return `Normal (0 - 2,999,999 MMK)`;
    } else if (spend < 6000000) {
      return `Loyalty (3,000,000 - 5,999,999 MMK)`;
    } else {
      return `VIP (6,000,000+ MMK)`;
    }
  }

  // Add these methods to your component class
getCustomerTypeBadgeClass(): string {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend >= 6000000) return "vip"
    if (totalSpend >= 3000000) return "loyalty"
    return "normal"
  }

  getSpendingPercentage(): number {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend >= 6000000) return 100
    return Math.min((totalSpend / 6000000) * 100, 100)
  }

  getProgressColor(): string {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend >= 6000000) return "#f57c00" // VIP - Orange
    if (totalSpend >= 3000000) return "#2e7d32" // Loyalty - Green
    return "#1976d2" // Normal - Blue
  }

  getSpendingStatusClass(): string {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend >= 6000000) return "success"
    if (totalSpend >= 3000000) return "warning"
    return "info"
  }

  getSpendingStatusMessage(): string {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend >= 6000000) {
      return "Congratulations! You are a VIP customer!"
    }
    if (totalSpend >= 3000000) {
      const remaining = 6000000 - totalSpend
      return `${remaining.toLocaleString()} MMK more to reach VIP status`
    }
    const remaining = 3000000 - totalSpend
    return `${remaining.toLocaleString()} MMK more to reach Loyalty status`
  }

  getProgressGradient(): string {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend >= 6000000) {
      return "linear-gradient(90deg, #f57c00, #ffb74d)" // VIP - Orange gradient
    }
    if (totalSpend >= 3000000) {
      return "linear-gradient(90deg, #2e7d32, #66bb6a)" // Loyalty - Green gradient
    }
    return "linear-gradient(90deg, #1976d2, #42a5f5)" // Normal - Blue gradient
  }

  getNextTierMessage(): string {
    const totalSpend = this.user?.totalSpend ?? 0
    if (totalSpend < 3000000) {
      const remaining = 3000000 - totalSpend
      return `Spend ${remaining.toLocaleString()} MMK more to reach Loyalty status`
    }
    if (totalSpend < 6000000) {
      const remaining = 6000000 - totalSpend
      return `Spend ${remaining.toLocaleString()} MMK more to reach VIP status`
    }
    return ""
  }

  // Add this method for tier class binding in the template
  getCustomerTierClass(): string {
    const totalSpend = this.user?.totalSpend ?? 0;
    if (totalSpend >= 6000000) return 'vip';
    if (totalSpend >= 3000000) return 'loyalty';
    return 'normal';
  }

  getRoleName(): string {
    switch (this.user.roleId) {
      case 1:
        return 'Superadmin';
      case 2:
        return 'Admin';
      case 3:
        return '';
      case 4:
        return 'Manager';
      case 5:
        return 'Customer Support';
      case 6:
        return 'Growth Lead';
      default:
        return 'User';
    }
  }


}
