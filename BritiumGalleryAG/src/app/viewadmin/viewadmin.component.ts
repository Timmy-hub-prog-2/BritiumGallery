import { Component, OnInit, ViewChild } from '@angular/core';
import { Address, People } from '../People';
import { PeopleService } from '../people.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-viewadmin',
  standalone: false,
  templateUrl: './viewadmin.component.html',
  styleUrls: ['./viewadmin.component.css']
})
export class ViewadminComponent implements OnInit {
  displayedColumns: string[] = ['no', 'name', 'email', 'gender', 'phNumber', 'address','role'];
  dataSource: MatTableDataSource<People> = new MatTableDataSource<People>();
  searchText: string = '';
  selectedRole: string = ''; // This will store the selected role from the dropdown
  roles: any[] = []; 
  pageIndex: number = 0;
  pageSize: number = 5;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private peopleService: PeopleService,private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadAdmins();
  }

   loadRoles(): void {
    this.http.get<any[]>('http://localhost:8080/api/roles/except-customer').subscribe((data) => {
      this.roles = data;  // Store fetched roles in the roles array
    });
  }

onRoleFilterChange(): void {
  const roleFilter = this.selectedRole.trim().toLowerCase();
  this.dataSource.filterPredicate = (data: People, filter: string): boolean => {
    const matchesSearchText =
      data.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
      data.email.toLowerCase().includes(this.searchText.toLowerCase());

    const matchesRole = !roleFilter || data.roleName?.toLowerCase() === roleFilter;

    return matchesSearchText && matchesRole;
  };

  this.dataSource.filter = `${this.searchText}${this.selectedRole}`.trim().toLowerCase();
}

  loadAdmins(): void {
    this.peopleService.getAdmins().subscribe((data: People[]) => {
      console.log(data);
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getRowNumber(index: number): number {
    return this.pageIndex * this.pageSize + index + 1;
  }
 getFullAddress(address: Address | null | undefined): string {
  if (!address) return '';
  
  const addressParts = [
    address.houseNumber,
    address.wardName,  // Use wardName, not wardNumber
    address.street,
    address.township,
    address.city,
    address.state  // Use state, not stateOrRegion
  ];

  return addressParts.filter(part => part != null && part.trim() !== '').join(', ');
}

}