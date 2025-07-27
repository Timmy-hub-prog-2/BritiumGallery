package com.maven.demo.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.BestSellerProductDTO;
import com.maven.demo.dto.CategoryAnalyticsDTO;
import com.maven.demo.dto.CategoryDTO;
import com.maven.demo.dto.EventDiscountProductsDTO;
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.TopCategoryDTO;

@Service
public class HomepageService {
    @Autowired
    private ProductService productService;
    @Autowired
    private OrderService orderService;
    @Autowired
    private DiscountService discountService;
    @Autowired
    private CategoryService categoryService;

    // New Arrivals: latest products (e.g., last 10 added)
    public List<ProductSearchResultDTO> getNewArrivals(int limit) {
        return productService.getLatestProducts(limit);
    }

    // Best Sellers: top selling products (e.g., top 10)
    public List<BestSellerProductDTO> getBestSellers(int limit) {
        return orderService.getBestSellerProducts(limit);
    }

    // Event Discount Items: products in active discount events
    public List<ProductSearchResultDTO> getEventDiscountItems(int limit) {
        return productService.getEventDiscountProducts(limit);
    }

    public List<BestSellerProductDTO> getTopBestSellers(int limit) {
        return orderService.getBestSellerProducts(limit);
    }

    public List<EventDiscountProductsDTO> getEventDiscountGroups() {
        List<EventDiscountProductsDTO> result = new java.util.ArrayList<>();
        List<EventDiscountProductsDTO> allDiscounts = productService.getEventDiscountProductsGrouped();
        for (EventDiscountProductsDTO event : allDiscounts) {
            EventDiscountProductsDTO eventWithDetails = new EventDiscountProductsDTO();
            eventWithDetails.setEventId(event.getEventId());
            eventWithDetails.setEventName(event.getEventName());
            eventWithDetails.setEventDueDate(event.getEventDueDate());
            eventWithDetails.setProducts(event.getProducts());
            result.add(eventWithDetails);
        }
        return result;
    }

    public EventDiscountProductsDTO getEventDiscountGroupById(Long eventId) {
        List<EventDiscountProductsDTO> allDiscounts = productService.getEventDiscountProductsGrouped();
        for (EventDiscountProductsDTO event : allDiscounts) {
            if (event.getEventId().equals(eventId)) {
                EventDiscountProductsDTO eventWithDetails = new EventDiscountProductsDTO();
                eventWithDetails.setEventId(event.getEventId());
                eventWithDetails.setEventName(event.getEventName());
                eventWithDetails.setEventDueDate(event.getEventDueDate());
                eventWithDetails.setProducts(event.getProducts());
                return eventWithDetails;
            }
        }
        return null;
    }

    public List<TopCategoryDTO> getTopCategories(int limit) {
        // Get top categories by sales (name, sales)
        List<CategoryAnalyticsDTO> analytics = orderService.getTopCategories(null, null);
        // Get all categories for id/image lookup
        List<CategoryDTO> allCategories = categoryService.getAllCategories();
        List<TopCategoryDTO> result = new java.util.ArrayList<>();
        for (CategoryAnalyticsDTO cat : analytics) {
            CategoryDTO match = allCategories.stream()
                .filter(c -> c.getName().equals(cat.getCategoryName()))
                .findFirst().orElse(null);
            if (match != null) {
                result.add(new TopCategoryDTO(match.getId(), match.getName(), match.getImage_url(), cat.getTotalSales()));
            }
            if (result.size() >= limit) break;
        }
        return result;
    }
} 