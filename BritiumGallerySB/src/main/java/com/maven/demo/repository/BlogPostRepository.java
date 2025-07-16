package com.maven.demo.repository;

import com.maven.demo.entity.BlogPost;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {

    @Modifying
    @Query("UPDATE BlogPost b SET b.isMain = false")
    void resetAllMainFlags();
}
