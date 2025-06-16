package com.maven.demo.service;

import com.maven.demo.entity.CouponEntity;
import com.maven.demo.repository.CouponRepository;
import jakarta.transaction.Transactional;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    public CouponEntity createCoupon(CouponEntity coupon) {
        // If code is provided, validate it, else generate it
        if (coupon.getCode() == null || coupon.getCode().trim().isEmpty()) {
            coupon.setCode(generateRandomCouponCode());  // Generate random code if not provided
        } else {
            // Check if the provided code already exists
            Optional<CouponEntity> existing = couponRepository.findByCode(coupon.getCode());
            if (existing.isPresent()) {
                throw new RuntimeException("Coupon code already exists. Please use a different code.");
            }
        }

        // Set default status
        coupon.setStatus("Active");

        // Validate startDate and endDate
        if (coupon.getStartDate() != null && coupon.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Start date cannot be in the past.");
        }

        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(coupon.getStartDate())) {
            throw new RuntimeException("End date cannot be before the start date.");
        }

        // If the endDate is in the past, mark as inactive
        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(LocalDate.now())) {
            coupon.setStatus("Inactive");
        }

        return couponRepository.save(coupon);  // Save the coupon to the database
    }

    public List<CouponEntity> getAllCoupons() {
        List<CouponEntity> coupons = couponRepository.findAll();
        coupons.forEach(coupon -> {
            if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(LocalDate.now())) {
                if (!"Inactive".equalsIgnoreCase(coupon.getStatus())) {
                    coupon.setStatus("Inactive");
                    couponRepository.save(coupon);  // persist the change
                }
            }
        });
        return coupons;
    }


    private String generateRandomCouponCode() {
        String letters = RandomStringUtils.randomAlphabetic(3).toUpperCase(); // 3 letters
        String numbers = RandomStringUtils.randomNumeric(3); // 3 digits
        return letters + numbers; // Example: ABC123
    }

    @Transactional
    public void deleteByCode(String code) {
        couponRepository.deleteByCode(code);
    }

    public CouponEntity updateCoupon(String code, CouponEntity couponDetails) {
        Optional<CouponEntity> existingCouponOpt = couponRepository.findByCode(code);
        if (existingCouponOpt.isPresent()) {
            CouponEntity existingCoupon = existingCouponOpt.get();
            existingCoupon.setType(couponDetails.getType());
            existingCoupon.setDiscount(couponDetails.getDiscount());
            existingCoupon.setStartDate(couponDetails.getStartDate());  // Update start date
            existingCoupon.setEndDate(couponDetails.getEndDate());      // Update end date
            existingCoupon.setStatus(couponDetails.getStatus());
            return couponRepository.save(existingCoupon);
        } else {
            throw new RuntimeException("Coupon with code " + code + " not found.");
        }
    }
}