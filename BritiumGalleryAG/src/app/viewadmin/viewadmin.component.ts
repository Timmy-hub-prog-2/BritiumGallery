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
  displayedColumns: string[] = ['no', 'name', 'email', 'gender', 'phNumber', 'address', 'role', 'status'];
  dataSource: MatTableDataSource<People> = new MatTableDataSource<People>();
  searchText: string = '';
  selectedRole: string = '';
  roles: any[] = [];
  pageIndex: number = 0;
  pageSize: number = 5;
  selectedStatus: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private peopleService: PeopleService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadAdmins();
    this.setupFilterPredicate();
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: People, filter: string): boolean => {
      const [search, role] = filter.split('$');
      const matchesSearch =
        data.name?.toLowerCase().includes(search) ||
        data.email?.toLowerCase().includes(search);

      const matchesRole =
        !role || data.roleName?.toLowerCase().trim() === role;

      return matchesSearch && matchesRole;
    };
  }

  loadRoles(): void {
    this.http.get<any[]>('http://localhost:8080/api/roles/except-customer').subscribe((data) => {
      this.roles = data;
      console.log(this.roles);
    });
  }

  onRoleFilterChange(): void {
    this.applyFilter(); // just reapply the filter
  }

  loadAdmins(): void {
    this.peopleService.getAdmins(this.selectedStatus).subscribe((data: People[]) => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.setupFilterPredicate(); // Ensure predicate is set after new data
      this.applyFilter();
    });
  }

  filterByStatus(): void {
    this.loadAdmins(); // will call applyFilter inside
  }

  applyFilter(): void {
    const filterValue = this.searchText.trim().toLowerCase() + '$' + this.selectedRole.trim().toLowerCase();
    this.dataSource.filter = filterValue;
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
      address.wardName,
      address.street,
      address.township,
      address.city,
      address.state
    ];
    return addressParts.filter(part => part != null && part.trim() !== '').join(', ');
  }
}
