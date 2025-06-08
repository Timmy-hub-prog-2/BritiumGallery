package com.maven.demo.controller;

import com.maven.demo.entity.OtpEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.OtpRepository;
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
    private OtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/resend")
    public ResponseEntity<String> resendOtp(@RequestParam String email) {
        System.out.println("🔁 Resend OTP for: " + email);

        Optional<UserEntity> userOpt = userRepository.findByEmail(email);
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

        otpService.generateAndSendOtp(user);
        System.out.println("✅ OTP resent");
        return ResponseEntity.ok("OTP has been resent to your email.");
    }

    //  Verify OTP
    @PostMapping("/verify")
    public ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        String result = otpService.verifyOtp(email, otp);

        if ("verified".equals(result)) {
            return ResponseEntity.ok("verified");
        } else if ("already-verified".equals(result)) {
            return ResponseEntity.ok("already-verified");
        } else {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or expired OTP");
        }
    }
}
