package com.maven.demo.service;

import com.maven.demo.dto.DeliveryDTO;
import com.maven.demo.dto.DeliveryFeeRequestDTO;
import com.maven.demo.dto.DeliveryFeeResponseDTO;
import com.maven.demo.entity.*;
import com.maven.demo.repository.AddressRepository;
import com.maven.demo.repository.DeliveryRepository;
import com.maven.demo.repository.ShopAddressRepository;
import com.maven.demo.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeliveryServiceImpl implements DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private AddressRepository addressRepo;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper mapper;
    @Autowired
    private ShopAddressRepository shopAddressRepo;

    @Override
    public List<DeliveryDTO> getAllDeliveries() {
        return deliveryRepository.findAll().stream()
                .map(entity -> {
                    DeliveryDTO dto = mapper.map(entity, DeliveryDTO.class);
                    dto.setAdminId(entity.getAdmin().getId());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryDTO createDelivery(DeliveryDTO dto) {
        DeliveryEntity entity = mapper.map(dto, DeliveryEntity.class);

        if (dto.getAdminId() == null) {
            throw new IllegalArgumentException("Admin ID must not be null");
        }

        UserEntity admin = userRepository.findById(dto.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + dto.getAdminId()));

        entity.setAdmin(admin);

        return mapper.map(deliveryRepository.save(entity), DeliveryDTO.class);
    }

    @Override
    public DeliveryDTO getDeliveryById(Integer id) {
        DeliveryEntity entity = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));

        DeliveryDTO dto = mapper.map(entity, DeliveryDTO.class);
        dto.setAdminId(entity.getAdmin().getId());

        return dto;
    }

    @Override
    public DeliveryDTO updateDelivery(Integer id, DeliveryDTO dto) {
        DeliveryEntity existing = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));

        existing.setName(dto.getName());
        existing.setType(dto.getType());
        existing.setFixAmount(dto.getFixAmount());
        existing.setFeesPer1km(dto.getFeesPer1km());

        if (dto.getMinDelayTime() != null) {
            existing.setMinDelayTime(dto.getMinDelayTime());
        }

        if (dto.getAdminId() != null) {
            UserEntity admin = userRepository.findById(dto.getAdminId())
                    .orElseThrow(() -> new RuntimeException("Admin not found with id: " + dto.getAdminId()));
            existing.setAdmin(admin);
        }

        return mapper.map(deliveryRepository.save(existing), DeliveryDTO.class);
    }

    @Override
    public void deleteDelivery(Integer id) {
        deliveryRepository.deleteById(id);
    }


    @Override
    public DeliveryFeeResponseDTO calculateFee(DeliveryFeeRequestDTO request) {
        // 1. Get user's main address
        AddressEntity address = addressRepo.findByUserIdAndMainAddressTrue(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Main address not found for user"));

        // 2. Get delivery
        DeliveryEntity delivery;
        if (request.getDeliveryId() != null) {
            delivery = deliveryRepository.findById(request.getDeliveryId().intValue())
                    .orElseThrow(() -> new RuntimeException("Delivery not found with ID: " + request.getDeliveryId()));
        } else {
            delivery = deliveryRepository.findByTypeIgnoreCaseAndNameIgnoreCase(
                    request.getMethod(), request.getName()
            ).orElseThrow(() -> new RuntimeException("Delivery not found for method: " + request.getMethod() +
                    " and name: " + request.getName()));
        }

        // 3. Get shop address
        ShopAddressEntity shopAddress = delivery.getShopAddress();
        if (shopAddress == null) {
            throw new RuntimeException("Shop address not associated with delivery");
        }

        if (shopAddress.getLatitude() == null || shopAddress.getLongitude() == null) {
            throw new RuntimeException("Shop location (latitude/longitude) is missing.");
        }

        // 4. Distance Calculation
        double userLat = address.getLatitude();
        double userLng = address.getLongitude();
        double shopLat = shopAddress.getLatitude();
        double shopLng = shopAddress.getLongitude();
        double distance = haversine(userLat, userLng, shopLat, shopLng);

        final double YANGON_STANDARD_KM = 300.0; // Updated value
        final double YANGON_EXPRESS_KM = 1500.0; // Updated value
        String suggestedMethod;
        double fee;
        String time = delivery.getMinDelayTime();

        if (distance <= YANGON_STANDARD_KM) {
            suggestedMethod = "Standard";
            fee = Math.ceil(distance) * (delivery.getFeesPer1km() != null ? delivery.getFeesPer1km() : 0);
        } else if (distance <= YANGON_EXPRESS_KM) {
            suggestedMethod = "Express";
            fee = delivery.getFixAmount() != null ? Double.parseDouble(delivery.getFixAmount()) : 0;
        } else {
            suggestedMethod = "Ship";
            fee = delivery.getFixAmount() != null ? Double.parseDouble(delivery.getFixAmount()) : 0;
        }

        // 6. Response
        DeliveryFeeResponseDTO response = new DeliveryFeeResponseDTO();
        response.setDistance(distance);
        response.setFee(fee);
        response.setEstimatedTime(time);
        response.setSuggestedMethod(suggestedMethod); // ✅ new logic applied

        return response;
    }

    // Haversine formula for distance calculation
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}