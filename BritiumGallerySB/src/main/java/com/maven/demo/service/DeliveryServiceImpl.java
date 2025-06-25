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

    // DeliveryServiceImpl.java (updated calculateFee method)
    @Override
    public DeliveryFeeResponseDTO calculateFee(DeliveryFeeRequestDTO request) {
        AddressEntity address = addressRepo.findByUserIdAndMainAddressTrue(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Main address not found for user"));

        DeliveryEntity anyDelivery;
        if (request.getDeliveryId() != null) {
            anyDelivery = deliveryRepository.findById(request.getDeliveryId().intValue())
                    .orElseThrow(() -> new RuntimeException("Delivery not found with ID: " + request.getDeliveryId()));
        } else {
            anyDelivery = deliveryRepository.findByTypeIgnoreCaseAndNameIgnoreCase(
                    request.getMethod(), request.getName()
            ).orElseThrow(() -> new RuntimeException("Delivery not found for method: " + request.getMethod() +
                    " and name: " + request.getName()));
        }

        ShopAddressEntity shopAddress = anyDelivery.getShopAddress();
        if (shopAddress == null) {
            throw new RuntimeException("Shop address not associated with delivery");
        }
        if (shopAddress.getLatitude() == null || shopAddress.getLongitude() == null) {
            throw new RuntimeException("Shop location (latitude/longitude) is missing.");
        }

        double userLat = address.getLatitude();
        double userLng = address.getLongitude();
        double shopLat = shopAddress.getLatitude();
        double shopLng = shopAddress.getLongitude();
        double distance = haversine(userLat, userLng, shopLat, shopLng);

        String userCity = address.getCity().trim().toLowerCase();
        String userCountry = address.getCountry().trim().toLowerCase();
        String shopCity = shopAddress.getCity().trim().toLowerCase();
        String shopCountry = shopAddress.getCountry().trim().toLowerCase();

        String suggestedMethod;
        if (userCity.equals(shopCity)) {
            suggestedMethod = "STANDARD";
        } else if (userCountry.equals(shopCountry)) {
            suggestedMethod = "EXPRESS";
        } else {
            suggestedMethod = "SHIP";
        }

        // Fetch the correct delivery entity for the suggested method
        DeliveryEntity delivery = (DeliveryEntity) deliveryRepository.findByTypeIgnoreCaseAndShopAddressId(
                suggestedMethod, shopAddress.getId()
        ).orElseThrow(() -> new RuntimeException("Delivery not found for method: " + suggestedMethod +
                " and shop address id: " + shopAddress.getId()));

        double fee;
        if ("STANDARD".equalsIgnoreCase(suggestedMethod)) {
            fee = Math.ceil(distance) * (delivery.getFeesPer1km() != null ? delivery.getFeesPer1km() : 0);
        } else {
            fee = delivery.getFixAmount() != null ? Double.parseDouble(delivery.getFixAmount()) : 0;
        }
        String time = delivery.getMinDelayTime();

        DeliveryFeeResponseDTO response = new DeliveryFeeResponseDTO();
        response.setDistance(distance);
        response.setFee(fee);
        response.setEstimatedTime(time);
        response.setSuggestedMethod(suggestedMethod);

        return response;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

}