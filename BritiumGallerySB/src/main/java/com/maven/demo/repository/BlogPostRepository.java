package com.maven.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.maven.demo.entity.BlogPost;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    @Modifying
    @Query("UPDATE BlogPost b SET b.isMain = false")
    void resetAllMainFlags();

    BlogPost findFirstByIsMainTrue();
}
