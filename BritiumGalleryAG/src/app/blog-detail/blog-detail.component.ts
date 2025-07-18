import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BlogService } from '../blog.service';
import { DatePipe } from '@angular/common';
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
  selector: 'app-blog-detail',
  standalone: false,
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.css',
  
})
export class BlogDetailComponent implements OnInit {
  blog?: BlogPost;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.blogService.getById(+id).subscribe(data => {
        this.blog = data;
      });
    }
    this.initializeScrollProgress();
  this.calculateReadingTime();
  }

  initializeScrollProgress() {
  window.addEventListener('scroll', () => {
    const article = document.querySelector('.article-content');
    if (article) {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      const progressFill = document.getElementById('progressFill');
      const progressText = document.getElementById('progressText');
      
      if (progressFill && progressText) {
        progressFill.style.width = scrollPercent + '%';
        progressText.textContent = Math.round(scrollPercent) + '%';
      }
    }
  });
}

calculateReadingTime() {
  if (this.blog?.content) {
    const wordsPerMinute = 200;
    const words = this.blog.content.split(' ').length;
    const minutes = Math.ceil(words / wordsPerMinute);
    
    const readingTimeElement = document.getElementById('readingTime');
    if (readingTimeElement) {
      readingTimeElement.textContent = `${minutes} min read`;
    }
  }
}

// Add these methods for interactivity
shareArticle(platform: string) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(this.blog?.title || '');
  
  let shareUrl = '';
  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

toggleLike() {
  const likeBtn = document.querySelector('.like-btn');
  likeBtn?.classList.toggle('active');
}

toggleBookmark() {
  const bookmarkBtn = document.querySelector('.bookmark-btn');
  bookmarkBtn?.classList.toggle('active');
}

expandMedia() {
  // Implement media expansion logic
  console.log('Expand media');
}
}
