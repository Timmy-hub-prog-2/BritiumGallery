package com.maven.demo.controller;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.demo.dto.PendingRefundDTO;
import com.maven.demo.dto.RefundRequestDTO;
import com.maven.demo.entity.RefundRequestEntity;
import com.maven.demo.service.RefundService;

@RestController
@RequestMapping("/api/refunds")
@CrossOrigin(origins = "http://localhost:4200")
public class RefundController {

    @Autowired
    private RefundService refundService;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/submit")
    public ResponseEntity<?> submitRefundRequest(
            @RequestParam("data") String refundDataJson,
            @RequestParam(value = "proof", required = false) MultipartFile proofFile,
            @RequestParam(value = "proofs", required = false) MultipartFile[] itemProofs) {
        try {
            RefundRequestDTO request = objectMapper.readValue(refundDataJson, RefundRequestDTO.class);
            
            // Handle the refund request
            if ("FULL".equals(request.getType())) {
                refundService.createFullOrderRefund(request, proofFile);
            } else {
                refundService.createPartialRefund(request, itemProofs);
            }

            // Return a JSON object for success
            return ResponseEntity.ok().body(java.util.Map.of(
                "success", true,
                "message", "Refund request submitted successfully"
            ));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "message", "Failed to process refund request: " + e.getMessage()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PendingRefundDTO>> getPendingRefundRequests() {
        List<RefundRequestEntity> pendingRefunds = refundService.getPendingRefundRequests();
        List<PendingRefundDTO> dtos = pendingRefunds.stream().map(refund -> {
            PendingRefundDTO dto = new PendingRefundDTO();
            dto.id = refund.getId();
            dto.amount = refund.getAmount();
            dto.reason = refund.getReason();
            dto.requestedAt = refund.getRequestedAt() != null ? refund.getRequestedAt().toString() : null;
            dto.orderId = refund.getOrder() != null ? refund.getOrder().getId() : null;
            dto.customerName = (refund.getOrder() != null && refund.getOrder().getUser() != null) ? refund.getOrder().getUser().getName() : null;
            dto.type = (refund.getRefundQuantity() == null) ? "FULL" : "PARTIAL";
            dto.refundQuantity = refund.getRefundQuantity();
            dto.orderDetailId = refund.getOrderDetail() != null ? refund.getOrderDetail().getId() : null;
            dto.status = refund.getStatus() != null ? refund.getStatus().name() : "REQUESTED";
            dto.proofImageUrl = refund.getProofImageUrl();
            dto.trackingCode = refund.getOrder() != null ? refund.getOrder().getTrackingCode() : null;
            dto.orderStatus = refund.getOrder() != null && refund.getOrder().getStatus() != null ? refund.getOrder().getStatus().name() : null;
            dto.deliveredAt = refund.getOrder() != null ? refund.getOrder().getOrderDate().toString() : null;
            dto.reviewedBy = refund.getReviewedBy();
            dto.adminNote = refund.getAdminNote();
            // Populate refundedItems
            if (dto.type.equals("FULL") && refund.getOrder() != null) {
                dto.refundedItems = refund.getOrder().getOrderDetails().stream().map(od -> {
                    PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                    item.orderDetailId = od.getId();
                    item.productName = od.getVariant() != null && od.getVariant().getProduct() != null ? od.getVariant().getProduct().getName() : null;
                    item.quantity = od.getQuantity();
                    item.price = od.getPrice();
                    if (od.getVariant() != null) {
                        PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                        variant.sku = od.getVariant().getSku();
                        variant.imageUrl = (od.getVariant().getImages() != null && !od.getVariant().getImages().isEmpty()) ? od.getVariant().getImages().get(0).getImageUrl() : null;
                        if (od.getVariant().getAttributeValues() != null) {
                            variant.attributes = od.getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                                av -> av.getAttribute().getName(),
                                av -> av.getValue()
                            ));
                        }
                        item.variant = variant;
                    }
                    return item;
                }).collect(Collectors.toList());
            } else if (dto.type.equals("PARTIAL") && refund.getOrderDetail() != null) {
                PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                item.orderDetailId = refund.getOrderDetail().getId();
                item.productName = refund.getOrderDetail().getVariant() != null && refund.getOrderDetail().getVariant().getProduct() != null ? refund.getOrderDetail().getVariant().getProduct().getName() : null;
                item.quantity = refund.getRefundQuantity();
                item.price = refund.getOrderDetail().getPrice();
                if (refund.getOrderDetail().getVariant() != null) {
                    PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                    variant.sku = refund.getOrderDetail().getVariant().getSku();
                    variant.imageUrl = (refund.getOrderDetail().getVariant().getImages() != null && !refund.getOrderDetail().getVariant().getImages().isEmpty()) ? refund.getOrderDetail().getVariant().getImages().get(0).getImageUrl() : null;
                    if (refund.getOrderDetail().getVariant().getAttributeValues() != null) {
                        variant.attributes = refund.getOrderDetail().getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                            av -> av.getAttribute().getName(),
                            av -> av.getValue()
                        ));
                    }
                    item.variant = variant;
                }
                dto.refundedItems = java.util.Collections.singletonList(item);
            }
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PendingRefundDTO> getRefundById(@PathVariable Long id) {
        RefundRequestEntity refund = refundService.getRefundById(id);
        if (refund == null) {
            return ResponseEntity.notFound().build();
        }
        PendingRefundDTO dto = new PendingRefundDTO();
        dto.id = refund.getId();
        dto.amount = refund.getAmount();
        dto.reason = refund.getReason();
        dto.requestedAt = refund.getRequestedAt() != null ? refund.getRequestedAt().toString() : null;
        dto.orderId = refund.getOrder() != null ? refund.getOrder().getId() : null;
        dto.customerName = (refund.getOrder() != null && refund.getOrder().getUser() != null) ? refund.getOrder().getUser().getName() : null;
        dto.type = (refund.getRefundQuantity() == null) ? "FULL" : "PARTIAL";
        dto.refundQuantity = refund.getRefundQuantity();
        dto.orderDetailId = refund.getOrderDetail() != null ? refund.getOrderDetail().getId() : null;
        dto.status = refund.getStatus() != null ? refund.getStatus().name() : "REQUESTED";
        dto.proofImageUrl = refund.getProofImageUrl();
        dto.trackingCode = refund.getOrder() != null ? refund.getOrder().getTrackingCode() : null;
        dto.orderStatus = refund.getOrder() != null && refund.getOrder().getStatus() != null ? refund.getOrder().getStatus().name() : null;
        dto.deliveredAt = refund.getOrder() != null ? refund.getOrder().getOrderDate().toString() : null;
        dto.reviewedBy = refund.getReviewedBy();
        dto.adminNote = refund.getAdminNote();
        // Populate refundedItems
        if (dto.type.equals("FULL") && refund.getOrder() != null) {
            dto.refundedItems = refund.getOrder().getOrderDetails().stream().map(od -> {
                PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                item.orderDetailId = od.getId();
                item.productName = od.getVariant() != null && od.getVariant().getProduct() != null ? od.getVariant().getProduct().getName() : null;
                item.quantity = od.getQuantity();
                item.price = od.getPrice();
                if (od.getVariant() != null) {
                    PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                    variant.sku = od.getVariant().getSku();
                    variant.imageUrl = (od.getVariant().getImages() != null && !od.getVariant().getImages().isEmpty()) ? od.getVariant().getImages().get(0).getImageUrl() : null;
                    if (od.getVariant().getAttributeValues() != null) {
                        variant.attributes = od.getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                            av -> av.getAttribute().getName(),
                            av -> av.getValue()
                        ));
                    }
                    item.variant = variant;
                }
                return item;
            }).collect(Collectors.toList());
        } else if (dto.type.equals("PARTIAL") && refund.getOrderDetail() != null) {
            PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
            item.orderDetailId = refund.getOrderDetail().getId();
            item.productName = refund.getOrderDetail().getVariant() != null && refund.getOrderDetail().getVariant().getProduct() != null ? refund.getOrderDetail().getVariant().getProduct().getName() : null;
            item.quantity = refund.getRefundQuantity();
            item.price = refund.getOrderDetail().getPrice();
            if (refund.getOrderDetail().getVariant() != null) {
                PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                variant.sku = refund.getOrderDetail().getVariant().getSku();
                variant.imageUrl = (refund.getOrderDetail().getVariant().getImages() != null && !refund.getOrderDetail().getVariant().getImages().isEmpty()) ? refund.getOrderDetail().getVariant().getImages().get(0).getImageUrl() : null;
                if (refund.getOrderDetail().getVariant().getAttributeValues() != null) {
                    variant.attributes = refund.getOrderDetail().getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                        av -> av.getAttribute().getName(),
                        av -> av.getValue()
                    ));
                }
                item.variant = variant;
            }
            dto.refundedItems = java.util.Collections.singletonList(item);
        }
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PendingRefundDTO>> getRefundsByOrderId(@PathVariable Long orderId) {
        List<RefundRequestEntity> refunds = refundService.getRefundsByOrderId(orderId);
        List<PendingRefundDTO> dtos = refunds.stream().map(refund -> {
            PendingRefundDTO dto = new PendingRefundDTO();
            dto.id = refund.getId();
            dto.amount = refund.getAmount();
            dto.reason = refund.getReason();
            dto.requestedAt = refund.getRequestedAt() != null ? refund.getRequestedAt().toString() : null;
            dto.orderId = refund.getOrder() != null ? refund.getOrder().getId() : null;
            dto.customerName = (refund.getOrder() != null && refund.getOrder().getUser() != null) ? refund.getOrder().getUser().getName() : null;
            dto.type = (refund.getRefundQuantity() == null) ? "FULL" : "PARTIAL";
            dto.refundQuantity = refund.getRefundQuantity();
            dto.orderDetailId = refund.getOrderDetail() != null ? refund.getOrderDetail().getId() : null;
            dto.status = refund.getStatus() != null ? refund.getStatus().name() : "REQUESTED";
            dto.proofImageUrl = refund.getProofImageUrl();
            dto.trackingCode = refund.getOrder() != null ? refund.getOrder().getTrackingCode() : null;
            dto.orderStatus = refund.getOrder() != null && refund.getOrder().getStatus() != null ? refund.getOrder().getStatus().name() : null;
            dto.deliveredAt = refund.getOrder() != null ? refund.getOrder().getOrderDate().toString() : null;
            dto.reviewedBy = refund.getReviewedBy();
            dto.adminNote = refund.getAdminNote();
            dto.processedAt = refund.getProcessedAt() != null ? refund.getProcessedAt().toString() : null;
            // Populate refundedItems
            if (dto.type.equals("FULL") && refund.getOrder() != null) {
                dto.refundedItems = refund.getOrder().getOrderDetails().stream().map(od -> {
                    PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                    item.orderDetailId = od.getId();
                    item.productName = od.getVariant() != null && od.getVariant().getProduct() != null ? od.getVariant().getProduct().getName() : null;
                    item.quantity = od.getQuantity();
                    item.price = od.getPrice();
                    if (od.getVariant() != null) {
                        PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                        variant.sku = od.getVariant().getSku();
                        variant.imageUrl = (od.getVariant().getImages() != null && !od.getVariant().getImages().isEmpty()) ? od.getVariant().getImages().get(0).getImageUrl() : null;
                        if (od.getVariant().getAttributeValues() != null) {
                            variant.attributes = od.getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                                av -> av.getAttribute().getName(),
                                av -> av.getValue()
                            ));
                        }
                        item.variant = variant;
                    }
                    return item;
                }).collect(Collectors.toList());
            } else if (dto.type.equals("PARTIAL") && refund.getOrderDetail() != null) {
                PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                item.orderDetailId = refund.getOrderDetail().getId();
                item.productName = refund.getOrderDetail().getVariant() != null && refund.getOrderDetail().getVariant().getProduct() != null ? refund.getOrderDetail().getVariant().getProduct().getName() : null;
                item.quantity = refund.getRefundQuantity();
                item.price = refund.getOrderDetail().getPrice();
                if (refund.getOrderDetail().getVariant() != null) {
                    PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                    variant.sku = refund.getOrderDetail().getVariant().getSku();
                    variant.imageUrl = (refund.getOrderDetail().getVariant().getImages() != null && !refund.getOrderDetail().getVariant().getImages().isEmpty()) ? refund.getOrderDetail().getVariant().getImages().get(0).getImageUrl() : null;
                    if (refund.getOrderDetail().getVariant().getAttributeValues() != null) {
                        variant.attributes = refund.getOrderDetail().getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                            av -> av.getAttribute().getName(),
                            av -> av.getValue()
                        ));
                    }
                    item.variant = variant;
                }
                dto.refundedItems = java.util.Collections.singletonList(item);
            }
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PendingRefundDTO>> getRefundsByUser(@PathVariable Long userId) {
        List<RefundRequestEntity> refunds = refundService.getRefundsByUserId(userId);
        List<PendingRefundDTO> dtos = refunds.stream().map(refund -> {
            PendingRefundDTO dto = new PendingRefundDTO();
            dto.id = refund.getId();
            dto.amount = refund.getAmount();
            dto.reason = refund.getReason();
            dto.requestedAt = refund.getRequestedAt() != null ? refund.getRequestedAt().toString() : null;
            dto.orderId = refund.getOrder() != null ? refund.getOrder().getId() : null;
            dto.customerName = (refund.getOrder() != null && refund.getOrder().getUser() != null) ? refund.getOrder().getUser().getName() : null;
            dto.type = (refund.getRefundQuantity() == null) ? "FULL" : "PARTIAL";
            dto.refundQuantity = refund.getRefundQuantity();
            dto.orderDetailId = refund.getOrderDetail() != null ? refund.getOrderDetail().getId() : null;
            dto.status = refund.getStatus() != null ? refund.getStatus().name() : "REQUESTED";
            dto.proofImageUrl = refund.getProofImageUrl();
            dto.trackingCode = refund.getOrder() != null ? refund.getOrder().getTrackingCode() : null;
            dto.orderStatus = refund.getOrder() != null && refund.getOrder().getStatus() != null ? refund.getOrder().getStatus().name() : null;
            dto.deliveredAt = refund.getOrder() != null ? refund.getOrder().getOrderDate().toString() : null;
            dto.reviewedBy = refund.getReviewedBy();
            dto.adminNote = refund.getAdminNote();
            // Populate refundedItems
            if (dto.type.equals("FULL") && refund.getOrder() != null) {
                dto.refundedItems = refund.getOrder().getOrderDetails().stream().map(od -> {
                    PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                    item.orderDetailId = od.getId();
                    item.productName = od.getVariant() != null && od.getVariant().getProduct() != null ? od.getVariant().getProduct().getName() : null;
                    item.quantity = od.getQuantity();
                    item.price = od.getPrice();
                    if (od.getVariant() != null) {
                        PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                        variant.sku = od.getVariant().getSku();
                        variant.imageUrl = (od.getVariant().getImages() != null && !od.getVariant().getImages().isEmpty()) ? od.getVariant().getImages().get(0).getImageUrl() : null;
                        if (od.getVariant().getAttributeValues() != null) {
                            variant.attributes = od.getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                                av -> av.getAttribute().getName(),
                                av -> av.getValue()
                            ));
                        }
                        item.variant = variant;
                    }
                    return item;
                }).collect(Collectors.toList());
            } else if (dto.type.equals("PARTIAL") && refund.getOrderDetail() != null) {
                PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                item.orderDetailId = refund.getOrderDetail().getId();
                item.productName = refund.getOrderDetail().getVariant() != null && refund.getOrderDetail().getVariant().getProduct() != null ? refund.getOrderDetail().getVariant().getProduct().getName() : null;
                item.quantity = refund.getRefundQuantity();
                item.price = refund.getOrderDetail().getPrice();
                if (refund.getOrderDetail().getVariant() != null) {
                    PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                    variant.sku = refund.getOrderDetail().getVariant().getSku();
                    variant.imageUrl = (refund.getOrderDetail().getVariant().getImages() != null && !refund.getOrderDetail().getVariant().getImages().isEmpty()) ? refund.getOrderDetail().getVariant().getImages().get(0).getImageUrl() : null;
                    if (refund.getOrderDetail().getVariant().getAttributeValues() != null) {
                        variant.attributes = refund.getOrderDetail().getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                            av -> av.getAttribute().getName(),
                            av -> av.getValue()
                        ));
                    }
                    item.variant = variant;
                }
                dto.refundedItems = java.util.Collections.singletonList(item);
            }
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping
    public ResponseEntity<List<PendingRefundDTO>> getAllRefunds() {
        List<RefundRequestEntity> refunds = refundService.getAllRefunds();
        List<PendingRefundDTO> dtos = refunds.stream().map(refund -> {
            PendingRefundDTO dto = new PendingRefundDTO();
            dto.id = refund.getId();
            dto.amount = refund.getAmount();
            dto.reason = refund.getReason();
            dto.requestedAt = refund.getRequestedAt() != null ? refund.getRequestedAt().toString() : null;
            dto.orderId = refund.getOrder() != null ? refund.getOrder().getId() : null;
            dto.customerName = (refund.getOrder() != null && refund.getOrder().getUser() != null) ? refund.getOrder().getUser().getName() : null;
            dto.type = (refund.getRefundQuantity() == null) ? "FULL" : "PARTIAL";
            dto.refundQuantity = refund.getRefundQuantity();
            dto.orderDetailId = refund.getOrderDetail() != null ? refund.getOrderDetail().getId() : null;
            dto.status = refund.getStatus() != null ? refund.getStatus().name() : "REQUESTED";
            dto.proofImageUrl = refund.getProofImageUrl();
            dto.trackingCode = refund.getOrder() != null ? refund.getOrder().getTrackingCode() : null;
            dto.orderStatus = refund.getOrder() != null && refund.getOrder().getStatus() != null ? refund.getOrder().getStatus().name() : null;
            dto.deliveredAt = refund.getOrder() != null ? refund.getOrder().getOrderDate().toString() : null;
            dto.reviewedBy = refund.getReviewedBy();
            dto.adminNote = refund.getAdminNote();
            // Populate refundedItems
            if (dto.type.equals("FULL") && refund.getOrder() != null) {
                dto.refundedItems = refund.getOrder().getOrderDetails().stream().map(od -> {
                    PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                    item.orderDetailId = od.getId();
                    item.productName = od.getVariant() != null && od.getVariant().getProduct() != null ? od.getVariant().getProduct().getName() : null;
                    item.quantity = od.getQuantity();
                    item.price = od.getPrice();
                    if (od.getVariant() != null) {
                        PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                        variant.sku = od.getVariant().getSku();
                        variant.imageUrl = (od.getVariant().getImages() != null && !od.getVariant().getImages().isEmpty()) ? od.getVariant().getImages().get(0).getImageUrl() : null;
                        if (od.getVariant().getAttributeValues() != null) {
                            variant.attributes = od.getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                                av -> av.getAttribute().getName(),
                                av -> av.getValue()
                            ));
                        }
                        item.variant = variant;
                    }
                    return item;
                }).collect(Collectors.toList());
            } else if (dto.type.equals("PARTIAL") && refund.getOrderDetail() != null) {
                PendingRefundDTO.RefundedItemDTO item = new PendingRefundDTO.RefundedItemDTO();
                item.orderDetailId = refund.getOrderDetail().getId();
                item.productName = refund.getOrderDetail().getVariant() != null && refund.getOrderDetail().getVariant().getProduct() != null ? refund.getOrderDetail().getVariant().getProduct().getName() : null;
                item.quantity = refund.getRefundQuantity();
                item.price = refund.getOrderDetail().getPrice();
                if (refund.getOrderDetail().getVariant() != null) {
                    PendingRefundDTO.VariantDTO variant = new PendingRefundDTO.VariantDTO();
                    variant.sku = refund.getOrderDetail().getVariant().getSku();
                    variant.imageUrl = (refund.getOrderDetail().getVariant().getImages() != null && !refund.getOrderDetail().getVariant().getImages().isEmpty()) ? refund.getOrderDetail().getVariant().getImages().get(0).getImageUrl() : null;
                    if (refund.getOrderDetail().getVariant().getAttributeValues() != null) {
                        variant.attributes = refund.getOrderDetail().getVariant().getAttributeValues().stream().collect(java.util.stream.Collectors.toMap(
                            av -> av.getAttribute().getName(),
                            av -> av.getValue()
                        ));
                    }
                    item.variant = variant;
                }
                dto.refundedItems = java.util.Collections.singletonList(item);
            }
            return dto;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/accept/{id}")
    public ResponseEntity<?> acceptRefund(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        try {
            Integer reviewedBy = body.get("reviewedBy") != null ? Integer.parseInt(body.get("reviewedBy").toString()) : null;
            refundService.acceptRefund(id, reviewedBy);
            return ResponseEntity.ok().body(java.util.Map.of("success", true, "message", "Refund accepted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/reject/{id}")
    public ResponseEntity<?> rejectRefund(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        try {
            Integer reviewedBy = body.get("reviewedBy") != null ? Integer.parseInt(body.get("reviewedBy").toString()) : null;
            String reason = body.get("reason") != null ? body.get("reason").toString() : null;
            refundService.rejectRefund(id, reviewedBy, reason);
            return ResponseEntity.ok().body(java.util.Map.of("success", true, "message", "Refund rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }
} 