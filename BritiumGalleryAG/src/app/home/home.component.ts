import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  urlParam: number = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    console.log('👤 Loaded user:', user);

    if (user?.status === 1) {
      console.log('✅ User is verified. Showing welcome sticker...');


      // 🕒 Delay address check to prevent alert overlap
      setTimeout(() => {
        console.log('📦 Checking address...');
        this.checkAddress(user.id);
      }, 3500); // show address alert after 3.5 sec
    } else {
      console.log('❌ User is not verified or missing.');
    }
  }



  checkAddress(userId: number) {
    this.http.get<any[]>(`http://localhost:8080/api/addresses/user/${userId}`).subscribe({
      next: (addresses) => {
        console.log('📍 Address check result:', addresses);
        if (!addresses || addresses.length === 0) {
          this.promptToAddAddress();
        }
      },
      error: (err) => {
        console.warn('⚠️ Error fetching address:', err);
        this.promptToAddAddress();
      }
    });
  }

  promptToAddAddress() {
    Swal.fire({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <img src="assets/img/google-maps.png" alt="Google Maps" width="160" style="margin-bottom: 24px;" />

          <div style="font-size: 18px; font-weight: normal; margin-bottom: 16px; text-align: center;">
            📍 You haven't added any address yet
          </div>

          <a href="/addressform" style="color: #2563eb; font-weight: 500; text-decoration: underline; margin-bottom: 12px;">
            Add address here
          </a>
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      background: '#fff',
      width: 420,
      padding: '2.5em',
      customClass: {
        popup: 'rounded-xl custom-swal-popup',
        closeButton: 'custom-swal-close'
      }
    });
  }

  logout() {
    localStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }
}
