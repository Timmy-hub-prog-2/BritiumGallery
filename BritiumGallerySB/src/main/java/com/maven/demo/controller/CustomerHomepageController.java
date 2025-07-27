package com.maven.demo.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.maven.demo.dto.BestSellerProductDTO;
import com.maven.demo.dto.EventDiscountProductsDTO;
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.TopCategoryDTO;
import com.maven.demo.service.HomepageService;

@RestController
@RequestMapping("/api/homepage")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerHomepageController {
    @Autowired
    private HomepageService homepageService;

    @GetMapping("/new-arrivals")
    public List<ProductSearchResultDTO> getNewArrivals(@RequestParam(defaultValue = "10") int limit) {
        return homepageService.getNewArrivals(limit);
    }

    @GetMapping("/best-sellers")
    public List<BestSellerProductDTO> getBestSellers(@RequestParam(defaultValue = "10") int limit) {
        return homepageService.getBestSellers(limit);
    }

    @GetMapping("/event-discounts")
    public List<ProductSearchResultDTO> getEventDiscountItems(@RequestParam(defaultValue = "10") int limit) {
        return homepageService.getEventDiscountItems(limit);
    }

    @GetMapping("/event-discount-groups")
    public List<EventDiscountProductsDTO> getEventDiscountGroups() {
        return homepageService.getEventDiscountGroups();
    }

    @GetMapping("/event-discount-groups/{eventId}")
    public EventDiscountProductsDTO getEventDiscountGroupById(@PathVariable Long eventId) {
        return homepageService.getEventDiscountGroupById(eventId);
    }

    @GetMapping("/top-best-sellers")
    public List<BestSellerProductDTO> getTopBestSellers(@RequestParam(defaultValue = "3") int limit) {
        return homepageService.getTopBestSellers(limit);
    }

    @GetMapping("/top-categories")
    public List<TopCategoryDTO> getTopCategories(@RequestParam(defaultValue = "4") int limit) {
        return homepageService.getTopCategories(limit);
    }
}
