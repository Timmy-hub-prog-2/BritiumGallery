package com.maven.demo.service;

import com.maven.demo.dto.*;

import java.util.List;

public interface UserDetailService {

    UserResponseDTO getUserPersonalInfo(Long userId);

    List<OrderResponseDTO> getUserOrders(Long userId);

    List<RefundRequestDTO.RefundHistoryDTO> getUserRefundRequests(Long userId);

    List<WishlistDTO> getUserWishlist(Long userId);

    List<OrderDetailDTO> getUserRemainders(Long userId);
}
