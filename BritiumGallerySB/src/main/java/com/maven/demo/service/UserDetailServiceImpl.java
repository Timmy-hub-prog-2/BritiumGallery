package com.maven.demo.service;

import com.maven.demo.dto.*;
import com.maven.demo.entity.*;
import com.maven.demo.repository.*;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import com.maven.demo.dto.RefundRequestDTO.RefundHistoryDTO;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserDetailServiceImpl implements UserDetailService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final RefundRequestRepository refundRepository;
    private final WishlistRepository wishlistRepository;
    private final ModelMapper modelMapper;

    public UserDetailServiceImpl(UserRepository userRepository,
                                 OrderRepository orderRepository,
                                 RefundRequestRepository refundRepository,

                                 WishlistRepository wishlistRepository,
                                 ModelMapper modelMapper) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.refundRepository = refundRepository;

        this.wishlistRepository = wishlistRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    public UserResponseDTO getUserPersonalInfo(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setGender(user.getGender());
        dto.setStatus(user.getStatus());
        if (user.getCustomerType() != null) {
            dto.setCustomerType(user.getCustomerType().getType()); // replace with getName() if that's correct
        }

        if (user.getTotalSpends() != null && !user.getTotalSpends().isEmpty()) {
            int total = user.getTotalSpends().stream()
                    .mapToInt(TotalSpendEntity::getAmount) // Make sure `getAmount()` exists
                    .sum();
            dto.setTotalSpend(total);
        }


        // ✅ Set role info if available
        if (user.getRole() != null) {
            dto.setRoleId(user.getRole().getId());
            dto.setRoleName(user.getRole().getType());

        }

        // ✅ Set image URLs
        if (user.getImageUrls() != null && !user.getImageUrls().isEmpty()) {
            dto.setImageUrls(user.getImageUrls());
        }

        // ✅ Set main address
        if (user.getAddresses() != null && !user.getAddresses().isEmpty()) {
            AddressEntity mainAddress = user.getAddresses()
                    .stream()
                    .filter(AddressEntity::isMainAddress) // ✅ Correct method for boolean field
                    // or use .isMain() if using Lombok
                    .findFirst()
                    .orElse(null);

            if (mainAddress != null) {
                dto.setAddress(modelMapper.map(mainAddress, AddressDTO.class));
            }
        }
        return dto;
    }

    @Override
    public List<OrderResponseDTO> getUserOrders(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<OrderEntity> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        List<OrderResponseDTO> result = new ArrayList<>();

        for (OrderEntity order : orders) {
            OrderResponseDTO orderDTO = new OrderResponseDTO();
            orderDTO.setId(order.getId());
            orderDTO.setOrderDate(order.getOrderDate());
            orderDTO.setStatus(order.getStatus().name());

            orderDTO.setSubtotal(order.getSubtotal());
            orderDTO.setDiscountAmount(order.getDiscountAmount());
            orderDTO.setDiscountType(order.getDiscountType());
            orderDTO.setDiscountValue(order.getDiscountValue());
            orderDTO.setAppliedCouponCode(order.getAppliedCouponCode());
            orderDTO.setTotal(order.getTotal());
            orderDTO.setDeliveryFee(order.getDeliveryFee());
            orderDTO.setDeliveryMethod(order.getDeliveryMethod());
            orderDTO.setDeliveryProvider(order.getDeliveryProvider());
            orderDTO.setTrackingCode(order.getTrackingCode());
            orderDTO.setPaymentMethod(order.getPaymentMethod());
            orderDTO.setNotes(order.getNotes());
            orderDTO.setRefundedAmount(order.getRefundedAmount());
            orderDTO.setEstimatedDeliveryTime(order.getEstimatedDeliveryTime());

            // Manual mapping for AddressDTO
            if (order.getDeliveryAddress() != null) {
                AddressEntity addr = order.getDeliveryAddress();
                AddressDTO addressDTO = new AddressDTO();
                addressDTO.setId(addr.getId());
                addressDTO.setCity(addr.getCity());
                addressDTO.setTownship(addr.getTownship());
                addressDTO.setStreet(addr.getStreet());
                addressDTO.setHouseNumber(addr.getHouseNumber());
                addressDTO.setWardName(addr.getWardName());
                addressDTO.setLatitude(addr.getLatitude());
                addressDTO.setLongitude(addr.getLongitude());
                addressDTO.setState(addr.getState());
                addressDTO.setCountry(addr.getCountry());
                addressDTO.setPostalCode(addr.getPostalCode());
                addressDTO.setMainAddress(addr.isMainAddress());
                addressDTO.setUserId(addr.getUser().getId());

                orderDTO.setDeliveryAddress(addressDTO);
            }

            // Manual mapping for UserResponseDTO
            UserEntity orderUser = order.getUser();
            UserResponseDTO userDTO = new UserResponseDTO();
            userDTO.setId(orderUser.getId());
            userDTO.setEmail(orderUser.getEmail());
            userDTO.setName(orderUser.getName());
            userDTO.setPhoneNumber(orderUser.getPhoneNumber());
            orderDTO.setUser(userDTO);

            // Order details
            List<OrderDetailDTO> detailDTOList = new ArrayList<>();
            for (OrderDetailEntity detail : order.getOrderDetails()) {
                OrderDetailDTO dto = new OrderDetailDTO();
                dto.setId(detail.getId());
                dto.setQuantity(detail.getQuantity());
                dto.setPrice(detail.getPrice());
                dto.setVariantId(detail.getVariant().getId());
                dto.setRefunded(detail.isRefunded());
                dto.setRefundedQty(detail.getRefundedQty());
                dto.setDiscountPercent(detail.getDiscountPercent());
                dto.setDiscountAmount(detail.getDiscountAmount());

                // Variant mapping
                ProductVariantEntity variant = detail.getVariant();
                OrderDetailVariantDTO variantDTO = new OrderDetailVariantDTO();
                variantDTO.setId(variant.getId());
                variantDTO.setSku(variant.getSku());

                if (variant.getProduct() != null) {
                    variantDTO.setProductName(variant.getProduct().getName());
                }

                Map<String, String> attributesMap = new LinkedHashMap<>();
                for (VariantAttributeValueEntity val : variant.getAttributeValues()) {
                    attributesMap.put(val.getAttribute().getName(), val.getValue());
                }
                variantDTO.setAttributes(attributesMap);

                List<ProductVariantImage> images = variant.getImages();
                List<String> imageUrls = images != null && !images.isEmpty()
                        ? images.stream().map(ProductVariantImage::getImageUrl).toList()
                        : Collections.emptyList();
                variantDTO.setImageUrls(imageUrls);

                dto.setVariant(variantDTO);
                detailDTOList.add(dto);
            }

            orderDTO.setOrderDetails(detailDTOList);
            result.add(orderDTO);
        }

        return result;
    }

    @Override
    public List<RefundRequestDTO.RefundHistoryDTO> getUserRefundRequests(Long userId) {
        return refundRepository.findByOrder_User_Id(userId)
                .stream()
                .map(refund -> {
                    RefundRequestDTO.RefundHistoryDTO dto = new RefundRequestDTO.RefundHistoryDTO();
                    dto.setId(refund.getId());
                    dto.setOrderId(refund.getOrder().getId());
                    dto.setOrderTrackingCode(refund.getOrder().getTrackingCode());
                    dto.setReason(refund.getReason());
                    dto.setStatus(refund.getStatus().name());
                    dto.setAmount(refund.getAmount());
                    dto.setProofImageUrl(refund.getProofImageUrl());
                    dto.setRequestedAt(refund.getRequestedAt());

                    int totalOrderItems = refund.getOrder().getOrderDetails().stream()
                            .mapToInt(item -> item.getQuantity())
                            .sum();

                    int totalRefundedItems = refundRepository.findByOrderId(refund.getOrder().getId()).stream()
                            .mapToInt(r -> r.getRefundQuantity() != null ? r.getRefundQuantity() : 0)
                            .sum();

                    dto.setFullReturn(totalRefundedItems >= totalOrderItems);

                    return dto;
                })
                .collect(Collectors.toList());
    }
    @Override
    public List<OrderDetailDTO> getUserRemainders(Long userId) {
        List<OrderDetailEntity> orderDetails = orderRepository.findRemaindersByUserId(userId);

        return orderDetails.stream().map(detail -> {
            OrderDetailDTO dto = new OrderDetailDTO();
            dto.setId(detail.getId());
            dto.setQuantity(detail.getQuantity());
            dto.setPrice(detail.getPrice());
            dto.setRefunded(detail.isRefunded());
            dto.setRefundedQty(detail.getRefundedQty());
            dto.setDiscountAmount(detail.getDiscountAmount());
            dto.setDiscountPercent(detail.getDiscountPercent());

            ProductVariantEntity variant = detail.getVariant();
            OrderDetailVariantDTO variantDTO = new OrderDetailVariantDTO();
            variantDTO.setId(variant.getId());
            variantDTO.setSku(variant.getSku());

            if (variant.getProduct() != null) {
                variantDTO.setProductName(variant.getProduct().getName());
            }

            Map<String, String> attributes = new LinkedHashMap<>();
            for (VariantAttributeValueEntity val : variant.getAttributeValues()) {
                attributes.put(val.getAttribute().getName(), val.getValue());
            }
            variantDTO.setAttributes(attributes);

            List<ProductVariantImage> images = variant.getImages();
            List<String> imageUrls = (images != null)
                    ? images.stream().map(ProductVariantImage::getImageUrl).toList()
                    : Collections.emptyList();
            variantDTO.setImageUrls(imageUrls);

            dto.setVariant(variantDTO);
            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public List<WishlistDTO> getUserWishlist(Long userId) {
        return wishlistRepository.findByUserId(userId)
                .stream()
                .map(item -> {
                    WishlistDTO wishlistDTO = modelMapper.map(item, WishlistDTO.class);

                    ProductVariantEntity variant = item.getProduct().getVariants().get(0); // Assume first variant
                    wishlistDTO.setPrice(variant.getPrice());
                    wishlistDTO.setProductName(item.getProduct().getName());
                    wishlistDTO.setProductPhotoUrl(item.getProduct().getBasePhotoUrl());

                    // Collect all attributes dynamically
                    Map<String, String> attributeMap = variant.getAttributeValues().stream()
                            .collect(Collectors.toMap(
                                    attr -> attr.getAttribute().getName(), // e.g., "Color", "Battery Life"
                                    attr -> attr.getValue() // e.g., "Red", "10 hours"
                            ));

                    wishlistDTO.setVariantAttributes(attributeMap);

                    return wishlistDTO;
                })
                .collect(Collectors.toList());
    }

}
