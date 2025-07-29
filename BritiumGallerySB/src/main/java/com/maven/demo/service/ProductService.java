package com.maven.demo.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.AddStockRequestDTO;
import com.maven.demo.dto.AttributeOptionDTO;
import com.maven.demo.dto.EventDiscountProductsDTO;
import com.maven.demo.dto.LostProductAnalyticsDTO;
import com.maven.demo.dto.PriceHistoryResponseDTO;
import com.maven.demo.dto.ProductHistoryDTO;
import com.maven.demo.dto.ProductRequestDTO;
import com.maven.demo.dto.ProductResponseDTO;
import com.maven.demo.dto.ProductSearchResultDTO;
import com.maven.demo.dto.PurchaseHistoryResponseDTO;
import com.maven.demo.dto.ReduceStockHistoryResponseDTO;
import com.maven.demo.dto.ReduceStockRequestDTO;
import com.maven.demo.dto.VariantDTO;
import com.maven.demo.dto.VariantResponseDTO;
import com.maven.demo.entity.AttributeEntity;
import com.maven.demo.entity.AttributeOptions;
import com.maven.demo.entity.CategoryEntity;
import com.maven.demo.entity.DiscountEvent;
import com.maven.demo.entity.DiscountRule;
import com.maven.demo.entity.ProductEntity;
import com.maven.demo.entity.ProductHistory;
import com.maven.demo.entity.ProductVariantEntity;
import com.maven.demo.entity.ProductVariantImage;
import com.maven.demo.entity.ProductVariantPriceHistoryEntity;
import com.maven.demo.entity.PurchaseHistoryEntity;
import com.maven.demo.entity.ReduceStockHistoryEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.VariantAttributeValueEntity;
import com.maven.demo.repository.AttributeOptionRepository;
import com.maven.demo.repository.AttributeRepository;
import com.maven.demo.repository.BrandRepository;
import com.maven.demo.repository.CategoryRepository;
import com.maven.demo.repository.DiscountEventRepository;
import com.maven.demo.repository.DiscountRuleRepository;
import com.maven.demo.repository.OrderDetailRepository;
import com.maven.demo.repository.ProductHistoryRepository;
import com.maven.demo.repository.ProductRepository;
import com.maven.demo.repository.ProductVariantPriceHistoryRepository;
import com.maven.demo.repository.ProductVariantRepository;
import com.maven.demo.repository.PurchaseHistoryRepository;
import com.maven.demo.repository.ReduceStockHistoryRepository;
import com.maven.demo.repository.RefundRequestRepository;
import com.maven.demo.repository.RestockNotificationRepository;
import com.maven.demo.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class ProductService {

    @Autowired
    private CategoryRepository catRepo;

    @Autowired
    private ProductRepository proRepo;

    @Autowired
    private AttributeRepository attriRepo;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private AttributeOptionRepository attributeOptionRepository;

    @Autowired
    private PurchaseHistoryRepository purchaseHistoryRepository;

    @Autowired
    private ProductVariantPriceHistoryRepository priceHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private DiscountService discountService;

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    @Autowired
    private ReduceStockHistoryRepository reduceStockHistoryRepository;

    @Autowired
    private DiscountEventRepository discountEventRepository;

    @Autowired
    private RestockNotificationRepository restockNotificationRepository;
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private OrderDetailRepository orderDetailRepository;
    
    @Autowired
    private ProductHistoryRepository productHistoryRepository;
    
    @Autowired
    private RefundRequestRepository refundRequestRepository;

    @Autowired
    private VariantEditHistoryService variantEditHistoryService;

    @Transactional
    public void saveProductWithVariants(ProductRequestDTO dto) {
        // Create and save the Product
        ProductEntity product = new ProductEntity();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setCategory(catRepo.findById(dto.getCategoryId()).orElseThrow());
        product.setAdmin_id(dto.getAdminId());
        product.setBasePhotoUrl(dto.getBasePhotoUrl());
        product.setCreated_at(LocalDateTime.now());
        product.setRating(dto.getRating());

        // Set brand if provided
        if (dto.getBrandId() != null) {
            product.setBrand(brandRepository.findById(dto.getBrandId()).orElse(null));
        }
        proRepo.save(product);

        // Handle Variants
        String prefix = product.getName().replaceAll("\\s+", "").toUpperCase();
        prefix = prefix.length() > 4 ? prefix.substring(0, 4) : prefix;
        Long productId = product.getId(); // after save
        int skuCounter = 1;

        for (VariantDTO varDto : dto.getVariants()) {
            ProductVariantEntity variant = new ProductVariantEntity();
            variant.setProduct(product);
            variant.setPrice(varDto.getPrice());
            variant.setStock(varDto.getStock());
            variant.setAdmin_id(dto.getAdminId());

            // Set Attributes
            List<VariantAttributeValueEntity> attrValues = new ArrayList<>();
            if (varDto.getAttributes() != null) {
                for (Map.Entry<String, String> entry : varDto.getAttributes().entrySet()) {
                    AttributeEntity attr = attriRepo.findByNameAndCategory(entry.getKey(), product.getCategory())
                            .orElseThrow(() -> new RuntimeException("Attribute not found: " + entry.getKey()));
                    VariantAttributeValueEntity val = new VariantAttributeValueEntity();
                    val.setAttribute(attr);
                    val.setValue(entry.getValue());
                    val.setProductVariant(variant);
                    attrValues.add(val);
                }
            }
            variant.setAttributeValues(attrValues);

            // Set SKU
            String sku = String.format("%s%d%03d", prefix, productId, skuCounter++);
            variant.setSku(sku);

            // Save variant first to get the ID
            variantRepository.save(variant);
            
            // Create a record in the purchase history for initial stock
            PurchaseHistoryEntity purchase = new PurchaseHistoryEntity();
            purchase.setVariant(variant);
            purchase.setPurchasePrice(varDto.getPurchasePrice());
            purchase.setQuantity(varDto.getStock());
            purchase.setRemainingQuantity(varDto.getStock());
            purchaseHistoryRepository.save(purchase);

            // Create initial price history record for the selling price
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(varDto.getPrice()); // Store the initial selling price
            priceHistory.setPriceDate(LocalDateTime.now());
            
            // Set the admin who created the product
            if (dto.getAdminId() != null) {
                UserEntity admin = userRepository.findById(dto.getAdminId())
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            
            priceHistoryRepository.save(priceHistory);

            // Save image if provided
            if (varDto.getImageUrls() != null && !varDto.getImageUrls().isEmpty()) {
                for (String imageUrl : varDto.getImageUrls()) {
                    ProductVariantImage image = new ProductVariantImage();
                    image.setVariant(variant);
                    image.setImageUrl(imageUrl); // Use each photo URL
                    image.setCreatedAt(LocalDateTime.now());
                    variant.getImages().add(image);
                }
            }

            // Save again if image is added (if mapped with cascade this can be avoided)
            variantRepository.save(variant);
            if (dto.getAttributeOptions() != null) {
                for (AttributeOptionDTO optionDTO : dto.getAttributeOptions()) {
                    AttributeEntity attribute = attriRepo.findById(optionDTO.getAttributeId())
                            .orElseThrow(() -> new RuntimeException("Attribute not found"));

                    // Delete existing options for this attribute
                    attributeOptionRepository.deleteByAttributeId(attribute.getId());

                    // Save new options
                    for (String optionValue : optionDTO.getOptions()) {
                        AttributeOptions option = new AttributeOptions();
                        option.setAttribute(attribute);
                        option.setValue(optionValue);
                        attributeOptionRepository.save(option);
                    }
                }
            }
        }
    }

    public List<ProductResponseDTO> getProductsByCategory(Long categoryId) {
        List<ProductEntity> products = proRepo.findByCategoryId(categoryId);
        return products.stream()
            .map(product -> {
                ProductResponseDTO dto = new ProductResponseDTO();
                dto.setId(product.getId());
                dto.setName(product.getName());
                dto.setDescription(product.getDescription());
                dto.setRating(product.getRating());
                dto.setCategoryId(product.getCategory().getId());
                dto.setCategoryName(product.getCategory().getName());
                dto.setAdminId(product.getAdmin_id());
                dto.setBasePhotoUrl(product.getBasePhotoUrl());
                dto.setStatus(product.getStatus());
                List<VariantResponseDTO> variantDTOs = product.getVariants().stream().map(variant -> {
                    VariantResponseDTO varDTO = new VariantResponseDTO();
                    varDTO.setId(variant.getId());
                    varDTO.setPrice(variant.getPrice());
                    varDTO.setStock(variant.getStock());
                    Map<String, String> attrMap = new HashMap<>();
                    for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                        attrMap.put(vav.getAttribute().getName(), vav.getValue());
                    }
                    varDTO.setAttributes(attrMap);
                    return varDTO;
                }).toList();
                dto.setVariants(variantDTOs);
                return dto;
            }).toList();
    }

    public ProductResponseDTO getProductDetailById(Long productId) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setBrand(product.getBrand() != null ? product.getBrand().getName() : null);
        dto.setBrandId(product.getBrand() != null ? product.getBrand().getId() : null);
        dto.setRating(product.getRating());
        dto.setCategoryId(product.getCategory().getId());
        dto.setCategoryName(product.getCategory().getName());
        dto.setAdminId(product.getAdmin_id());
        dto.setBasePhotoUrl(product.getBasePhotoUrl());
        dto.setStatus(product.getStatus());

        List<VariantResponseDTO> variantDTOs = product.getVariants().stream().map(variant -> {
            VariantResponseDTO varDTO = new VariantResponseDTO();
            varDTO.setId(variant.getId());
            varDTO.setPrice(variant.getPrice());
            varDTO.setStock(variant.getStock());
            varDTO.setSku(variant.getSku());
            // Attributes
            Map<String, String> attrMap = new HashMap<>();
            for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                attrMap.put(vav.getAttribute().getName(), vav.getValue());
            }
            varDTO.setAttributes(attrMap);

            // Images
            List<String> imageUrls = new ArrayList<>();
            for (ProductVariantImage image : variant.getImages()) {
                imageUrls.add(image.getImageUrl());
            }
            varDTO.setImageUrls(imageUrls);

            // --- Discount logic ---
            Double discountPercent = null;
            java.time.LocalDate today = java.time.LocalDate.now();
            // 1. Variant discount (highest priority)
            List<DiscountRule> variantDiscounts = discountRuleRepository.findActiveVariantDiscounts(variant.getId(), today);
            if (!variantDiscounts.isEmpty()) {
                discountPercent = variantDiscounts.get(0).getDiscountPercent();
            } else {
                // 2. Product discount
                List<DiscountRule> productDiscounts = discountRuleRepository.findActiveProductDiscountsByDate(product.getId(), today);
                if (!productDiscounts.isEmpty()) {
                    discountPercent = productDiscounts.get(0).getDiscountPercent();
                } else {
                    // 3. Category discount (check all ancestors, closest first)
                    CategoryEntity cat = product.getCategory();
                    while (cat != null && discountPercent == null) {
                        List<DiscountRule> categoryDiscounts = discountRuleRepository.findActiveCategoryDiscountsByDate(cat.getId(), today);
                        if (!categoryDiscounts.isEmpty()) {
                            discountPercent = categoryDiscounts.get(0).getDiscountPercent();
                            break;
                        }
                        cat = cat.getParentCategory();
                    }
                    // 4. Brand discount (lowest priority)
                    if (discountPercent == null && product.getBrand() != null) {
                        List<DiscountRule> brandDiscounts = discountRuleRepository.findActiveBrandDiscountsByDate(product.getBrand().getId(), today);
                        if (!brandDiscounts.isEmpty()) {
                            discountPercent = brandDiscounts.get(0).getDiscountPercent();
                        }
                    }
                }
            }
            if (discountPercent != null && discountPercent > 0) {
                varDTO.setDiscountPercent(discountPercent);
                int discounted = (int) Math.round(variant.getPrice() * (1 - discountPercent / 100.0));
                varDTO.setDiscountedPrice(discounted);
            } else {
                varDTO.setDiscountPercent(null);
                varDTO.setDiscountedPrice(null);
            }
            // --- End discount logic ---

            return varDTO;
        }).toList();

        dto.setVariants(variantDTOs);
        return dto;
    }

    @Transactional
    public List<String> getProductBreadcrumb(Long productId) {
        Optional<ProductEntity> productOpt = proRepo.findById(productId);
        if (productOpt.isEmpty()) {
            return new ArrayList<>();
        }

        ProductEntity product = productOpt.get();
        List<String> breadcrumb = new ArrayList<>();

        // Start with category path
        CategoryEntity category = product.getCategory();
        while (category != null) {
            breadcrumb.add(category.getName());
            category = category.getParentCategory();
        }

        Collections.reverse(breadcrumb);

        // Add product name at the end
        breadcrumb.add(product.getName());

        return breadcrumb;
    }

    @Transactional
    public ProductResponseDTO updateProduct(Long productId, ProductRequestDTO dto) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Get admin ID from the product or use a default
        Long adminId = product.getAdmin_id() != null ? product.getAdmin_id() : 1L;

        // Record changes for history
        // Product fields: name, description, rating, brand, base_photo
        if (!product.getName().equals(dto.getName())) {
            String action = dto.getName().length() > product.getName().length() ? "ADDED" : "REMOVED";
            recordProductHistory(productId, adminId, action, "name", product.getName(), dto.getName());
        }
        if (!product.getDescription().equals(dto.getDescription())) {
            String action = dto.getDescription().length() > product.getDescription().length() ? "ADDED" : "REMOVED";
            recordProductHistory(productId, adminId, action, "description", product.getDescription(), dto.getDescription());
        }
        if (product.getRating() != dto.getRating()) {
            recordProductHistory(productId, adminId, "UPDATED", "rating", String.valueOf(product.getRating()), String.valueOf(dto.getRating()));
        }
        if (dto.getBasePhotoUrl() != null && !dto.getBasePhotoUrl().equals(product.getBasePhotoUrl())) {
            recordProductHistory(productId, adminId, "UPDATED", "base_photo", product.getBasePhotoUrl(), dto.getBasePhotoUrl());
        }
        if (dto.getBrandId() != null && (product.getBrand() == null || !product.getBrand().getId().equals(dto.getBrandId()))) {
            String oldBrandName = product.getBrand() != null ? product.getBrand().getName() : "None";
            String newBrandName = brandRepository.findById(dto.getBrandId()).map(brand -> brand.getName()).orElse("Unknown");
            recordProductHistory(productId, adminId, "UPDATED", "brand", oldBrandName, newBrandName);
        }

        // Update basic product details
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        if (dto.getBasePhotoUrl() != null) {
            product.setBasePhotoUrl(dto.getBasePhotoUrl());
        }
        product.setRating(dto.getRating());

        // Set brand if provided
        if (dto.getBrandId() != null) {
            product.setBrand(brandRepository.findById(dto.getBrandId()).orElse(null));
        } else {
            product.setBrand(null);
        }

        proRepo.save(product);

        // Convert to response DTO
        return convertToProductResponseDTO(product);
    }

    @Transactional
    public ProductResponseDTO updateVariant(Long variantId, VariantDTO dto, List<String> newPhotoUrls, Long adminId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // Check if price has changed
        Integer oldPrice = variant.getPrice();
        Integer newPrice = dto.getPrice();
        boolean priceChanged = !Objects.equals(oldPrice, newPrice);

        // Update basic variant details
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());

        // If price changed, create a price history record and record edit history
        if (priceChanged) {
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(dto.getPrice()); // Store the old price
            priceHistory.setPriceDate(LocalDateTime.now());
            if (adminId != null) {
                UserEntity admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            priceHistoryRepository.save(priceHistory);
            // Record edit history for price
            variantEditHistoryService.recordVariantEditHistory(
                variantId, adminId, "UPDATED", "price", oldPrice != null ? String.valueOf(oldPrice) : null, newPrice != null ? String.valueOf(newPrice) : null
            );
        }

        // Handle image updates
        // 1. Delete images marked for removal
        if (dto.getImageUrlsToDelete() != null && !dto.getImageUrlsToDelete().isEmpty()) {
            for (String url : dto.getImageUrlsToDelete()) {
                variant.getImages().removeIf(image -> image.getImageUrl().equals(url));
                // Record edit history for photo removal
                variantEditHistoryService.recordVariantEditHistory(
                    variantId, adminId, "DELETED", "photo", url, null
                );
            }
        }

        // 2. Add new photos uploaded
        if (newPhotoUrls != null && !newPhotoUrls.isEmpty()) {
            for (String url : newPhotoUrls) {
                ProductVariantImage image = new ProductVariantImage();
                image.setVariant(variant);
                image.setImageUrl(url);
                image.setCreatedAt(LocalDateTime.now());
                variant.getImages().add(image);
                // Record edit history for photo addition
                variantEditHistoryService.recordVariantEditHistory(
                    variantId, adminId, "ADDED", "photo", null, url
                );
            }
        }

        // Update attributes
        if (dto.getAttributes() != null) {
            // Compare old and new attributes for changes
            Map<String, String> oldAttributes = new HashMap<>();
            for (VariantAttributeValueEntity val : variant.getAttributeValues()) {
                oldAttributes.put(val.getAttribute().getName(), val.getValue());
            }
            // Clear existing attributes using the helper method
            variant.clearAttributeValues();
            // Add new attributes
            for (Map.Entry<String, String> entry : dto.getAttributes().entrySet()) {
                AttributeEntity attr = attriRepo.findByNameAndCategory(entry.getKey(), variant.getProduct().getCategory())
                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + entry.getKey()));
                VariantAttributeValueEntity val = new VariantAttributeValueEntity();
                val.setAttribute(attr);
                val.setValue(entry.getValue());
                variant.addAttributeValue(val);
                // Record edit history if attribute value changed
                String oldVal = oldAttributes.get(entry.getKey());
                if (oldVal == null || !oldVal.equals(entry.getValue())) {
                    variantEditHistoryService.recordVariantEditHistory(
                        variantId, adminId, "UPDATED", "attribute_" + entry.getKey(), oldVal, entry.getValue()
                    );
                }
            }
            // Record removals for attributes that no longer exist
            for (String oldKey : oldAttributes.keySet()) {
                if (!dto.getAttributes().containsKey(oldKey)) {
                    variantEditHistoryService.recordVariantEditHistory(
                        variantId, adminId, "DELETED", "attribute_" + oldKey, oldAttributes.get(oldKey), null
                    );
                }
            }
        }

        variantRepository.save(variant);

        // Return updated product
        return getProductDetailById(variant.getProduct().getId());
    }

    @Transactional
    public void deleteVariant(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        // Check if referenced by any order
        boolean hasOrder = !orderDetailRepository.findByVariant_Id(variantId).isEmpty();
        // Check if referenced by any refund
        boolean hasRefund = !refundRequestRepository.findByOrderDetail_Variant_Id(variantId).isEmpty();
        if (hasOrder || hasRefund) {
            throw new RuntimeException("VARIANT_REFERENCED");
        }
        variantRepository.delete(variant);
    }

    @Transactional
    public ProductResponseDTO addVariant(Long productId, VariantDTO dto, List<String> newPhotoUrls, Long adminId) {
        ProductEntity product = proRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductVariantEntity variant = new ProductVariantEntity();
        variant.setProduct(product);
        variant.setPrice(dto.getPrice());
        variant.setStock(dto.getStock());
        variant.setAdmin_id(product.getAdmin_id());

        // Handle attributes
        if (dto.getAttributes() != null) {
            List<VariantAttributeValueEntity> attrValues = new ArrayList<>();
            for (Map.Entry<String, String> entry : dto.getAttributes().entrySet()) {
                AttributeEntity attr = attriRepo.findByNameAndCategory(entry.getKey(), product.getCategory())
                        .orElseThrow(() -> new RuntimeException("Attribute not found: " + entry.getKey()));
                VariantAttributeValueEntity val = new VariantAttributeValueEntity();
                val.setAttribute(attr);
                val.setValue(entry.getValue());
                val.setProductVariant(variant);
                attrValues.add(val);
            }
            variant.setAttributeValues(attrValues);
        }

        // Handle photos
        if (newPhotoUrls != null && !newPhotoUrls.isEmpty()) {
            for (String url : newPhotoUrls) {
                ProductVariantImage image = new ProductVariantImage();
                image.setVariant(variant);
                image.setImageUrl(url);
                image.setCreatedAt(LocalDateTime.now());
                variant.getImages().add(image);
            }
        }

        // Auto-generate SKU
        String prefix = product.getName().replaceAll("\\s+", "").toUpperCase();
        prefix = prefix.length() > 4 ? prefix.substring(0, 4) : prefix;
        Long prodId = product.getId();
        // Find the current max variant id for this product to increment SKU
        int variantCount = product.getVariants() != null ? product.getVariants().size() : 0;
        String sku = String.format("%s%d%03d", prefix, prodId, variantCount + 1);
        variant.setSku(sku);

        variantRepository.save(variant);

        // --- Create purchase history and price history for the new variant ---
        if (dto.getStock() > 0) {
            PurchaseHistoryEntity purchase = new PurchaseHistoryEntity();
            purchase.setVariant(variant);
            purchase.setPurchasePrice(dto.getPurchasePrice());
            purchase.setQuantity(dto.getStock());
            purchase.setRemainingQuantity(dto.getStock());
            if (adminId != null) {
                UserEntity admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                purchase.setAdmin(admin);
            }
            purchaseHistoryRepository.save(purchase);
        }
        {
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(dto.getPrice());
            priceHistory.setPriceDate(LocalDateTime.now());
            // Optionally set admin if available
            if (adminId != null) {
                UserEntity admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            priceHistoryRepository.save(priceHistory);
        }
        // --- END ---

        return convertToProductResponseDTO(product);
    }

    private ProductResponseDTO convertToProductResponseDTO(ProductEntity product) {
        ProductResponseDTO dto = new ProductResponseDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setRating(product.getRating());
        dto.setCategoryId(product.getCategory().getId());
        dto.setCategoryName(product.getCategory().getName());
        dto.setAdminId(product.getAdmin_id());
        dto.setBasePhotoUrl(product.getBasePhotoUrl());
        dto.setStatus(product.getStatus());

        List<VariantResponseDTO> variantDTOs = product.getVariants().stream().map(variant -> {
            VariantResponseDTO varDTO = new VariantResponseDTO();
            varDTO.setId(variant.getId());
            varDTO.setPrice(variant.getPrice());
            varDTO.setStock(variant.getStock());
            varDTO.setSku(variant.getSku());

            Map<String, String> attrMap = new HashMap<>();
            for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                attrMap.put(vav.getAttribute().getName(), vav.getValue());
            }
            varDTO.setAttributes(attrMap);

            List<String> imageUrls = variant.getImages().stream()
                    .map(ProductVariantImage::getImageUrl)
                    .toList();
            varDTO.setImageUrls(imageUrls);

            // --- Discount logic ---
            Double discountPercent = null;
            java.time.LocalDate today = java.time.LocalDate.now();
            // 1. Variant discount (highest priority)
            List<DiscountRule> variantDiscounts = discountRuleRepository.findActiveVariantDiscounts(variant.getId(), today);
            if (!variantDiscounts.isEmpty()) {
                discountPercent = variantDiscounts.get(0).getDiscountPercent();
            } else {
                // 2. Product discount
                List<DiscountRule> productDiscounts = discountRuleRepository.findActiveProductDiscountsByDate(product.getId(), today);
                if (!productDiscounts.isEmpty()) {
                    discountPercent = productDiscounts.get(0).getDiscountPercent();
                } else {
                    // 3. Category discount (check all ancestors, closest first)
                    CategoryEntity cat = product.getCategory();
                    while (cat != null && discountPercent == null) {
                        List<DiscountRule> categoryDiscounts = discountRuleRepository.findActiveCategoryDiscountsByDate(cat.getId(), today);
                        if (!categoryDiscounts.isEmpty()) {
                            discountPercent = categoryDiscounts.get(0).getDiscountPercent();
                            break;
                        }
                        cat = cat.getParentCategory();
                    }
                    // 4. Brand discount (lowest priority)
                    if (discountPercent == null && product.getBrand() != null) {
                        List<DiscountRule> brandDiscounts = discountRuleRepository.findActiveBrandDiscountsByDate(product.getBrand().getId(), today);
                        if (!brandDiscounts.isEmpty()) {
                            discountPercent = brandDiscounts.get(0).getDiscountPercent();
                        }
                    }
                }
            }
            if (discountPercent != null && discountPercent > 0) {
                varDTO.setDiscountPercent(discountPercent);
                int discounted = (int) Math.round(variant.getPrice() * (1 - discountPercent / 100.0));
                varDTO.setDiscountedPrice(discounted);
            } else {
                varDTO.setDiscountPercent(null);
                varDTO.setDiscountedPrice(null);
            }
            // --- End discount logic ---

            return varDTO;
        }).toList();

        dto.setVariants(variantDTOs);
        if (product.getBrand() != null) {
            dto.setBrand(product.getBrand().getName());
            dto.setBrandId(product.getBrand().getId());
        } else {
            dto.setBrand(null);
            dto.setBrandId(null);
        }
        return dto;
    }

    /**
     * Check if a product or any of its variants is referenced by orders or refunds
     */
    public boolean isProductReferenced(Long productId) {
        // Check orders
        if (!orderDetailRepository.findByVariant_Product_Id(productId).isEmpty()) {
            return true;
        }
        // Check refunds
        if (!refundRequestRepository.findByOrderDetail_Variant_Product_Id(productId).isEmpty()) {
            return true;
        }
        List<ProductVariantEntity> variants = variantRepository.findByProductId(productId);
        for (ProductVariantEntity variant : variants) {
            // Check orders
            if (!orderDetailRepository.findByVariant_Id(variant.getId()).isEmpty()) {
                return true;
            }
            // Check refunds
            if (!refundRequestRepository.findByOrderDetail_Variant_Id(variant.getId()).isEmpty()) {
                return true;
            }
        }
        return false;
    }

    @Transactional
    public void deleteProduct(Long productId) {
        try {
            if (isProductReferenced(productId)) {
                throw new RuntimeException("PRODUCT_PURCHASED");
            }
            ProductEntity product = proRepo.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));
            // Delete all variants and their associated data first
            for (ProductVariantEntity variant : product.getVariants()) {
                variantRepository.delete(variant);
            }
            // Then delete the product
            proRepo.delete(product);
        } catch (Exception ex) {
            // If a constraint violation or order/refund-related exception occurs, soft delete
            ProductEntity product = proRepo.findById(productId).orElse(null);
            if (product != null) {
                product.setStatus(0);
                proRepo.save(product);
            }
            throw new RuntimeException("SOFT_DELETE: Product was hidden instead of deleted due to existing orders or refunds.", ex);
        }
    }

    @Transactional
    public List<ProductResponseDTO> getFilteredProducts(Long categoryId, Map<String, List<String>> filters) {
        System.out.println("Received filters: " + filters);
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        categoryIds.addAll(categoryService.getAllDescendantCategoryIds(categoryId));

        List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);

        return products.stream()
            .filter(product -> {
                // Brand filter
                if (filters != null && filters.containsKey("brand")) {
                    List<String> brandFilters = filters.get("brand");
                    String productBrand = product.getBrand() != null ? product.getBrand().getName() : null;
                    if (brandFilters != null && !brandFilters.isEmpty() && (productBrand == null || !brandFilters.contains(productBrand))) {
                        return false;
                    }
                }
                // Price filter (minPrice, maxPrice)
                Integer minPrice = null, maxPrice = null;
                if (filters != null && filters.containsKey("minPrice")) {
                    try {
                        minPrice = Integer.parseInt(filters.get("minPrice").get(0));
                    } catch (Exception ignored) {}
                }
                if (filters != null && filters.containsKey("maxPrice")) {
                    try {
                        maxPrice = Integer.parseInt(filters.get("maxPrice").get(0));
                    } catch (Exception ignored) {}
                }
                final Integer finalMinPrice = minPrice;
                final Integer finalMaxPrice = maxPrice;
                // A product is included if at least one of its variants matches ALL selected attribute filters and price
                return product.getVariants().stream().anyMatch(variant -> {
                    // Price check
                    if (finalMinPrice != null && variant.getPrice() < finalMinPrice) return false;
                    if (finalMaxPrice != null && variant.getPrice() > finalMaxPrice) return false;
                    if (filters == null || filters.isEmpty()) {
                        return true; // No filters, so all variants are considered valid
                    }
                    // Check if this variant matches all selected attribute filters (excluding brand and price)
                    return filters.entrySet().stream().allMatch(filterEntry -> {
                        String attributeName = filterEntry.getKey();
                        if (attributeName.equals("brand") || attributeName.equals("minPrice") || attributeName.equals("maxPrice")) {
                            return true; // Already handled
                        }
                        Object value = filterEntry.getValue();
                        List<String> attributeValues;
                        if (value instanceof String) {
                            attributeValues = List.of((String) value);
                        } else if (value instanceof List) {
                            attributeValues = (List<String>) value;
                        } else {
                            return false;
                        }
                        return variant.getAttributeValues().stream()
                                .anyMatch(vav -> {
                                    String attrName = vav.getAttribute().getName();
                                    String attrValue = vav.getValue();
                                    return attrName.equals(attributeName) && 
                                           attributeValues != null && 
                                           attributeValues.contains(attrValue);
                                });
                    });
                });
            })
            .map(this::convertToProductResponseDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Set<String>> getCategoryAttributeOptions(Long categoryId) {
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        categoryIds.addAll(categoryService.getAllDescendantCategoryIds(categoryId));

        Map<String, Set<String>> attributeOptions = new HashMap<>();

        // Get all products within the specified category and its descendants
        List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);

        // Iterate through all products and their variants to collect all distinct attribute values
        for (ProductEntity product : products) {
            for (ProductVariantEntity variant : product.getVariants()) {
                for (VariantAttributeValueEntity vav : variant.getAttributeValues()) {
                    attributeOptions.computeIfAbsent(vav.getAttribute().getName(), k -> new HashSet<>()).add(vav.getValue());
                }
            }
        }
        return attributeOptions;
    }

    public Integer getLatestPurchasePrice(Long variantId) {
        Optional<PurchaseHistoryEntity> latestPurchase = purchaseHistoryRepository.findTopByVariantIdOrderByPurchaseDateDesc(variantId);
        return latestPurchase.map(PurchaseHistoryEntity::getPurchasePrice).orElse(0);
    }

    @Transactional
    public VariantResponseDTO addStock(Long variantId, AddStockRequestDTO request, Long adminId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        // Check if selling price has changed
        boolean priceChanged = variant.getPrice() != request.getSellingPrice();
        Integer oldPrice = variant.getPrice();

        // Create new purchase history record
        PurchaseHistoryEntity purchase = new PurchaseHistoryEntity();
        purchase.setVariant(variant);
        purchase.setPurchasePrice(request.getPurchasePrice());
        purchase.setQuantity(request.getQuantity());
        purchase.setRemainingQuantity(request.getQuantity());
        Long effectiveAdminId = request.getAdminId() != null ? request.getAdminId() : adminId;
        if (effectiveAdminId != null) {
            UserEntity admin = userRepository.findById(effectiveAdminId)
                    .orElseThrow(() -> new RuntimeException("Admin not found"));
            purchase.setAdmin(admin);
        }
        purchaseHistoryRepository.save(purchase);

        // If selling price changed, create a price history record (for the new price)
        if (priceChanged) {
            ProductVariantPriceHistoryEntity priceHistory = new ProductVariantPriceHistoryEntity();
            priceHistory.setVariant(variant);
            priceHistory.setPrice(request.getSellingPrice()); // Store the new price
            priceHistory.setPriceDate(LocalDateTime.now());
            if (adminId != null) {
                UserEntity admin = userRepository.findById(adminId)
                        .orElseThrow(() -> new RuntimeException("Admin not found"));
                priceHistory.setAdmin(admin);
            }
            priceHistoryRepository.save(priceHistory);
        }

        // Recalculate stock from all purchase batches' remaining quantities
        List<PurchaseHistoryEntity> allBatches = purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant);
        int totalStock = allBatches.stream().mapToInt(PurchaseHistoryEntity::getRemainingQuantity).sum();
        variant.setStock(totalStock);
        variant.setPrice(request.getSellingPrice());
        variantRepository.save(variant);

        // After stock is increased:
        if (request.getQuantity() > 0) {
            java.util.List<com.maven.demo.entity.RestockNotificationEntity> notifications = restockNotificationRepository.findByVariantId(variantId);
            for (com.maven.demo.entity.RestockNotificationEntity restock : notifications) {
                // Build product name and attributes string
                String productName = variant.getProduct().getName();
                StringBuilder attrBuilder = new StringBuilder();
                if (variant.getAttributeValues() != null && !variant.getAttributeValues().isEmpty()) {
                    for (var attrVal : variant.getAttributeValues()) {
                        if (attrBuilder.length() > 0) attrBuilder.append(", ");
                        attrBuilder.append(attrVal.getAttribute().getName()).append(": ").append(attrVal.getValue());
                    }
                }
                String attrString = attrBuilder.length() > 0 ? attrBuilder.toString() : "";
                String message = String.format(
                        "Good news! The product you were waiting for — </b> <b>%s</b>%s — is now <b>back in stock</b>!<br>" +
                                "Don't miss your chance to grab it before it sells out again. Click below to check it out.",
                        productName,
                        attrString.isEmpty() ? "" : " (" + attrString + ")"
                );

                notificationService.createUserNotification(
                    restock.getUser(),
                    "Product Restocked",
                    message,
                    "RESTOCK",
                    variant.getProduct().getId() // Use product ID instead of variant ID
                );
                restockNotificationRepository.delete(restock);
            }   
        }

        return convertToVariantResponseDTO(variant);
    }

    @Transactional
    public VariantResponseDTO reduceStock(Long variantId, ReduceStockRequestDTO request, Long adminId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        if (adminId == null) {
            throw new RuntimeException("Admin ID is required for stock reduction.");
        }
        UserEntity admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        int totalToReduce = 0;
        int totalStockBeforeReduction = variant.getStock();
        
        // Use a single timestamp for all reductions in this action
        LocalDateTime reductionTime = LocalDateTime.now();
        
        for (ReduceStockRequestDTO.PurchaseReduction reduction : request.getReductions()) {
            if (reduction.getQuantity() > 0) {
            PurchaseHistoryEntity purchase = purchaseHistoryRepository.findById(reduction.getPurchaseId())
                    .orElseThrow(() -> new RuntimeException("Purchase not found: " + reduction.getPurchaseId()));
                
            if (purchase.getRemainingQuantity() < reduction.getQuantity()) {
                throw new RuntimeException("Not enough stock in purchase " + reduction.getPurchaseId());
            }
                
                // Create reduce stock history record
                ReduceStockHistoryEntity historyRecord = new ReduceStockHistoryEntity();
                historyRecord.setVariant(variant);
                historyRecord.setPurchaseHistory(purchase);
                historyRecord.setQuantityReduced(reduction.getQuantity());
                historyRecord.setPurchasePriceAtReduction(purchase.getPurchasePrice());
                historyRecord.setReductionReason(request.getReductionReason() != null ? request.getReductionReason() : "Manual reduction");
                historyRecord.setAdmin(admin);
                historyRecord.setTotalStockBeforeReduction(totalStockBeforeReduction);
                historyRecord.setReducedAt(reductionTime); // Set the same timestamp for all
                
                // Update purchase history
            purchase.setRemainingQuantity(purchase.getRemainingQuantity() - reduction.getQuantity());
            purchaseHistoryRepository.save(purchase);
                
            totalToReduce += reduction.getQuantity();
                
                // Save history record
                reduceStockHistoryRepository.save(historyRecord);
        }
        }
        
        // Recalculate stock from all purchase batches' remaining quantities
        List<PurchaseHistoryEntity> allBatches = purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant);
        int totalStockAfterReduction = allBatches.stream().mapToInt(PurchaseHistoryEntity::getRemainingQuantity).sum();
        variant.setStock(totalStockAfterReduction);
        variantRepository.save(variant);
        
        // Update the history records with the final stock after reduction
        List<ReduceStockHistoryEntity> recentHistoryRecords = reduceStockHistoryRepository
                .findByVariantIdOrderByReducedAtDesc(variantId);
        if (!recentHistoryRecords.isEmpty()) {
            for (int i = 0; i < Math.min(recentHistoryRecords.size(), request.getReductions().size()); i++) {
                ReduceStockHistoryEntity record = recentHistoryRecords.get(i);
                if (record.getTotalStockAfterReduction() == null) {
                    record.setTotalStockAfterReduction(totalStockAfterReduction);
                    reduceStockHistoryRepository.save(record);
                }
            }
        }
        
        return convertToVariantResponseDTO(variant);
    }

    private VariantResponseDTO convertToVariantResponseDTO(ProductVariantEntity variant) {
        VariantResponseDTO dto = new VariantResponseDTO();
        dto.setId(variant.getId());
        dto.setPrice(variant.getPrice());
        dto.setStock(variant.getStock());
        dto.setSku(variant.getSku());
        dto.setProductName(variant.getProduct().getName());

        // Convert attributes
        Map<String, String> attributes = new HashMap<>();
        for (VariantAttributeValueEntity value : variant.getAttributeValues()) {
            attributes.put(value.getAttribute().getName(), value.getValue());
        }
        dto.setAttributes(attributes);

        // Convert images
        List<String> imageUrls = variant.getImages().stream()
                .map(ProductVariantImage::getImageUrl)
                .collect(Collectors.toList());
        dto.setImageUrls(imageUrls);

        return dto;
    }

    @Transactional
    public List<PriceHistoryResponseDTO> getPriceHistory(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return priceHistoryRepository.findByVariantOrderByPriceDateDesc(variant).stream()
                .map(this::convertToPriceHistoryResponseDTO)
                .toList();
    }

    @Transactional
    public List<PurchaseHistoryResponseDTO> getPurchaseHistory(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return purchaseHistoryRepository.findByVariantOrderByPurchaseDateDesc(variant).stream()
                .map(this::convertToPurchaseHistoryResponseDTO)
                .toList();
    }

    @Transactional
    public List<ReduceStockHistoryResponseDTO> getReduceStockHistory(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return reduceStockHistoryRepository.findByVariantIdOrderByReducedAtDesc(variantId).stream()
                .map(this::convertToReduceStockHistoryResponseDTO)
                .toList();
    }

    public List<LostProductAnalyticsDTO> getLostProductsAnalytics(String fromDate, String toDate, String reason) {
        LocalDateTime from;
        LocalDateTime to;
        
        try {
            from = LocalDateTime.parse(fromDate + "T00:00:00");
            to = LocalDateTime.parse(toDate + "T23:59:59");
        } catch (Exception e) {
            throw new RuntimeException("Invalid date format. Expected format: yyyy-MM-dd", e);
        }
        
        List<ReduceStockHistoryEntity> historyRecords;
        if (reason != null && !reason.trim().isEmpty()) {
            historyRecords = reduceStockHistoryRepository.findByReductionReasonAndReducedAtBetweenOrderByReducedAtDesc(reason.trim(), from, to);
        } else {
            historyRecords = reduceStockHistoryRepository.findByReducedAtBetweenOrderByReducedAtDesc(from, to);
        }
        
        // Group by variant and reason to calculate totals
        Map<String, List<ReduceStockHistoryEntity>> groupedRecords = historyRecords.stream()
                .collect(Collectors.groupingBy(record -> 
                    record.getVariant().getId() + "|" + record.getReductionReason()));
        
        List<LostProductAnalyticsDTO> analytics = new ArrayList<>();
        
        for (List<ReduceStockHistoryEntity> records : groupedRecords.values()) {
            if (!records.isEmpty()) {
                ReduceStockHistoryEntity firstRecord = records.get(0);
                ProductVariantEntity variant = firstRecord.getVariant();
                if (variant == null) continue;
                
                ProductEntity product = variant.getProduct();
                if (product == null) continue;
                
                LostProductAnalyticsDTO dto = new LostProductAnalyticsDTO();
                dto.setProductId(product.getId());
                dto.setProductName(product.getName());
                dto.setVariantId(variant.getId());
                
                // Get variant attributes and format them
                Map<String, String> attributes = new HashMap<>();
                for (VariantAttributeValueEntity value : variant.getAttributeValues()) {
                    attributes.put(value.getAttribute().getName(), value.getValue());
                }
                
                // Format variant name from attributes
                String variantName = attributes.isEmpty() ? "Default" : 
                    attributes.entrySet().stream()
                        .map(entry -> entry.getKey() + ": " + entry.getValue())
                        .collect(Collectors.joining(", "));
                
                dto.setVariantName(variantName);
                dto.setVariantAttributes(variantName); // Store the formatted attributes
                dto.setSku(variant.getSku());
                dto.setCategory(product.getCategory().getName());
                dto.setImageUrl(variant.getImages() != null && !variant.getImages().isEmpty() ? 
                    variant.getImages().get(0).getImageUrl() : null);
                dto.setReductionReason(firstRecord.getReductionReason());
                
                // Calculate totals
                int totalQuantityLost = records.stream().mapToInt(ReduceStockHistoryEntity::getQuantityReduced).sum();
                int totalPurchasePriceLost = records.stream()
                    .mapToInt(r -> r.getQuantityReduced() * r.getPurchasePriceAtReduction()).sum();
                
                dto.setTotalQuantityLost(totalQuantityLost);
                dto.setTotalPurchasePriceLost(totalPurchasePriceLost);
                dto.setReductionCount(records.size());
                
                // Get latest reduction info
                ReduceStockHistoryEntity latestRecord = records.stream()
                    .max(Comparator.comparing(ReduceStockHistoryEntity::getReducedAt))
                    .orElse(firstRecord);
                dto.setLastReducedAt(latestRecord.getReducedAt().toString());
                dto.setAdminName(latestRecord.getAdmin() != null ? latestRecord.getAdmin().getName() : "Unknown");
                
                analytics.add(dto);
            }
        }
        
        // Sort by total purchase price lost (descending)
        analytics.sort((a, b) -> Integer.compare(b.getTotalPurchasePriceLost(), a.getTotalPurchasePriceLost()));
        
        return analytics;
    }

    private PriceHistoryResponseDTO convertToPriceHistoryResponseDTO(ProductVariantPriceHistoryEntity entity) {
        PriceHistoryResponseDTO dto = new PriceHistoryResponseDTO();
        dto.setId(entity.getId());
        dto.setPrice(entity.getPrice());
        dto.setPriceDate(entity.getPriceDate());
        if (entity.getAdmin() != null) {
            dto.setAdminId(entity.getAdmin().getId());
            dto.setAdminName(entity.getAdmin().getName());
        }
        return dto;
    }

    private PurchaseHistoryResponseDTO convertToPurchaseHistoryResponseDTO(PurchaseHistoryEntity entity) {
        PurchaseHistoryResponseDTO dto = new PurchaseHistoryResponseDTO();
        dto.setId(entity.getId());
        dto.setPurchasePrice(entity.getPurchasePrice());
        dto.setQuantity(entity.getQuantity());
        dto.setRemainingQuantity(entity.getRemainingQuantity());
        dto.setPurchaseDate(entity.getPurchaseDate());
        if (entity.getAdmin() != null) {
            dto.setAdminId(entity.getAdmin().getId());
            dto.setAdminName(entity.getAdmin().getName());
        }
        return dto;
    }

    private ReduceStockHistoryResponseDTO convertToReduceStockHistoryResponseDTO(ReduceStockHistoryEntity entity) {
        ReduceStockHistoryResponseDTO dto = new ReduceStockHistoryResponseDTO();
        dto.setId(entity.getId());
        dto.setVariantId(entity.getVariant().getId());
        dto.setVariantSku(entity.getVariant().getSku());
        dto.setProductName(entity.getVariant().getProduct().getName());
        dto.setPurchaseHistoryId(entity.getPurchaseHistory().getId());
        dto.setQuantityReduced(entity.getQuantityReduced());
        dto.setPurchasePriceAtReduction(entity.getPurchasePriceAtReduction());
        dto.setReductionReason(entity.getReductionReason());
        dto.setReducedAt(entity.getReducedAt());
        dto.setTotalStockBeforeReduction(entity.getTotalStockBeforeReduction());
        dto.setTotalStockAfterReduction(entity.getTotalStockAfterReduction());
        
        if (entity.getAdmin() != null) {
            dto.setAdminId(entity.getAdmin().getId());
            dto.setAdminName(entity.getAdmin().getName());
        }
        
        return dto;
    }

    public VariantResponseDTO getVariantById(Long variantId) {
        ProductVariantEntity variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));
        
        return convertToVariantResponseDTO(variant);
    }

    public List<ProductResponseDTO> getAllProducts() {
        List<ProductEntity> products = proRepo.findAll();
        return products.stream().map(this::convertToProductResponseDTO).collect(Collectors.toList());
    }

    // Returns the latest added products (by created_at desc)
    public List<ProductSearchResultDTO> getLatestProducts(int limit) {
        List<ProductEntity> products = proRepo.findAll();
        products.sort((a, b) -> b.getCreated_at().compareTo(a.getCreated_at()));
        return products.stream()
            .limit(limit)
            .map(product -> {
                ProductSearchResultDTO dto = new ProductSearchResultDTO();
                dto.setProductId(product.getId());
                dto.setProductName(product.getName());
                dto.setCategory(product.getCategory() != null ? product.getCategory().getName() : null);
                dto.setImageUrl(product.getBasePhotoUrl());
                // Optionally, set a price (e.g., min price among variants)
                if (product.getVariants() != null && !product.getVariants().isEmpty()) {
                    int minPrice = product.getVariants().stream().mapToInt(v -> v.getPrice()).min().orElse(0);
                    dto.setSellingPrice(java.math.BigDecimal.valueOf(minPrice));
                }
                if (product.getBrand() != null && product.getBrand().getName() != null) {
                    dto.setBrandName(product.getBrand().getName());
                }
                return dto;
            })
            .toList();
    }

    // Returns products that are part of active discount events
    public List<ProductSearchResultDTO> getEventDiscountProducts(int limit) {
        // Find all active discount rules
        List<DiscountRule> activeRules = discountRuleRepository.findAll().stream()
            .filter(DiscountRule::isActive)
            .toList();
        Set<Long> variantIds = new HashSet<>();
        for (DiscountRule rule : activeRules) {
            if (rule.getProductVariantId() != null) {
                variantIds.add(rule.getProductVariantId());
            }
        }
        return variantIds.stream()
            .limit(limit)
            .map(variantId -> variantRepository.findById(variantId).orElse(null))
            .filter(variant -> variant != null)
            .map(variant -> {
                ProductEntity product = variant.getProduct();
                ProductSearchResultDTO dto = new ProductSearchResultDTO();
                if (product != null) {
                    dto.setProductId(product.getId());
                    dto.setProductName(product.getName());
                }
                dto.setVariantId(variant.getId());
                dto.setVariantName(variant.getSku()); // or build from attributes
                dto.setSku(variant.getSku());
                dto.setSellingPrice(java.math.BigDecimal.valueOf(variant.getPrice()));
                dto.setStockQuantity(variant.getStock());
                if (variant.getImages() != null && !variant.getImages().isEmpty()) {
                    dto.setImageUrl(variant.getImages().get(0).getImageUrl());
                }
                // --- Discount percent logic ---
                Double discountPercent = null;
                // 1. Variant discount (highest priority)
                List<DiscountRule> variantDiscounts = discountRuleRepository.findAllByProductVariantIdAndActive(variant.getId());
                if (!variantDiscounts.isEmpty()) {
                    discountPercent = variantDiscounts.get(0).getDiscountPercent();
                } else {
                    // 2. Product discount
                    List<DiscountRule> productDiscounts = discountRuleRepository.findActiveProductDiscounts(product.getId());
                    if (!productDiscounts.isEmpty()) {
                        discountPercent = productDiscounts.get(0).getDiscountPercent();
                    } else {
                        // 3. Category discount (check all ancestors, closest first)
                        CategoryEntity cat = product.getCategory();
                        while (cat != null && discountPercent == null) {
                            List<DiscountRule> categoryDiscounts = discountRuleRepository.findActiveCategoryDiscounts(cat.getId());
                            if (!categoryDiscounts.isEmpty()) {
                                discountPercent = categoryDiscounts.get(0).getDiscountPercent();
                                break;
                            }
                            cat = cat.getParentCategory();
                        }
                        // 4. Brand discount (lowest priority)
                        if (discountPercent == null && product.getBrand() != null) {
                            List<DiscountRule> brandDiscounts = discountRuleRepository.findActiveBrandDiscounts(product.getBrand().getId());
                            if (!brandDiscounts.isEmpty()) {
                                discountPercent = brandDiscounts.get(0).getDiscountPercent();
                            }
                        }
                    }
                }
                if (discountPercent != null && discountPercent > 0) {
                    dto.setDiscountPercent(discountPercent);
                } else {
                    dto.setDiscountPercent(null);
                }
                // --- End discount percent logic ---
                return dto;
            })
            .toList();
    }

    // Returns products grouped by active discount events (category, product, brand, variant level)
    public List<EventDiscountProductsDTO> getEventDiscountProductsGrouped() {
        java.time.LocalDate today = java.time.LocalDate.now();
        List<DiscountEvent> activeEvents = discountEventRepository.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today);
        System.out.println("Active events: " + activeEvents.size());
        List<EventDiscountProductsDTO> result = new ArrayList<>();
        for (DiscountEvent event : activeEvents) {
            System.out.println("Event: " + event.getName() + ", rules: " + event.getRules().size());
            List<DiscountRule> rules = event.getRules();
            Set<Long> variantIds = new HashSet<>();
            for (DiscountRule rule : rules) {
                if (rule.getCategoryId() != null) {
                    System.out.println("  Category rule: " + rule.getCategoryId());
                    List<Long> categoryIds = new ArrayList<>();
                    categoryIds.add(rule.getCategoryId());
                    categoryIds.addAll(categoryService.getAllDescendantCategoryIds(rule.getCategoryId()));
                    List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);
                    for (ProductEntity product : products) {
                        for (ProductVariantEntity variant : product.getVariants()) {
                            variantIds.add(variant.getId());
                        }
                    }
                } else if (rule.getProductId() != null) {
                    System.out.println("  Product rule: " + rule.getProductId());
                    Optional<ProductEntity> productOpt = proRepo.findById(rule.getProductId());
                    if (productOpt.isPresent()) {
                        for (ProductVariantEntity variant : productOpt.get().getVariants()) {
                            variantIds.add(variant.getId());
                        }
                    }
                } else if (rule.getBrandId() != null) {
                    System.out.println("  Brand rule: " + rule.getBrandId());
                    List<ProductEntity> products = proRepo.findByBrandId(rule.getBrandId());
                    for (ProductEntity product : products) {
                        for (ProductVariantEntity variant : product.getVariants()) {
                            variantIds.add(variant.getId());
                        }
                    }
                } else if (rule.getProductVariantId() != null) {
                    System.out.println("  Variant rule: " + rule.getProductVariantId());
                    variantIds.add(rule.getProductVariantId());
                }
            }
            System.out.println("  Total variants for event: " + variantIds.size());
            List<ProductSearchResultDTO> products = variantIds.stream()
                .map(variantId -> variantRepository.findById(variantId).orElse(null))
                .filter(variant -> variant != null)
                .map(variant -> {
                    ProductEntity product = variant.getProduct();
                    ProductSearchResultDTO dto = new ProductSearchResultDTO();
                    if (product != null) {
                        dto.setProductId(product.getId());
                        dto.setProductName(product.getName());
                    }
                    dto.setVariantId(variant.getId());
                    dto.setVariantName(variant.getSku());
                    dto.setSku(variant.getSku());
                    dto.setSellingPrice(java.math.BigDecimal.valueOf(variant.getPrice()));
                    dto.setStockQuantity(variant.getStock());
                    if (variant.getImages() != null && !variant.getImages().isEmpty()) {
                        dto.setImageUrl(variant.getImages().get(0).getImageUrl());
                    }
                    // --- Discount percent logic ---
                    Double discountPercent = null;
                    // 1. Variant discount (highest priority)
                    List<DiscountRule> variantDiscounts = discountRuleRepository.findAllByProductVariantIdAndActive(variant.getId());
                    if (!variantDiscounts.isEmpty()) {
                        discountPercent = variantDiscounts.get(0).getDiscountPercent();
                    } else {
                        // 2. Product discount
                        List<DiscountRule> productDiscounts = discountRuleRepository.findActiveProductDiscounts(product.getId());
                        if (!productDiscounts.isEmpty()) {
                            discountPercent = productDiscounts.get(0).getDiscountPercent();
                        } else {
                            // 3. Category discount (check all ancestors, closest first)
                            CategoryEntity cat = product.getCategory();
                            while (cat != null && discountPercent == null) {
                                List<DiscountRule> categoryDiscounts = discountRuleRepository.findActiveCategoryDiscounts(cat.getId());
                                if (!categoryDiscounts.isEmpty()) {
                                    discountPercent = categoryDiscounts.get(0).getDiscountPercent();
                                    break;
                                }
                                cat = cat.getParentCategory();
                            }
                            // 4. Brand discount (lowest priority)
                            if (discountPercent == null && product.getBrand() != null) {
                                List<DiscountRule> brandDiscounts = discountRuleRepository.findActiveBrandDiscounts(product.getBrand().getId());
                                if (!brandDiscounts.isEmpty()) {
                                    discountPercent = brandDiscounts.get(0).getDiscountPercent();
                                }
                            }
                        }
                    }
                    if (discountPercent != null && discountPercent > 0) {
                        dto.setDiscountPercent(discountPercent);
                    } else {
                        dto.setDiscountPercent(null);
                    }
                    // --- End discount percent logic ---
                    // Set attributes from variant attribute values
                    java.util.Map<String, String> attributes = new java.util.HashMap<>();
                    if (variant.getAttributeValues() != null) {
                        for (var vav : variant.getAttributeValues()) {
                            attributes.put(vav.getAttribute().getName(), vav.getValue());
                        }
                    }
                    dto.setAttributes(attributes);
                    return dto;
                })
                .toList();
            if (!products.isEmpty()) {
                EventDiscountProductsDTO eventDto = new EventDiscountProductsDTO();
                eventDto.setEventId(event.getId());
                eventDto.setEventName(event.getName());
                eventDto.setEventDueDate(event.getEndDate());
                // Map ProductSearchResultDTO to DiscountedProductDTO
                List<EventDiscountProductsDTO.DiscountedProductDTO> discountedProducts = products.stream().map(product -> {
                    EventDiscountProductsDTO.DiscountedProductDTO d = new EventDiscountProductsDTO.DiscountedProductDTO();
                    d.setProductId(product.getProductId());
                    d.setVariantId(product.getVariantId());
                    d.setProductName(product.getProductName());
                    d.setImageUrl(product.getImageUrl());
                    d.setSku(product.getSku());
                    d.setOriginalPrice(product.getSellingPrice());
                    d.setDiscountPercent(product.getDiscountPercent());
                    if (product.getSellingPrice() != null && product.getDiscountPercent() != null) {
                        double percent = product.getDiscountPercent();
                        d.setDiscountedPrice(product.getSellingPrice().multiply(java.math.BigDecimal.valueOf(1 - percent / 100.0)));
                    } else {
                        d.setDiscountedPrice(null);
                    }
                    // Copy attributes to DiscountedProductDTO
                    d.setAttributes(product.getAttributes());
                    return d;
                }).toList();
                eventDto.setProducts(discountedProducts);
                result.add(eventDto);
            }
        }
        System.out.println("Returning " + result.size() + " event discount groups");
        return result;
    }

    // Get all unique brands for a category
    public List<String> getBrandsForCategory(Long categoryId) {
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        categoryIds.addAll(categoryService.getAllDescendantCategoryIds(categoryId));
        List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);
        Set<String> brands = new HashSet<>();
        for (ProductEntity product : products) {
            if (product.getBrand() != null && product.getBrand().getName() != null) {
                brands.add(product.getBrand().getName());
            }
        }
        return new ArrayList<>(brands);
    }

    public Map<String, Integer> getMinMaxPriceForCategory(Long categoryId) {
        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);
        categoryIds.addAll(categoryService.getAllDescendantCategoryIds(categoryId));
        List<ProductEntity> products = proRepo.findByCategoryIdIn(categoryIds);
        int min = Integer.MAX_VALUE;
        int max = Integer.MIN_VALUE;
        for (ProductEntity product : products) {
            for (ProductVariantEntity variant : product.getVariants()) {
                int price = variant.getPrice();
                if (price < min) min = price;
                if (price > max) max = price;
            }
        }
        if (min == Integer.MAX_VALUE) min = 0;
        if (max == Integer.MIN_VALUE) max = 0;
        Map<String, Integer> result = new HashMap<>();
        result.put("min", min);
        result.put("max", max);
        return result;
    }

    /**
     * Get predefined reduction reasons for the frontend dropdown
     */
    public List<String> getPredefinedReductionReasons() {
        return List.of(
            "Damaged goods",
            "Quality issues", 
            "Return to supplier",
            "Expired products",
            "Lost items",
            "Theft",
            "Natural disaster",
            "System error",
            "Other"
        );
    }

    public List<String> getColumnsByCategoryId(Long categoryId) {
        List<String> columns = new ArrayList<>(List.of("name", "description"));

        Optional<CategoryEntity> categoryOpt = catRepo.findById(categoryId);
        if (categoryOpt.isEmpty()) return columns;

        CategoryEntity category = categoryOpt.get();
        List<AttributeEntity> attributes = attriRepo.findByCategory(category);

        for (AttributeEntity attr : attributes) {
            columns.add(attr.getName());
        }

        return columns;
    }

    public List<ProductSearchResultDTO> getRecommendedProducts(Long productId, int limit) {
        ProductEntity current = proRepo.findById(productId).orElse(null);
        if (current == null) return List.of();
        List<ProductSearchResultDTO> result = new ArrayList<>();
        // 1. Same brand and same category
        if (current.getBrand() != null && current.getCategory() != null) {
            List<ProductEntity> sameBrandCat = proRepo.findByBrandIdAndCategoryId(current.getBrand().getId(), current.getCategory().getId());
            for (ProductEntity p : sameBrandCat) {
                if (p.getId() != productId && result.size() < limit) {
                    result.add(toSearchResultDTO(p));
                }
            }
        }
        // 2. Same category
        if (current.getCategory() != null && result.size() < limit) {
            List<ProductEntity> sameCat = proRepo.findByCategoryId(current.getCategory().getId());
            for (ProductEntity p : sameCat) {
                if (p.getId() != productId && result.stream().noneMatch(r -> r.getProductId().equals(p.getId())) && result.size() < limit) {
                    result.add(toSearchResultDTO(p));
                }
            }
        }
        // 3. Same brand, different category
        if (current.getBrand() != null && result.size() < limit) {
            List<ProductEntity> sameBrand = proRepo.findByBrandId(current.getBrand().getId());
            for (ProductEntity p : sameBrand) {
                if (p.getId() != productId && (p.getCategory() == null || p.getCategory().getId() != current.getCategory().getId()) && result.stream().noneMatch(r -> r.getProductId().equals(p.getId())) && result.size() < limit) {
                    result.add(toSearchResultDTO(p));
                }
            }
        }
        return result.stream().limit(limit).toList();
    }

    private ProductSearchResultDTO toSearchResultDTO(ProductEntity p) {
        ProductSearchResultDTO dto = new ProductSearchResultDTO();
        dto.setProductId(p.getId());
        dto.setProductName(p.getName());
        dto.setImageUrl(p.getBasePhotoUrl());
        return dto;
    }

    // Product History Methods
    @Transactional
    public void recordProductHistory(Long productId, Long adminId, String action, String fieldName, String oldValue, String newValue) {
        ProductHistory history = new ProductHistory();
        history.setProductId(productId);
        history.setAdminId(adminId);
        history.setAction(action);
        history.setFieldName(fieldName);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        productHistoryRepository.save(history);
    }

    @Transactional
    public List<ProductHistoryDTO> getProductHistory(Long productId) {
        List<ProductHistory> histories = productHistoryRepository.findByProductIdOrderByCreatedAtDesc(productId);
        return histories.stream()
                .map(this::convertToProductHistoryDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ProductHistoryDTO> getProductHistoryByAdmin(Long adminId) {
        List<ProductHistory> histories = productHistoryRepository.findByAdminIdOrderByCreatedAtDesc(adminId);
        return histories.stream()
                .map(this::convertToProductHistoryDTO)
                .collect(Collectors.toList());
    }

    private ProductHistoryDTO convertToProductHistoryDTO(ProductHistory history) {
        ProductHistoryDTO dto = new ProductHistoryDTO();
        dto.setId(history.getId());
        dto.setProductId(history.getProductId());
        dto.setAdminId(history.getAdminId());
        dto.setAction(history.getAction());
        dto.setFieldName(history.getFieldName());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setCreatedAt(history.getCreatedAt());
        
        // Get admin name
        if (history.getAdminId() != null) {
            UserEntity admin = userRepository.findById(history.getAdminId()).orElse(null);
            dto.setAdminName(admin != null ? admin.getName() : "Unknown Admin");
        }
        
        return dto;
    }
}
