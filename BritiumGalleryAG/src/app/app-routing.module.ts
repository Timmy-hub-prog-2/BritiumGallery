import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CategoryRegisterComponent } from './category-register/category-register.component';
import { CategoryListComponent } from './category-list/category-list.component';
import { SubCategoryComponent } from './sub-category/sub-category.component';
import { ProductRegisterComponent } from './product-register/product-register.component';
import { ContactComponent } from './contact/contact.component';
import { ContentComponent } from './content/content.component';
import { CategoryEditComponent } from './category-edit/category-edit.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { AddressformComponent } from './addressform/addressform.component';
import { LoginComponent } from './login/login.component';
import { AddresslistComponent } from './addresslist/addresslist.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { OtpVerificationComponent } from './otp-verification/otp-verification.component';
import { AddresseditComponent } from './addressedit/addressedit.component';
import { CustomerDashboardComponent } from './customer-dashboard/customer-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { ChooseVerificationComponent } from './choose-verification/choose-verification.component';
import { ViewadminComponent } from './viewadmin/viewadmin.component';
import { ViewcustomerComponent } from './viewcustomer/viewcustomer.component';
import { ShopaddressformComponent } from './shopaddressform/shopaddressform.component';
import { ShopaddresslistComponent } from './shopaddresslist/shopaddresslist.component';
import { ShopaddresseditComponent } from './shopaddressedit/shopaddressedit.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { CartPreviewComponent } from './cart-preview/cart-preview.component';
import { CouponComponent } from './coupon/coupon.component';
import { ViewProfileComponent } from './view-profile/view-profile.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { CategoryProductComponent } from './category-product/category-product.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { DeliveryComponent } from './delivery/delivery.component';
import { PaymentListComponent } from './payment-list/payment-list.component';
import { PaymentRegisterComponent } from './payment-register/payment-register.component';
import { CustomerOrderListComponent } from './customer-order-list/customer-order-list.component';
import { PaymentComponent } from './payment/payment.component';
import { CustomerOrderDetailComponent } from './customer-order-detail/customer-order-detail.component';
import { AdminOrderListComponent } from './admin-order-list/admin-order-list.component';
import { AdminOrderDetailComponent } from './admin-order-detail/admin-order-detail.component';
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
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { DiscountEventsComponent } from './discount-events/discount-events.component';
import { BrandRegisterComponent } from './brand-register/brand-register.component';
import { ShippingReturnsPolicyComponent } from './shipping-returns-policy/shipping-returns-policy.component';
import { AboutComponent } from './about/about.component';
import { BlogCreateComponent } from './blog-create/blog-create.component';
import { CustomerHomepageComponent } from './customer-homepage/customer-homepage.component';
import { DiscountedItemsComponent } from './discounted-items/discounted-items.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { BlogListComponent } from './blog-list/blog-list.component';
import { CustomerMessageComponent } from './customer-message/customer-message.component';
import { AdminMessageComponent } from './admin-message/admin-message.component';
import { ShippingListComponent } from './shipping-list/shipping-list.component';
import { AboutListComponent } from './about-list/about-list.component';

import { CreateRoleComponent } from './create-role/create-role.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ShopMapViewComponent } from './shop-map-view/shop-map-view.component';

const routes: Routes = [
  { path: 'categoryRegister/:parentId', component: CategoryRegisterComponent },
  { path: 'categoryEdit/:id', component: CategoryEditComponent },
  { path: 'categoryList', component: CategoryListComponent },
  { path: 'sub-category/:id', component: SubCategoryComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'content', component: ContentComponent },
  { path: 'productRegister/:id', component: ProductRegisterComponent },
  { path: 'product-detail/:id', component: ProductDetailComponent },
  { path: 'product-edit/:id', component: ProductEditComponent },
  { path: 'addressform', component: AddressformComponent },
  { path: 'login', component: LoginComponent },
  { path: 'addresslist', component: AddresslistComponent },
  { path: 'register', component: UserRegisterComponent },
  { path: 'verify-email', component: OtpVerificationComponent },
  { path: 'addressedit', component: AddresseditComponent },
  { path: 'customer-dashboard', component: CustomerDashboardComponent },
  {path:'choose-verification',component: ChooseVerificationComponent},
  {path: 'otp-verification',component: OtpVerificationComponent},
  { path: 'viewadmin', component:ViewadminComponent},
  { path: 'viewcustomer', component:ViewcustomerComponent},
  { path: 'shopaddressform', component:ShopaddressformComponent},
 { path: 'shopaddresslist', component:ShopaddresslistComponent},
  { path: 'shopaddressedit', component:ShopaddresseditComponent},
  { path: 'wishlist', component: WishlistComponent },
  {path:'cart-preview',component:CartPreviewComponent},
  {path:'coupon',component:CouponComponent},
  {path:'view-profile',component:ViewProfileComponent},
  {path:'change-password',component:ChangePasswordComponent},
  {path:'category-products/:categoryId',component:CategoryProductComponent},
  { path: 'checkout', component: CheckoutComponent },
  {path:'delivery',component:DeliveryComponent},
  {path:'payment-register',component:PaymentRegisterComponent},
  {path:'payment-list',component:PaymentListComponent},
  {path:'payment-register/:id',component:PaymentRegisterComponent},
  {path:'customer-order-list',component:CustomerOrderListComponent},
  {path:'payment/:orderId',component:PaymentComponent},
  {path:'customer-order-detail/:orderId',component:CustomerOrderDetailComponent},
  {path:'admin-order-list',component:AdminOrderListComponent},
  {path:'admin-order-detail/:orderId',component:AdminOrderDetailComponent},
  {path:'admin-dashboard',component:AdminDashboardComponent},
  {path:'order-tracking',component:OrderTrackingComponent},
  {path:'order-refund',component:OrderRefundComponent},
  {path:'admin-order-refund/:refundId',component:AdminOrderRefundComponent},
   {path:'customer-order-refund/:refundId',component:CustomerOrderRefundComponent},
  {path:'admin-order-refund-list',component:AdminOrderRefundListComponent},
  {path:'customer-order-refund-list',component:CustomerComponentOrderRefundListComponent},
  {path:'terms',component:TermsComponent},
   {path:'privacypolicy',component:PrivacypolicyComponent},
    {path:'FAQ',component:FAQComponent},
{path:'FAQList',component:FAQListComponent},
{path:'create-notification',component:CreateNotificationComponent},
{ path: 'events', component: DiscountEventsComponent },
  { path: 'brand-register', component: BrandRegisterComponent },
  {path:'shippingpolicy',component:ShippingReturnsPolicyComponent},
  {path:'about',component:AboutComponent},
   {path:'blog',component:BlogCreateComponent},
 { path: 'shippinglist', component: ShippingListComponent },
  { path: 'aboutlist', component: AboutListComponent },
  { path: 'bloglist', component: BlogListComponent },
  { path: 'blogdetail/:id', component: BlogDetailComponent },
  { path: 'createrole', component: CreateRoleComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'customer-homepage', component: CustomerHomepageComponent },
  { path: 'discounted-items', component: DiscountedItemsComponent },
  { path: 'create-role', component: CreateRoleComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'shippinglist', component: ShippingListComponent },
  { path: 'aboutlist', component: AboutListComponent },       
  { path: 'customer-message', component: CustomerMessageComponent },
  { path: 'admin-message', component: AdminMessageComponent },
  { path: 'shopmapview', component: ShopMapViewComponent }
        



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
