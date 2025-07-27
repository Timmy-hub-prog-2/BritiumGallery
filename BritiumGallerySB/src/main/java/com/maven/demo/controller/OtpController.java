package com.maven.demo.controller;

import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/otp")
public class OtpController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserRepository userRepository;

    // ✅ Send/Resend OTP (email or phone)
    @PostMapping("/resend")
    public ResponseEntity<String> resendOtp(@RequestParam String identifier,
                                            @RequestParam(required = false) Boolean useSms,
                                            @RequestParam(required = false) Boolean isFirstTime) {
        System.out.println("🔁 Send/Resend OTP for: " + identifier);
        System.out.println("📱 Use SMS: " + useSms);
        System.out.println("🆕 Is First Time: " + isFirstTime);

        Optional<UserEntity> userOpt = identifier.contains("@")
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhoneNumber(identifier);

        if (userOpt.isEmpty()) {
            System.out.println("❌ User not found");
            return ResponseEntity.badRequest().body("User not found");
        }

        UserEntity user = userOpt.get();

        if (user.getStatus() != null && user.getStatus() == 1) {
            System.out.println("❌ User already verified");
            return ResponseEntity.badRequest().body("User already verified");
        }

        // Skip cooldown check for first-time OTP sending
        if (!Boolean.TRUE.equals(isFirstTime) && !otpService.canResend(user)) {
            System.out.println("⏱️ Resend called too early");
            return ResponseEntity.badRequest().body("Please wait before requesting another code.");
        }

        try {
            otpService.generateAndSendOtp(user, Boolean.TRUE.equals(useSms), !Boolean.TRUE.equals(isFirstTime));
            String channel = Boolean.TRUE.equals(useSms) ? "phone" : "email";
            String action = Boolean.TRUE.equals(isFirstTime) ? "sent" : "resent";
            System.out.println("✅ OTP " + action + " to " + channel);
            return ResponseEntity.ok("OTP has been " + action + " to your " + channel + ".");
        } catch (RuntimeException e) {
            System.err.println("❌ Failed to send OTP: " + e.getMessage());
            String errorMessage = Boolean.TRUE.equals(useSms) 
                ? "Failed to send SMS. Please try email verification or contact support." 
                : "Failed to send email. Please try SMS verification or contact support.";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorMessage);
        }
    }

    // ✅ Verify OTP (email or phone)
    @PostMapping("/verify")
    public ResponseEntity<String> verifyOtp(@RequestParam String identifier,
                                            @RequestParam String otp) {
        String result = otpService.verifyOtp(identifier, otp);

        switch (result) {
            case "verified":
            case "already-verified":
                return ResponseEntity.ok(result);
            case "OTP expired":
            case "Invalid OTP":
            case "No OTP found":
            case "User not found":
            default:
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }
}
