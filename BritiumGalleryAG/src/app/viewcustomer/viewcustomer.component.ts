import { Component, OnInit, ViewChild } from '@angular/core';
import { Address, People } from '../People';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';  
import { PeopleService } from '../people.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-viewcustomer',
  standalone: false,
  templateUrl: './viewcustomer.component.html',
  styleUrls: ['./viewcustomer.component.css']
})
export class ViewcustomerComponent implements OnInit {
  displayedColumns: string[] = ['no', 'name', 'email', 'gender', 'phNumber', 'address'];
  dataSource: MatTableDataSource<People> = new MatTableDataSource<People>();
  searchText: string = '';
  pageIndex: number = 0;
  pageSize: number = 5;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private peopleService: PeopleService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.peopleService.getCustomers().subscribe((data: People[]) => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  // Apply search filter
  applyFilter(): void {
    this.dataSource.filter = this.searchText.trim().toLowerCase();
  }

  // Handle page change and update the pagination
  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  // Get the correct row number for each item
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