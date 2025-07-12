package com.maven.demo.service;

import com.maven.demo.entity.BlogPost;
import com.maven.demo.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
