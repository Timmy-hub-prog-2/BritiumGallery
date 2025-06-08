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

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'categoryRegister/:parentId', component: CategoryRegisterComponent },
  { path: 'categoryEdit/:id', component: CategoryEditComponent },
  { path: 'categoryList', component: CategoryListComponent },
  { path: 'sub-category/:id', component: SubCategoryComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'content', component: ContentComponent },
  {path:'productRegister/:id',component:ProductRegisterComponent},
  { path: 'product-detail/:id', component: ProductDetailComponent },
  {path: 'addressform', component: AddressformComponent},
  {path: 'login' , component: LoginComponent},
 { path: 'addresslist', component: AddresslistComponent },
  {path: 'register', component: UserRegisterComponent},
  {path: 'verify-email', component: OtpVerificationComponent},
   { path: 'addressedit', component: AddresseditComponent }



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
