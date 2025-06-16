package com.maven.demo.controller;

import com.maven.demo.entity.CouponEntity;
import com.maven.demo.service.CouponService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "http://localhost:4200")
public class CouponController {

    @Autowired
    private CouponService couponService;

    @PostMapping
    public ResponseEntity<?> createCoupon(@RequestBody CouponEntity coupon) {
        try {
            return new ResponseEntity<>(couponService.createCoupon(coupon), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Coupon code already exists")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Coupon code already exists. Please use a different code.");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
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
}