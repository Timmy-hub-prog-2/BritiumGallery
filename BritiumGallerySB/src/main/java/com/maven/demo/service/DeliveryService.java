package com.maven.demo.service;

import com.maven.demo.dto.DeliveryDTO;
import com.maven.demo.dto.DeliveryFeeRequestDTO;
import com.maven.demo.dto.DeliveryFeeResponseDTO;

import java.util.List;

public interface DeliveryService {
    DeliveryDTO createDelivery(DeliveryDTO dto);
    List<DeliveryDTO> getAllDeliveries();
    DeliveryDTO getDeliveryById(Integer id);
    DeliveryDTO updateDelivery(Integer id, DeliveryDTO dto);

    void deleteDelivery(Integer id);
    DeliveryFeeResponseDTO calculateFee(DeliveryFeeRequestDTO request);


}
