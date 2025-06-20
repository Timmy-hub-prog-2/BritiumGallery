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
    customerType: '' 
  };

  selectedFile?: File;
  profileImageUrlWithTimestamp: string = '';
  mainAddress: string = 'Loading...';

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private addressService: AddressService
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.updateProfileImageUrl();
      this.loadMainAddress(this.user.id);
    }
  }

  loadMainAddress(userId: number): void {
    this.addressService.getMainAddressByUserId(userId).subscribe({
      next: (address: AddressDTO) => {
      this.mainAddress =`${address.houseNumber}, ${address.wardName},${address.street}, ${address.township}, ${address.city},${address.state}`;
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
    console.log('this user : ', this.user);
    console.log('file : ', this.selectedFile);

    this.userService.updateUserProfile(this.user, this.selectedFile).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.userService.setLoggedInUser(updatedUser);
        this.updateProfileImageUrl();
        alert('Profile saved successfully!');
      },
      error: () => {
        alert('Failed to save profile. Please try again.');
      },
    });
  }

  updateProfileImageUrl(): void {
    if (this.user?.imageUrls && this.user.imageUrls.length > 0) {
      const baseUrl = this.user.imageUrls[0];
      const isBase64 = baseUrl.startsWith('data:image');
  
      this.profileImageUrlWithTimestamp = isBase64
        ? baseUrl // no timestamp for preview
        : baseUrl + '?t=' + new Date().getTime(); // for real URLs
    } else {
      this.profileImageUrlWithTimestamp = 'assets/default-profile.png';
    }
  
    this.cdr.detectChanges();
  }
    

  goToChangePassword() {
    this.router.navigate(['/change-password']);
  }
}
