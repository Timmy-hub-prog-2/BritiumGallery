import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  selector: 'app-blog-create',
  standalone: false,
  templateUrl: './blog-create.component.html',
  styleUrls: ['./blog-create.component.css']
})
export class BlogCreateComponent implements OnInit {
  blog: BlogPost = {
    title: '',
    summary: '',
    content: '',
    author: '',
    publishDate: ''
  };

  selectedFile!: File;
  isVideo: boolean = false;
  blogs: BlogPost[] = [];
  editingId?: number;

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.loadBlogs();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.isVideo = this.selectedFile?.type.startsWith('video/');
  }

  submit() {
    if (!this.blog.title.trim() || !this.blog.summary.trim() || !this.blog.content.trim() || !this.blog.author.trim() || !this.blog.publishDate) {
      alert('Please fill in all fields before submitting the blog.');
      return;
    }

    const formData = new FormData();
    formData.append('post', new Blob([JSON.stringify(this.blog)], { type: 'application/json' }));

    if (this.selectedFile) {
      const fileType = this.selectedFile.type;
      if (fileType.startsWith('video/')) {
        formData.append('video', this.selectedFile);
      } else if (fileType.startsWith('image/')) {
        formData.append('image', this.selectedFile);
      } else {
        alert('Only image or video files are allowed.');
        return;
      }
    }

    if (this.editingId) {
      this.blogService.update(this.editingId, formData).subscribe(() => {
        alert('Blog updated!');
        this.resetForm();
        this.loadBlogs();
      });
    } else {
      this.blogService.create(formData).subscribe(() => {
        alert('Blog created!');
        this.resetForm();
        this.loadBlogs();
      });
    }
  }

  loadBlogs() {
    this.blogService.getAll().subscribe(data => {
      
      this.blogs = data;
    });
  }

  editBlog(blog: BlogPost) {
    this.blog = { ...blog };
    this.editingId = blog.id;
  }

  deleteBlog(id: number) {
    if (confirm('Are you sure you want to delete this blog?')) {
      this.blogService.delete(id).subscribe(() => {
        this.loadBlogs();
      });
    }
  }

  setAsMain(blogId: number) {
    if (confirm('Set this blog as the main blog?')) {
      this.blogService.setMain(blogId).subscribe(() => {
        alert('Main blog set successfully!');
        this.loadBlogs();
      });
    }
  }

  cancelEdit() {
    this.resetForm();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  resetForm() {
    this.blog = {
      title: '',
      summary: '',
      content: '',
      author: '',
      publishDate: ''
    };
    this.selectedFile = undefined as any;
    this.editingId = undefined;
  }
}
