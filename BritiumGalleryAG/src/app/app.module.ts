import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
import { HeaderComponent } from './header/header.component';
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
import { MatPaginatorModule } from '@angular/material/paginator';
import { ChooseVerificationComponent } from './choose-verification/choose-verification.component';
import { ViewcustomerComponent } from './viewcustomer/viewcustomer.component';
import { ViewadminComponent } from './viewadmin/viewadmin.component';
import { ShopaddressformComponent } from './shopaddressform/shopaddressform.component';
import { ShopaddresseditComponent } from './shopaddressedit/shopaddressedit.component';
import { ShopaddresslistComponent } from './shopaddresslist/shopaddresslist.component';


import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CartPreviewComponent } from './cart-preview/cart-preview.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
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
    CartPreviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    ProductEditModule,
    MatPaginatorModule,
    MatSnackBarModule,

  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
