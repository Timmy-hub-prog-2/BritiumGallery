package com.maven.demo.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.demo.dto.DeliveryDTO;
import com.maven.demo.dto.DeliveryFeeRequestDTO;
import com.maven.demo.dto.DeliveryFeeResponseDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.DeliveryEntity;
import com.maven.demo.entity.ShopAddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.AddressRepository;
import com.maven.demo.repository.DeliveryRepository;
import com.maven.demo.repository.ShopAddressRepository;
import com.maven.demo.repository.UserRepository;

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
                    DeliveryDTO dto = new DeliveryDTO();
                    dto.setId(entity.getId());
                    dto.setDeliveryType(entity.getDeliveryType());
                    dto.setSpeedType(entity.getSpeedType());
                    dto.setBaseDelayDays(entity.getBaseDelayDays());
                    dto.setBaseDelayHours(entity.getBaseDelayHours());
                    dto.setSpeedKmHr(entity.getSpeedKmHr());
                    dto.setFeePerKm(entity.getFeePerKm());
                    dto.setBaseFee(entity.getBaseFee());
                    dto.setMaxFee(entity.getMaxFee());
                    dto.setType(entity.getType());
                    dto.setName(entity.getName());
                    dto.setAdminId(entity.getAdmin().getId());
                    dto.setFeesPer1km(entity.getFeesPer1km());
                    dto.setFixAmount(entity.getFixAmount());
                    dto.setMinDelayTime(entity.getMinDelayTime());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryDTO createDelivery(DeliveryDTO dto) {
        DeliveryEntity entity = new DeliveryEntity();

        // Set admin
        if (dto.getAdminId() == null) {
            throw new IllegalArgumentException("Admin ID must not be null");
        }
        UserEntity admin = userRepository.findById(dto.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + dto.getAdminId()));
        entity.setAdmin(admin);

        // Map all new fields manually
        if (dto.getDeliveryType() != null) {
            entity.setDeliveryType(dto.getDeliveryType());
        }
        if (dto.getSpeedType() != null) {
            entity.setSpeedType(dto.getSpeedType());
        }
        if (dto.getBaseDelayDays() != null) {
            entity.setBaseDelayDays(dto.getBaseDelayDays());
        }
        if (dto.getBaseDelayHours() != null) {
            entity.setBaseDelayHours(dto.getBaseDelayHours());
        }
        if (dto.getSpeedKmHr() != null) {
            entity.setSpeedKmHr(dto.getSpeedKmHr());
        }
        if (dto.getFeePerKm() != null) {
            entity.setFeePerKm(dto.getFeePerKm());
        }
        if (dto.getBaseFee() != null) {
            entity.setBaseFee(dto.getBaseFee());
        }
        if (dto.getMaxFee() != null) {
            entity.setMaxFee(dto.getMaxFee());
        }

        // Set legacy fields for backward compatibility
        if (dto.getDeliveryType() != null) {
            entity.setType(dto.getDeliveryType());
        }
        if (dto.getSpeedType() != null) {
            entity.setName(dto.getSpeedType());
        }
        if (dto.getFeePerKm() != null) {
            entity.setFeesPer1km(dto.getFeePerKm());
        }
        if (dto.getBaseFee() != null) {
            entity.setFixAmount(dto.getBaseFee().toString());
        }

        DeliveryEntity savedEntity = deliveryRepository.save(entity);
        
        // Map back to DTO manually
        DeliveryDTO resultDto = new DeliveryDTO();
        resultDto.setId(savedEntity.getId());
        resultDto.setDeliveryType(savedEntity.getDeliveryType());
        resultDto.setSpeedType(savedEntity.getSpeedType());
        resultDto.setBaseDelayDays(savedEntity.getBaseDelayDays());
        resultDto.setBaseDelayHours(savedEntity.getBaseDelayHours());
        resultDto.setSpeedKmHr(savedEntity.getSpeedKmHr());
        resultDto.setFeePerKm(savedEntity.getFeePerKm());
        resultDto.setBaseFee(savedEntity.getBaseFee());
        resultDto.setMaxFee(savedEntity.getMaxFee());
        resultDto.setType(savedEntity.getType());
        resultDto.setName(savedEntity.getName());
        resultDto.setAdminId(savedEntity.getAdmin().getId());
        resultDto.setFeesPer1km(savedEntity.getFeesPer1km());
        resultDto.setFixAmount(savedEntity.getFixAmount());
        resultDto.setMinDelayTime(savedEntity.getMinDelayTime());
        
        return resultDto;
    }

    @Override
    public DeliveryDTO getDeliveryById(Integer id) {
        DeliveryEntity entity = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));

        DeliveryDTO dto = new DeliveryDTO();
        dto.setId(entity.getId());
        dto.setDeliveryType(entity.getDeliveryType());
        dto.setSpeedType(entity.getSpeedType());
        dto.setBaseDelayDays(entity.getBaseDelayDays());
        dto.setBaseDelayHours(entity.getBaseDelayHours());
        dto.setSpeedKmHr(entity.getSpeedKmHr());
        dto.setFeePerKm(entity.getFeePerKm());
        dto.setBaseFee(entity.getBaseFee());
        dto.setMaxFee(entity.getMaxFee());
        dto.setType(entity.getType());
        dto.setName(entity.getName());
        dto.setAdminId(entity.getAdmin().getId());
        dto.setFeesPer1km(entity.getFeesPer1km());
        dto.setFixAmount(entity.getFixAmount());
        dto.setMinDelayTime(entity.getMinDelayTime());

        return dto;
    }

    @Override
    public DeliveryDTO updateDelivery(Integer id, DeliveryDTO dto) {
        DeliveryEntity existing = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));

        // Update new fields
        if (dto.getDeliveryType() != null) {
            existing.setDeliveryType(dto.getDeliveryType());
            existing.setType(dto.getDeliveryType()); // Legacy compatibility
        }
        if (dto.getSpeedType() != null) {
            existing.setSpeedType(dto.getSpeedType());
            existing.setName(dto.getSpeedType()); // Legacy compatibility
        }
        if (dto.getBaseDelayDays() != null) {
            existing.setBaseDelayDays(dto.getBaseDelayDays());
        }
        if (dto.getBaseDelayHours() != null) {
            existing.setBaseDelayHours(dto.getBaseDelayHours());
        }
        if (dto.getSpeedKmHr() != null) {
            existing.setSpeedKmHr(dto.getSpeedKmHr());
        }
        if (dto.getFeePerKm() != null) {
            existing.setFeePerKm(dto.getFeePerKm());
            existing.setFeesPer1km(dto.getFeePerKm()); // Legacy compatibility
        }
        if (dto.getBaseFee() != null) {
            existing.setBaseFee(dto.getBaseFee());
        }
        if (dto.getMaxFee() != null) {
            existing.setMaxFee(dto.getMaxFee());
        }

        // Update legacy fields
        if (dto.getFixAmount() != null) {
            existing.setFixAmount(dto.getFixAmount());
        }
        if (dto.getMinDelayTime() != null) {
            existing.setMinDelayTime(dto.getMinDelayTime());
        }

        if (dto.getAdminId() != null) {
            UserEntity admin = userRepository.findById(dto.getAdminId())
                    .orElseThrow(() -> new RuntimeException("Admin not found with id: " + dto.getAdminId()));
            existing.setAdmin(admin);
        }

        DeliveryEntity savedEntity = deliveryRepository.save(existing);
        
        // Map back to DTO manually
        DeliveryDTO resultDto = new DeliveryDTO();
        resultDto.setId(savedEntity.getId());
        resultDto.setDeliveryType(savedEntity.getDeliveryType());
        resultDto.setSpeedType(savedEntity.getSpeedType());
        resultDto.setBaseDelayDays(savedEntity.getBaseDelayDays());
        resultDto.setBaseDelayHours(savedEntity.getBaseDelayHours());
        resultDto.setSpeedKmHr(savedEntity.getSpeedKmHr());
        resultDto.setFeePerKm(savedEntity.getFeePerKm());
        resultDto.setBaseFee(savedEntity.getBaseFee());
        resultDto.setMaxFee(savedEntity.getMaxFee());
        resultDto.setType(savedEntity.getType());
        resultDto.setName(savedEntity.getName());
        resultDto.setAdminId(savedEntity.getAdmin().getId());
        resultDto.setFeesPer1km(savedEntity.getFeesPer1km());
        resultDto.setFixAmount(savedEntity.getFixAmount());
        resultDto.setMinDelayTime(savedEntity.getMinDelayTime());
        
        return resultDto;
    }

    @Override
    public void deleteDelivery(Integer id) {
        deliveryRepository.deleteById(id);
    }

    @Override
    public DeliveryFeeResponseDTO calculateFee(DeliveryFeeRequestDTO request) {
        // Get user's main address
        AddressEntity userAddress = addressRepo.findByUserIdAndMainAddressTrue(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Main address not found for user"));

        // Get main shop address (not from delivery entity anymore)
        ShopAddressEntity shopAddress = shopAddressRepo.findByMainAddressTrue()
                .orElseThrow(() -> new RuntimeException("Main shop address not found"));

        // Validate coordinates
        if (shopAddress.getLatitude() == null || shopAddress.getLongitude() == null) {
            throw new RuntimeException("Shop location (latitude/longitude) is missing.");
        }
        if (userAddress.getLatitude() == null || userAddress.getLongitude() == null) {
            throw new RuntimeException("User location (latitude/longitude) is missing.");
        }

        // Calculate distance
        double distance = haversine(
            userAddress.getLatitude(), userAddress.getLongitude(),
            shopAddress.getLatitude(), shopAddress.getLongitude()
        );

        // Determine suggested delivery type based on distance and location
        String suggestedDeliveryType = determineSuggestedDeliveryType(userAddress, shopAddress, distance);

        // Get delivery options for the suggested type
        List<DeliveryEntity> deliveryOptions = deliveryRepository.findByDeliveryTypeIgnoreCase(suggestedDeliveryType);
        if (deliveryOptions.isEmpty()) {
            throw new RuntimeException("No delivery options found for type: " + suggestedDeliveryType);
        }

        // For now, use the first option (normal speed)
        DeliveryEntity selectedDelivery = deliveryOptions.stream()
                .filter(d -> "normal".equalsIgnoreCase(d.getSpeedType()))
                .findFirst()
                .orElse(deliveryOptions.get(0));

        // Calculate fee based on new structure
        double calculatedFee = calculateDeliveryFee(selectedDelivery, distance);
        
        // Calculate estimated delivery time
        String estimatedTime = calculateEstimatedDeliveryTime(selectedDelivery, distance);

        DeliveryFeeResponseDTO response = new DeliveryFeeResponseDTO();
        response.setDistance(distance);
        response.setFee(calculatedFee);
        response.setEstimatedTime(estimatedTime);
        response.setSuggestedMethod(suggestedDeliveryType);

        return response;
    }

    /**
     * Determine suggested delivery type based on distance and location
     */
    private String determineSuggestedDeliveryType(AddressEntity userAddress, ShopAddressEntity shopAddress, double distance) {
        String userCity = userAddress.getCity() != null ? userAddress.getCity().trim().toLowerCase() : "";
        String userCountry = userAddress.getCountry() != null ? userAddress.getCountry().trim().toLowerCase() : "";
        String shopCity = shopAddress.getCity() != null ? shopAddress.getCity().trim().toLowerCase() : "";
        String shopCountry = shopAddress.getCountry() != null ? shopAddress.getCountry().trim().toLowerCase() : "";

        if (userCity.equals(shopCity) && !userCity.isEmpty()) {
            return "standard";
        } else if (userCountry.equals(shopCountry) && !userCountry.isEmpty()) {
            return "express";
        } else {
            return "ship";
        }
    }

    /**
     * Calculate delivery fee based on new structure
     * Matches frontend logic: Math.max(deliveryFee, baseFee)
     */
    private double calculateDeliveryFee(DeliveryEntity delivery, double distance) {
        double baseFee = delivery.getBaseFee() != null ? delivery.getBaseFee() : 0.0;
        double feePerKm = delivery.getFeePerKm() != null ? delivery.getFeePerKm() : 0.0;
        double maxFee = delivery.getMaxFee() != null ? delivery.getMaxFee() : 0.0;

        // Calculate delivery fee based on distance
        double deliveryFee = distance * feePerKm;
        
        // Apply base fee logic: if delivery fee is less than base fee, use base fee
        double fee = Math.max(deliveryFee, baseFee);
        
        // Apply max fee cap if set
        if (maxFee > 0 && fee > maxFee) {
            fee = maxFee;
        }
        
        return Math.round(fee);
    }

    /**
     * Calculate estimated delivery time
     * Matches frontend logic for different delivery types
     */
    private String calculateEstimatedDeliveryTime(DeliveryEntity delivery, double distance) {
        double baseDelayHours = delivery.getBaseDelayHours() != null ? delivery.getBaseDelayHours() : 0.0;
        double baseDelayDays = delivery.getBaseDelayDays() != null ? delivery.getBaseDelayDays() : 0.0;
        double speedKmHr = delivery.getSpeedKmHr() != null ? delivery.getSpeedKmHr() : 30.0;
        
        double totalHours = 0.0;
        
        // For standard delivery: use baseDelayHours
        if ("standard".equalsIgnoreCase(delivery.getDeliveryType())) {
            totalHours = baseDelayHours + (distance / speedKmHr);
        } else {
            // For express and ship: use baseDelayDays
            totalHours = (baseDelayDays * 24) + (distance / speedKmHr);
        }
        
        // Convert to days and hours
        int days = (int) Math.floor(totalHours / 24);
        int hours = (int) Math.round(totalHours % 24);
        
        if (days > 0) {
            String result = days + " day" + (days > 1 ? "s" : "");
            if (hours > 0) {
                result += " " + hours + " hour" + (hours > 1 ? "s" : "");
            }
            return result.trim();
        } else {
            return hours + " hour" + (hours > 1 ? "s" : "");
        }
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    public List<DeliveryDTO> getDeliveriesByType(String deliveryType) {
        return deliveryRepository.findByDeliveryTypeIgnoreCase(deliveryType).stream()
                .map(entity -> {
                    DeliveryDTO dto = new DeliveryDTO();
                    dto.setId(entity.getId());
                    dto.setDeliveryType(entity.getDeliveryType());
                    dto.setSpeedType(entity.getSpeedType());
                    dto.setBaseDelayDays(entity.getBaseDelayDays());
                    dto.setBaseDelayHours(entity.getBaseDelayHours());
                    dto.setSpeedKmHr(entity.getSpeedKmHr());
                    dto.setFeePerKm(entity.getFeePerKm());
                    dto.setBaseFee(entity.getBaseFee());
                    dto.setMaxFee(entity.getMaxFee());
                    dto.setType(entity.getType());
                    dto.setName(entity.getName());
                    dto.setAdminId(entity.getAdmin().getId());
                    dto.setFeesPer1km(entity.getFeesPer1km());
                    dto.setFixAmount(entity.getFixAmount());
                    dto.setMinDelayTime(entity.getMinDelayTime());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public DeliveryDTO getDeliveryByTypeAndSpeed(String deliveryType, String speedType) {
        List<DeliveryEntity> deliveries = deliveryRepository.findByDeliveryTypeIgnoreCaseAndSpeedTypeIgnoreCase(deliveryType, speedType);
        if (deliveries.isEmpty()) {
            throw new RuntimeException("Delivery not found for type: " + deliveryType + " and speed: " + speedType);
        }
        
        DeliveryEntity entity = deliveries.get(0);
        DeliveryDTO dto = new DeliveryDTO();
        dto.setId(entity.getId());
        dto.setDeliveryType(entity.getDeliveryType());
        dto.setSpeedType(entity.getSpeedType());
        dto.setBaseDelayDays(entity.getBaseDelayDays());
        dto.setBaseDelayHours(entity.getBaseDelayHours());
        dto.setSpeedKmHr(entity.getSpeedKmHr());
        dto.setFeePerKm(entity.getFeePerKm());
        dto.setBaseFee(entity.getBaseFee());
        dto.setMaxFee(entity.getMaxFee());
        dto.setType(entity.getType());
        dto.setName(entity.getName());
        dto.setAdminId(entity.getAdmin().getId());
        dto.setFeesPer1km(entity.getFeesPer1km());
        dto.setFixAmount(entity.getFixAmount());
        dto.setMinDelayTime(entity.getMinDelayTime());
        return dto;
    }
}