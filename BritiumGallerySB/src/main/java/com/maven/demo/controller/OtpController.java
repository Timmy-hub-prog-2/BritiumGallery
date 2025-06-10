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

    // ✅ Resend OTP (email or phone)
    @PostMapping("/resend")
    public ResponseEntity<String> resendOtp(@RequestParam String identifier,
                                            @RequestParam(required = false) Boolean useSms) {
        System.out.println("🔁 Resend OTP for: " + identifier);

        Optional<UserEntity> userOpt = identifier.contains("@")
                ? userRepository.findByEmail(identifier)
                : userRepository.findByPhoneNumber(identifier);

        if (userOpt.isEmpty()) {
            System.out.println("❌ User not found");
            return ResponseEntity.badRequest().body("User not found");
        }

        UserEntity user = userOpt.get();

        if (user.getStatus() == 1) {
            System.out.println("❌ User already verified");
            return ResponseEntity.badRequest().body("User already verified");
        }

        if (!otpService.canResend(user)) {
            System.out.println("⏱️ Resend called too early");
            return ResponseEntity.badRequest().body("Please wait before requesting another code.");
        }

        otpService.generateAndSendOtp(user, Boolean.TRUE.equals(useSms), true); // 👈 Pass true for "isResend"
        String channel = Boolean.TRUE.equals(useSms) ? "phone" : "email";
        System.out.println("✅ OTP resent to " + channel);
        return ResponseEntity.ok("OTP has been resent to your " + channel + ".");
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
