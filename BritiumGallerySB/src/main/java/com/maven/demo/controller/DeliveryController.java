package com.maven.demo.controller;

import com.maven.demo.dto.DeliveryDTO;
import com.maven.demo.dto.DeliveryFeeRequestDTO;
import com.maven.demo.dto.DeliveryFeeResponseDTO;
import com.maven.demo.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@CrossOrigin(origins = "http://localhost:4200")
public class DeliveryController {

    @Autowired
    private DeliveryService deliveryService;

    @GetMapping
    public List<DeliveryDTO> getAll() {
        return deliveryService.getAllDeliveries();
    }

    @PostMapping
    public ResponseEntity<DeliveryDTO> create(@RequestBody DeliveryDTO dto) {
        return new ResponseEntity<>(deliveryService.createDelivery(dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(deliveryService.getDeliveryById(id));
    }
    @PutMapping("/{id}")
    public ResponseEntity<DeliveryDTO> update(@PathVariable Integer id, @RequestBody DeliveryDTO dto) {
        return ResponseEntity.ok(deliveryService.updateDelivery(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }

@GetMapping("/delivery-types") // ✅ Correct endpoint under /api/deliveries
public List<DeliveryDTO> getAllDeliveryTypes() {
    return deliveryService.getAllDeliveries();
}

    @PostMapping("/calculate-fee")
    public ResponseEntity<DeliveryFeeResponseDTO> calculate(@RequestBody DeliveryFeeRequestDTO dto) {
        DeliveryFeeResponseDTO response = deliveryService.calculateFee(dto);
        return ResponseEntity.ok(response);
    }
}
