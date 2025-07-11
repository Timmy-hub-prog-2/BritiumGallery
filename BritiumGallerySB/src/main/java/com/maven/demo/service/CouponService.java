package com.maven.demo.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.CouponWithRulesDTO;
import com.maven.demo.dto.CustomerRuleDTO;
import com.maven.demo.entity.CouponCustomerTypeEntity;
import com.maven.demo.entity.CouponEntity;
import com.maven.demo.entity.CustomerTypeEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.CouponCustomerTypeRepository;
import com.maven.demo.repository.CouponRepository;
import com.maven.demo.repository.CustomerTypeRepository;
import com.maven.demo.repository.UserCouponUsageRepository;
import com.maven.demo.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CustomerTypeRepository customerTypeRepository;

    @Autowired
    private CouponCustomerTypeRepository couponCustomerTypeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserCouponUsageRepository userCouponUsageRepository;

    public CouponEntity createCoupon(CouponEntity coupon) {
        if (coupon.getCode() == null || coupon.getCode().trim().isEmpty()) {
            coupon.setCode(generateRandomCouponCode());
        } else {
            Optional<CouponEntity> existing = couponRepository.findByCode(coupon.getCode());
            if (existing.isPresent()) {
                throw new RuntimeException("Coupon code already exists. Please use a different code.");
            }
        }

        coupon.setStatus("Active");

        if (coupon.getStartDate() != null && coupon.getStartDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Start date cannot be in the past.");
        }

        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(coupon.getStartDate())) {
            throw new RuntimeException("End date cannot be before the start date.");
        }

        if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(LocalDate.now())) {
            coupon.setStatus("Inactive");
        }

        return couponRepository.save(coupon);
    }

    public CouponEntity createCouponWithRules(CouponWithRulesDTO dto) {
        if (couponRepository.existsByCode(dto.getCode())) {
            throw new RuntimeException("Coupon code already exists");
        }

        CouponEntity coupon = new CouponEntity();
        coupon.setCode(dto.getCode());
        coupon.setType(dto.getType());
        coupon.setDiscount(dto.getDiscount());
        coupon.setStartDate(dto.getStartDate());
        coupon.setEndDate(dto.getEndDate());
        coupon.setStatus(dto.getStatus() != null ? dto.getStatus() : "Active");

        CouponEntity savedCoupon = couponRepository.save(coupon);

        List<CouponCustomerTypeEntity> ruleEntities = new ArrayList<>();
        for (CustomerRuleDTO rule : dto.getRules()) {
            CustomerTypeEntity type = customerTypeRepository.findById(rule.getCustomerTypeId())
                    .orElseThrow(() -> new RuntimeException("Customer type not found"));

            CouponCustomerTypeEntity ruleEntity = new CouponCustomerTypeEntity();
            ruleEntity.setCoupon(savedCoupon);
            ruleEntity.setCustomerType(type);
            ruleEntity.setTimes(rule.getTimes());

            ruleEntities.add(ruleEntity);
        }

        couponCustomerTypeRepository.saveAll(ruleEntities);
        return savedCoupon;
    }

    public List<CouponEntity> getAllCoupons() {
        List<CouponEntity> coupons = couponRepository.findAll();
        coupons.forEach(coupon -> {
            if (coupon.getEndDate() != null && coupon.getEndDate().isBefore(LocalDate.now())) {
                if (!"Inactive".equalsIgnoreCase(coupon.getStatus())) {
                    coupon.setStatus("Inactive");
                    couponRepository.save(coupon);
                }
            }
        });
        return coupons;
    }

    private String generateRandomCouponCode() {
        String letters = RandomStringUtils.randomAlphabetic(3).toUpperCase();
        String numbers = RandomStringUtils.randomNumeric(3);
        return letters + numbers;
    }

    @Transactional
    public void deleteByCode(String code) {
        couponRepository.deleteByCode(code);
    }

    public CouponEntity updateCoupon(String code, CouponEntity couponDetails) {
        Optional<CouponEntity> existingCouponOpt = couponRepository.findByCode(code);
        if (existingCouponOpt.isPresent()) {
            CouponEntity existingCoupon = existingCouponOpt.get();
            
            // Validate dates - allow past dates for updates to enable editing of historical coupons
            if (couponDetails.getEndDate() != null && couponDetails.getEndDate().isBefore(couponDetails.getStartDate())) {
                throw new RuntimeException("End date cannot be before the start date.");
            }
            
            existingCoupon.setType(couponDetails.getType());
            existingCoupon.setDiscount(couponDetails.getDiscount());
            existingCoupon.setStartDate(couponDetails.getStartDate());
            existingCoupon.setEndDate(couponDetails.getEndDate());
            existingCoupon.setStatus(couponDetails.getStatus());
            return couponRepository.save(existingCoupon);
        } else {
            throw new RuntimeException("Coupon with code " + code + " not found.");
        }
    }

    public Optional<CouponEntity> findByCode(String code) {
        return couponRepository.findByCode(code);
    }

    public double applyCouponToAmount(String code, Long userId, double cartTotal) {
        CouponEntity coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (coupon.getStatus().equalsIgnoreCase("Inactive") ||
                LocalDate.now().isBefore(coupon.getStartDate()) ||
                (coupon.getEndDate() != null && LocalDate.now().isAfter(coupon.getEndDate()))) {
            throw new RuntimeException("Coupon is expired or inactive");
        }

        // Fetch user and their customer type
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CustomerTypeEntity userType = user.getCustomerType();

        // Fetch coupon rule for this customer type
        CouponCustomerTypeEntity rule = couponCustomerTypeRepository
                .findByCouponAndCustomerType(coupon, userType)
                .orElse(null);
        if (rule == null) {
            throw new RuntimeException("Coupon not found for your customer type");
        }

        // Check usage count
        long usageCount = userCouponUsageRepository.countByUserAndCoupon(user, coupon);
        if (usageCount >= rule.getTimes()) {
            throw new RuntimeException("Coupon usage limit reached for your customer type");
        }

        // Calculate discount
        double discountValue;
        try {
            discountValue = Double.parseDouble(coupon.getDiscount());
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid discount value in coupon");
        }

        double discount;
        if ("Percentage".equalsIgnoreCase(coupon.getType())) {
            discount = cartTotal * (discountValue / 100.0);
        } else if ("Fixed Amount".equalsIgnoreCase(coupon.getType())) {
            discount = discountValue;
        } else {
            throw new RuntimeException("Unsupported coupon type");
        }

        return Math.min(discount, cartTotal); // Avoid discount > total
    }

}