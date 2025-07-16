import { Component, OnInit } from '@angular/core';
import { BlogService } from '../blog.service';

export interface BlogPost {
  id?: number;
  title: string;
  summary: string;
  content: string;
  author: string;
  imageUrl?: string;
  videoUrl?: string;
  publishDate: string;
  isMain?: boolean;
}
@Component({
  selector: 'app-blog-list',
  standalone: false,
  templateUrl: './blog-list.component.html',
  styleUrl: './blog-list.component.css'
})
export class BlogListComponent implements OnInit {
  blogs: BlogPost[] = [];

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.loadBlogs();
  }

  loadBlogs() {
    this.blogService.getAll().subscribe(data => {
      this.blogs = data;
    });
  }
}