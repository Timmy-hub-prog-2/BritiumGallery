package com.maven.demo.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.maven.demo.dto.ApplyCouponRequestDTO;
import com.maven.demo.dto.CouponWithRulesDTO;
import com.maven.demo.entity.CouponEntity;
import com.maven.demo.service.CouponService;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "http://localhost:4200")
public class CouponController {

    @Autowired
    private CouponService couponService;

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody CouponWithRulesDTO couponDto) {
        try {
            return new ResponseEntity<>(couponService.createCouponWithRules(couponDto), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Coupon code already exists")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", "Coupon code already exists. Please use a different code."));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<CouponEntity>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @PutMapping("/{code}")
    public ResponseEntity<CouponEntity> updateCoupon(@PathVariable String code, @RequestBody CouponEntity coupon) {
        CouponEntity updatedCoupon = couponService.updateCoupon(code, coupon);
        return new ResponseEntity<>(updatedCoupon, HttpStatus.OK);
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<?> deleteCoupon(@PathVariable String code) {
        couponService.deleteByCode(code);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validateCoupon(@PathVariable String code) {
        Optional<CouponEntity> couponOpt = couponService.findByCode(code);
        if (couponOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Collections.singletonMap("message", "Coupon not found"));
        }

        CouponEntity coupon = couponOpt.get();
        LocalDate today = LocalDate.now();

        if (coupon.getStatus().equalsIgnoreCase("Inactive") || coupon.getStartDate().isAfter(today)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", "Coupon is not valid today"));
        }

        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(today)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", "Coupon has expired"));
        }

        return ResponseEntity.ok(coupon);
    }

    @PostMapping("/apply-coupon")
    public ResponseEntity<?> applyCoupon(@RequestBody ApplyCouponRequestDTO dto) {
        try {
            // Get the coupon entity
            Optional<CouponEntity> couponOpt = couponService.findByCode(dto.getCouponCode());
            if (couponOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Collections.singletonMap("message", "Coupon not found"));
            }
            CouponEntity coupon = couponOpt.get();

            // Calculate the discount amount
            double discountAmount = couponService.applyCouponToAmount(dto.getCouponCode(), dto.getUserId(), dto.getCartTotal());

            // Return all info as a map
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("discountAmount", discountAmount);
            response.put("discountType", coupon.getType());
            response.put("discountValue", coupon.getDiscount());

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(java.util.Collections.singletonMap("message", e.getMessage()));
        }
    }

}
