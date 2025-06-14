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
import { CartPreviewComponent } from './cart-preview/cart-preview.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
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
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  {path:'choose-verification',component: ChooseVerificationComponent},
  {path: 'otp-verification',component: OtpVerificationComponent},
  { path: 'viewadmin', component:ViewadminComponent},
{ path: 'viewcustomer', component:ViewcustomerComponent},
{ path: 'shopaddressform', component:ShopaddressformComponent},
 { path: 'shopaddresslist', component:ShopaddresslistComponent},
  { path: 'shopaddressedit', component:ShopaddresseditComponent},
  {path: 'cart', component: CartPreviewComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
