package com.maven.demo.controller;

import com.maven.demo.entity.PaymentEntity;
import com.maven.demo.service.CloudinaryUploadService;
import com.maven.demo.service.PaymentService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.http.MediaType;

@RestController
@RequestMapping("/payment-register")
@CrossOrigin(origins = "http://localhost:4200")
public class PaymentController {

    @Autowired
    private PaymentService service;
    
    @Autowired
    private CloudinaryUploadService cloudinaryUploadService;

    @GetMapping
    public ResponseEntity<List<PaymentEntity>> getAll() {
        List<PaymentEntity> allPayments = service.getAll();
        return ResponseEntity.ok(allPayments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentEntity> getById(@PathVariable Long id) {
        PaymentEntity register = service.getById(id);
        return register != null ? ResponseEntity.ok(register) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<PaymentEntity> create(@RequestBody PaymentEntity register) {
        PaymentEntity created = service.create(register);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentEntity> update(@PathVariable Long id, @RequestBody PaymentEntity register) {
        PaymentEntity updated = service.update(id, register);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaymentEntity> uploadPayment(
            @RequestParam("name") String name,
            @RequestParam("admin_id") Long adminId,
            @RequestPart("qrPhotos") MultipartFile[] qrPhotos) throws IOException {
        
        List<String> qrPhotoUrls = new ArrayList<>();
        for (MultipartFile file : qrPhotos) {
            String url = cloudinaryUploadService.uploadToCloudinary(file, "payment-qr");
            qrPhotoUrls.add(url);
        }
        
        PaymentEntity payment = new PaymentEntity();
        payment.setName(name);
        payment.setAdmin_id(adminId);
        payment.setQrPhotoUrls(qrPhotoUrls);

        PaymentEntity saved = service.create(payment);
        return ResponseEntity.ok(saved);
    }

    // NEW: Upload only photos, return URLs (for edit)
    @PostMapping(value = "/upload-photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<String>> uploadPhotos(@RequestParam("qrPhotos") MultipartFile[] qrPhotos) throws IOException {
        List<String> qrPhotoUrls = new ArrayList<>();
        for (MultipartFile file : qrPhotos) {
            String url = cloudinaryUploadService.uploadToCloudinary(file, "payment-qr");
            qrPhotoUrls.add(url);
        }
        return ResponseEntity.ok(qrPhotoUrls);
    }
    
    @PutMapping(value = "/{id}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PaymentEntity> updateWithUpload(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("admin_id") Long adminId,
            @RequestPart("qrPhotos") MultipartFile[] qrPhotos) throws IOException {

        List<String> qrPhotoUrls = new ArrayList<>();
        for (MultipartFile file : qrPhotos) {
            String url = cloudinaryUploadService.uploadToCloudinary(file, "payment-qr");
            qrPhotoUrls.add(url);
        }

        PaymentEntity payment = new PaymentEntity();
        payment.setName(name);
        payment.setAdmin_id(adminId);
        payment.setQrPhotoUrls(qrPhotoUrls);

        PaymentEntity updated = service.update(id, payment);
        return ResponseEntity.ok(updated);
    }

}
