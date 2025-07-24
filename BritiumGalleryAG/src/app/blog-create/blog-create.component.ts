import { Component, OnInit } from '@angular/core';
import { BlogService } from '../blog.service';
import Swal from 'sweetalert2';

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
  expandedBlogs: Set<number> = new Set();

  constructor(private blogService: BlogService) {}

  ngOnInit() {
    this.loadBlogs();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.isVideo = this.selectedFile?.type.startsWith('video/');
  }

  submit() {
    const title = this.blog.title?.trim();
    const content = this.blog.content?.trim();
    const author = this.blog.author?.trim();

    if (!title || !content || !author || !this.blog.publishDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields before saving.',
        confirmButtonColor: '#222'
      });
      return;
    }

    // Check for duplicate title
    const isDuplicateTitle = this.blogs.some(b => 
      b.title.trim().toLowerCase() === title.toLowerCase() &&
      (!this.editingId || b.id !== this.editingId)
    );

    if (isDuplicateTitle) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'A blog with this title already exists. Please use a unique title.',
        confirmButtonColor: '#222'
      });
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
        Swal.fire({
          icon: 'error',
          title: 'Invalid File',
          text: 'Only image or video files are allowed.',
          confirmButtonColor: '#222'
        });
        return;
      }
    }

    if (this.editingId) {
      this.blogService.update(this.editingId, formData).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Blog updated successfully!',
          confirmButtonColor: '#222',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadBlogs();
      });
    } else {
      this.blogService.create(formData).subscribe(() => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Blog created successfully!',
          confirmButtonColor: '#222',
          timer: 2000,
          showConfirmButton: false
        });
        this.resetForm();
        this.loadBlogs();
      });
    }
  }

  loadBlogs() {
    this.blogService.getAll().subscribe(data => {
      this.blogs = data;
      this.expandedBlogs.clear();
    });
  }

  editBlog(blog: BlogPost) {
    this.blog = { ...blog };
    this.editingId = blog.id;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteBlog(id: number) {
    if (!id) return;
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this blog post?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it',
      confirmButtonColor: '#222'
    }).then((result) => {
      if (result.isConfirmed) {
        this.blogService.delete(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Blog has been deleted.',
            confirmButtonColor: '#222',
            timer: 2000,
            showConfirmButton: false
          });
          if (this.editingId === id) {
            this.resetForm();
          }
          this.loadBlogs();
        });
      }
    });
  }

  setAsMain(id: number) {
    if (!id) return;
    Swal.fire({
      title: 'Set as Main Blog',
      text: 'Do you want to set this as the main blog post?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#222'
    }).then((result) => {
      if (result.isConfirmed) {
        this.blogService.setMain(id).subscribe(() => {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Main blog set successfully!',
            confirmButtonColor: '#222',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadBlogs();
        });
      }
    });
  }

  cancelEdit() {
    this.resetForm();
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

  toggleExpand(id: number, event: Event): void {
    event.preventDefault();
    if (!id) return;
    if (this.expandedBlogs.has(id)) {
      this.expandedBlogs.delete(id);
    } else {
      this.expandedBlogs.add(id);
    }
  }

  isExpanded(id: number): boolean {
    if (!id) return false;
    return this.expandedBlogs.has(id);
  }
}
