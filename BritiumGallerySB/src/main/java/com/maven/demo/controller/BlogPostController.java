package com.maven.demo.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.entity.BlogPost;
import com.maven.demo.service.BlogPostService;
import com.maven.demo.service.CloudinaryUploadService;

@RestController
@RequestMapping("/api/blogs")
@CrossOrigin(origins = "http://localhost:4200")
public class BlogPostController {

    @Autowired
    private BlogPostService blogPostService;

    @Autowired
    private CloudinaryUploadService cloudinaryUploadService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createBlogPost(
            @RequestPart("post") BlogPost post,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "video", required = false) MultipartFile video) {

        try {
            if (image != null && !image.isEmpty()) {
                String imageUrl = cloudinaryUploadService.uploadToCloudinary(image, "blogs/images");
                post.setImageUrl(imageUrl);
            }
            if (video != null && !video.isEmpty()) {
                String videoUrl = cloudinaryUploadService.uploadToCloudinary(video, "blogs/videos");
                post.setVideoUrl(videoUrl);
            }

            BlogPost saved = blogPostService.save(post);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Media upload failed: " + e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateBlogPost(
            @PathVariable Long id,
            @RequestPart("post") BlogPost post,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        try {
            if (image != null && !image.isEmpty()) {
                String imageUrl = cloudinaryUploadService.uploadToCloudinary(image, "blogs");
                post.setImageUrl(imageUrl);
            }

            post.setId(id);
            BlogPost updated = blogPostService.save(post);
            return ResponseEntity.ok(updated);

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Image upload failed: " + e.getMessage());
        }
    }


    @GetMapping
    public List<BlogPost> getAll() {
        return blogPostService.getAll();
    }

    @GetMapping("/{id}")
    public BlogPost getOne(@PathVariable Long id) {
        return blogPostService.getById(id);
    }

    @GetMapping("/main")
    public BlogPost getMainBlog() {
        return blogPostService.getMainBlog();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        blogPostService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/set-main")
    public ResponseEntity<Void> setMainBlog(@PathVariable Long id) {
        blogPostService.setMainBlog(id);
        return ResponseEntity.ok().build();
    }

}
