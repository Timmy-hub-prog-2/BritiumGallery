package com.maven.demo.controller;

import com.maven.demo.dto.WishlistDTO;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.WishlistEntity;
import com.maven.demo.repository.ProductRepository;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.repository.WishlistRepository;
import com.maven.demo.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WishlistService wishlistService;

    @PostMapping("/add")
    public ResponseEntity<Map<String, String>> addToWishlist(@RequestParam Long userId, @RequestParam Long productId) {
        UserEntity user = userRepository.findById(userId).orElseThrow();
        ProductEntity product = productRepository.findById(productId).orElseThrow();

        if (wishlistRepository.existsByUserAndProduct(user, product)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Already in wishlist"));
        }

        WishlistEntity wishlist = new WishlistEntity();
        wishlist.setUser(user);
        wishlist.setProduct(product);
        wishlistRepository.save(wishlist);

        return ResponseEntity.ok(Map.of("message", "Added to wishlist"));
    }


    // ✅ Get all wishlist
    @GetMapping
    public ResponseEntity<List<WishlistEntity>> getAllWishlist() {
        return ResponseEntity.ok(wishlistRepository.findAll());
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Map<String, Object>> removeFromWishlist(@RequestParam Long userId,
                                                                  @RequestParam Long productId) {
        boolean removed = wishlistService.remove(userId, productId);

        Map<String, Object> response = new HashMap<>();
        if (removed) {
            response.put("success", true);
            response.put("message", "Removed from wishlist.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Wishlist entry not found.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }



    // ✅ Get wishlist for a user
    @GetMapping("/{userId}")
    public List<WishlistDTO> getWishlistByUser(@PathVariable Long userId) {
        List<WishlistEntity> wishlists = wishlistRepository.findByUserId(userId);
        return wishlists.stream().map(w -> {
            WishlistDTO dto = new WishlistDTO();
            dto.setId(w.getId());
            dto.setProductId(w.getProduct().getId());
            dto.setProductName(w.getProduct().getName());
            dto.setProductPhotoUrl(w.getProduct().getBasePhotoUrl()); // ✅ Include photo URL
            dto.setUserId(w.getUser().getId());
            dto.setUserName(w.getUser().getName());
            return dto;
        }).collect(Collectors.toList());
    }
}