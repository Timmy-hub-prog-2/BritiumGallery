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

  // ✅ Check only verified users (status 1)
  if (user?.status === 1) {
    // ✅ Only after login, check if address exists
    this.http.get<any[]>(`http://localhost:8080/api/addresses/user/${user.id}`).subscribe({
      next: (addresses) => {
        if (!addresses || addresses.length === 0) {
          // ✅ Only prompt if no address exists
          this.promptToAddAddress();
        }
      },
      error: () => {
        // Optional fallback
        this.promptToAddAddress();
      }
    });
  }
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

        <a href="https://www.flaticon.com/free-icons/google-maps" title="google maps icons"
           target="_blank" rel="noopener"
           style="font-size: 11px; color: gray; text-align: center;">
          
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
