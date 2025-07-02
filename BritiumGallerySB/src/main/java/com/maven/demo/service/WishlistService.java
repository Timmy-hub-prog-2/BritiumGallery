package com.maven.demo.service;

import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.WishlistEntity;
import com.maven.demo.repository.ProductRepository;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    public boolean remove(Long userId, Long productId) {
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        ProductEntity product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));

        return wishlistRepository.findByUserAndProduct(user, product).map(wishlist -> {
            wishlistRepository.delete(wishlist);
            return true;
        }).orElse(false); // no entry found
    }

}
