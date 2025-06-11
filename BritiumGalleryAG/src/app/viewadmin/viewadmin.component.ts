import { Component, OnInit, ViewChild } from '@angular/core';
import { People } from '../People';
import { PeopleService } from '../people.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-viewadmin',
  standalone: false,
  templateUrl: './viewadmin.component.html',
  styleUrls: ['./viewadmin.component.css']
})
export class ViewadminComponent implements OnInit {
  displayedColumns: string[] = ['no', 'name', 'email', 'gender', 'phNumber', 'address'];
  dataSource: MatTableDataSource<People> = new MatTableDataSource<People>();
  searchText: string = '';
  pageIndex: number = 0;
  pageSize: number = 5;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private peopleService: PeopleService) {}

  ngOnInit(): void {
    this.loadAdmins();
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
}