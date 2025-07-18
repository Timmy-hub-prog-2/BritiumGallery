package com.maven.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.maven.demo.entity.BlogPost;
import com.maven.demo.repository.BlogPostRepository;

import jakarta.transaction.Transactional;

@Service
public class BlogPostService {

    @Autowired
    private BlogPostRepository blogPostRepository;

    public BlogPost save(BlogPost post) {
        return blogPostRepository.save(post);
    }

    public List<BlogPost> getAll() {
        return blogPostRepository.findAll(Sort.by(Sort.Direction.DESC, "publishDate"));
    }

    public BlogPost getById(Long id) {
        return blogPostRepository.findById(id).orElse(null);
    }

    public void delete(Long id) {
        blogPostRepository.deleteById(id);
    }

    @Transactional
    public void setMainBlog(Long id) {
        blogPostRepository.resetAllMainFlags();

        BlogPost blog = blogPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Blog not found"));
        blog.setIsMain(true);
        blogPostRepository.save(blog);
    }

    public BlogPost getMainBlog() {
        return blogPostRepository.findFirstByIsMainTrue();
    }
}
