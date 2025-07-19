import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ReactiveFormsModule} from '@angular/forms';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { NavigationComponent } from './navigation/navigation.component';
import { ContentComponent } from './content/content.component';
import { FooterComponent } from './footer/footer.component';
import { AdminNavComponent } from './admin-nav/admin-nav.component';

import { HomeComponent } from './home/home.component';
import { CategoryRegisterComponent } from './category-register/category-register.component';
import { CategoryListComponent } from './category-list/category-list.component';
import { SubCategoryComponent } from './sub-category/sub-category.component';
import { ProductCardComponent } from './product-card/product-card.component';
import { ContactComponent } from './contact/contact.component';
import { CategoryEditComponent } from './category-edit/category-edit.component';
import { ProductRegisterComponent } from './product-register/product-register.component';
import { CustomerComponent } from './customer/customer.component';
import { AdminHeaderComponent } from './admin-header/admin-header.component';
import { AdminComponent } from './admin/admin.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { AttributeOptionsModalComponent } from './attribute-options-modal/attribute-options-modal.component';
import { AddressformComponent } from './addressform/addressform.component';
import { LoginComponent } from './login/login.component';
import { AddresseditComponent } from './addressedit/addressedit.component';
import { AddresslistComponent } from './addresslist/addresslist.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ProductEditModule } from './product-edit/product-edit.module';
import { ChooseVerificationComponent } from './choose-verification/choose-verification.component';
import { ViewcustomerComponent } from './viewcustomer/viewcustomer.component';
import { ViewadminComponent } from './viewadmin/viewadmin.component';
import { ShopaddressformComponent } from './shopaddressform/shopaddressform.component';
import { ShopaddresseditComponent } from './shopaddressedit/shopaddressedit.component';
import { ShopaddresslistComponent } from './shopaddresslist/shopaddresslist.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { CartPreviewComponent } from './cart-preview/cart-preview.component';
import { CouponComponent } from './coupon/coupon.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { CategoryProductComponent } from './category-product/category-product.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { PaymentListComponent } from './payment-list/payment-list.component';
import { PaymentRegisterComponent } from './payment-register/payment-register.component';
import { CustomerOrderListComponent } from './customer-order-list/customer-order-list.component';
import { PaymentComponent } from './payment/payment.component';
import { CustomerOrderDetailComponent } from './customer-order-detail/customer-order-detail.component';
import { AdminOrderListComponent } from './admin-order-list/admin-order-list.component';
import { AdminOrderDetailComponent } from './admin-order-detail/admin-order-detail.component';
  import { NgChartsModule } from 'ng2-charts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { OrderTrackingComponent } from './order-tracking/order-tracking.component';
import { OrderRefundComponent } from './order-refund/order-refund.component';
import { AdminOrderRefundComponent } from './admin-order-refund/admin-order-refund.component';
import { AdminOrderRefundListComponent } from './admin-order-refund-list/admin-order-refund-list.component';
import { CustomerComponentOrderRefundListComponent } from './customer-order-refund-list/customer-order-refund-list.component';
import { CustomerOrderRefundComponent } from './customer-order-refund/customer-order-refund.component';
import { TermsComponent } from './terms/terms.component';
import { PrivacypolicyComponent } from './privacypolicy/privacypolicy.component';
import { FAQComponent } from './faq/faq.component';
import { FAQListComponent } from './faqlist/faqlist.component';
import { NotificationComponent } from './notification/notification.component';
import { NgxEditorModule } from 'ngx-editor';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ManagerComponent } from './manager/manager.component';
import { ManagerSidebarComponent } from './manager-sidebar/manager-sidebar.component';
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { DiscountEventsComponent } from './discount-events/discount-events.component';
import { MapToAttributeLinePipe } from './map-to-attribute-line.pipe';
import { BrandRegisterComponent } from './brand-register/brand-register.component';
import { ShippingReturnsPolicyComponent } from './shipping-returns-policy/shipping-returns-policy.component';
import { AboutComponent } from './about/about.component';
import { BlogCreateComponent } from './blog-create/blog-create.component';
import { CategoryFilterPipe } from './category-filter.pipe';
import { ProductFilterPipe } from './product-filter.pipe';

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    ContentComponent,
    FooterComponent,
    AdminNavComponent,
    HomeComponent,
    CategoryRegisterComponent,
    CategoryListComponent,
    SubCategoryComponent,
    ProductCardComponent,
    ContactComponent,
    CategoryEditComponent,
    ProductRegisterComponent,
    CustomerComponent,
    AdminHeaderComponent,
    AdminComponent,
    ProductDetailComponent,
    AttributeOptionsModalComponent,
    AddressformComponent,
    LoginComponent,
    AddresseditComponent,
    AddresslistComponent,
    UserRegisterComponent,
    OtpVerificationComponent,
    CustomerDashboardComponent,
    AdminDashboardComponent,
    ChooseVerificationComponent,
    ViewcustomerComponent,
    ViewadminComponent,
    ShopaddressformComponent,
    ShopaddresseditComponent,
    ShopaddresslistComponent,
    WishlistComponent,
    CartPreviewComponent,
    CouponComponent,
    ViewProfileComponent,
    ChangePasswordComponent,
    DeliveryComponent,
    CheckoutComponent,
    PaymentListComponent,
    PaymentRegisterComponent,
    CustomerOrderListComponent,
    PaymentComponent,
    CustomerOrderDetailComponent,
    AdminOrderListComponent,
    AdminOrderDetailComponent,
    OrderTrackingComponent,
    OrderRefundComponent,
    AdminOrderRefundComponent,
    AdminOrderRefundListComponent,
    CustomerComponentOrderRefundListComponent,
    CustomerOrderRefundComponent,TermsComponent,
    PrivacypolicyComponent,
    FAQComponent,
    FAQListComponent,
    NotificationComponent,
    CreateNotificationComponent,
    SidebarComponent,
    DiscountEventsComponent,
    ManagerComponent,
    ManagerSidebarComponent,
    ShippingReturnsPolicyComponent,
    AboutComponent,
    BlogCreateComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    ProductEditModule,
    MatPaginatorModule,
    CommonModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    NgChartsModule,
    MatOptionModule,
    CategoryProductComponent,
    NgApexchartsModule,
    NgxEditorModule,
    MapToAttributeLinePipe,
    BrandRegisterComponent,
    CategoryFilterPipe,
    ProductFilterPipe
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
