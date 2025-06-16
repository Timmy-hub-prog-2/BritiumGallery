import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-choose-verification',
  standalone: false,
  templateUrl: './choose-verification.component.html',
  styleUrls: ['./choose-verification.component.css']
})
export class ChooseVerificationComponent {
  email: string = '';
  phone: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.phone = params['phone'] || '';
    });
  }

  chooseEmail() {
    this.router.navigate(['/otp-verification'], {
      queryParams: { identifier: this.email, useSms: false }
    });
  }

  chooseSms() {
    this.router.navigate(['/otp-verification'], {
      queryParams: { identifier: this.phone, useSms: true }
    });
  }
}
