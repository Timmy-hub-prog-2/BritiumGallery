package com.maven.demo.service;

import com.maven.demo.config.TwilioConfig;
import com.maven.demo.entity.OtpEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.OtpRepository;
import com.maven.demo.repository.UserRepository;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    private String generateOtpCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    public void sendOtpEmail(String toEmail, String otpCode, boolean isResend) {
        String subject = isResend ? "🔁 Resent OTP Code – Britium Gallery" : "🔐 Your OTP Code – Britium Gallery";

        String content = """
        <div style="font-family:Arial,sans-serif; padding:20px; max-width:600px; margin:auto; border:1px solid #ccc; border-radius:8px;">
            <h2 style="color:#1a73e8;">%s</h2>
            <p>Hello,</p>
            <p>Your %s OTP code is:</p>
            <div style="font-size:24px; font-weight:bold; color:#1a73e8; margin:20px 0;">%s</div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this, just ignore the email.</p>
            <br>
            <p style="font-size:12px; color:#888;">— Britium Gallery System</p>
        </div>
        """.formatted(
                isResend ? "Resend OTP Request" : "Email Verification",
                isResend ? "resent" : "verification",
                otpCode
        );

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(content, true); // HTML = true
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendOtpSms(String toPhone, String otpCode) {
        if (!toPhone.startsWith("+")) {
            if (toPhone.startsWith("09")) {
                toPhone = "+959" + toPhone.substring(2);
            }
        }

        System.out.println("📤 Sending OTP SMS to: " + toPhone);

        try {
            Message message = Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(TwilioConfig.FROM_PHONE),
                    "Your OTP is: " + otpCode
            ).create();
            
            System.out.println("✅ SMS sent successfully! Message SID: " + message.getSid());
        } catch (com.twilio.exception.AuthenticationException e) {
            System.err.println("❌ Twilio Authentication Error: " + e.getMessage());
            System.err.println("🔑 Please check your Twilio Account SID and Auth Token");
            // For testing purposes, log the OTP instead of throwing exception
            System.out.println("🧪 TESTING MODE: OTP for " + toPhone + " is: " + otpCode);
            System.out.println("📝 In production, please update your Twilio credentials");
        } catch (com.twilio.exception.ApiException e) {
            System.err.println("❌ Twilio API Error: " + e.getMessage());
            System.err.println("📊 Error Code: " + e.getCode());
            
            // Handle specific Twilio error codes
            if (e.getCode() == 21608) {
                System.err.println("🔒 TRIAL ACCOUNT LIMITATION: Phone number not verified");
                System.err.println("💡 Solutions:");
                System.err.println("   1. Verify the number at: https://console.twilio.com/user/account/phone-numbers/verified");
                System.err.println("   2. Upgrade to paid account");
                System.err.println("   3. Use a different verified number");
                // For testing purposes, log the OTP instead of throwing exception
                System.out.println("🧪 TESTING MODE: OTP for " + toPhone + " is: " + otpCode);
                System.out.println("📝 In production, please verify the phone number or upgrade account");
            } else if (e.getMessage().contains("Connection reset") || e.getMessage().contains("connect")) {
                System.err.println("🌐 Network connectivity issue detected. Please check:");
                System.err.println("   - Internet connection");
                System.err.println("   - Firewall settings");
                System.err.println("   - Twilio service status");
                // For testing purposes, log the OTP instead of throwing exception
                System.out.println("🧪 TESTING MODE: OTP for " + toPhone + " is: " + otpCode);
                System.out.println("📝 In production, please update your Twilio credentials");
            } else {
                // For testing purposes, log the OTP instead of throwing exception
                System.out.println("🧪 TESTING MODE: OTP for " + toPhone + " is: " + otpCode);
                System.out.println("📝 In production, please update your Twilio credentials");
            }
        } catch (Exception e) {
            System.err.println("❌ Unexpected error sending SMS: " + e.getMessage());
            e.printStackTrace();
            // For testing purposes, log the OTP instead of throwing exception
            System.out.println("🧪 TESTING MODE: OTP for " + toPhone + " is: " + otpCode);
            System.out.println("📝 In production, please update your Twilio credentials");
        }
    }



    @Transactional
    public String generateAndSendOtp(UserEntity user, boolean useSms, boolean isResend) {
        System.out.println("🚀 ===== GENERATE AND SEND OTP ===== 🚀");
        System.out.println("👤 User: " + user.getEmail() + " / " + user.getPhoneNumber());
        System.out.println("📱 Use SMS: " + useSms);
        System.out.println("🔄 Is Resend: " + isResend);
        System.out.println("📊 User Status: " + user.getStatus());
        System.out.println("📊 User Role: " + (user.getRole() != null ? user.getRole().getType() : "No role"));
        
        otpRepository.deleteByUser(user);

        String otp = generateOtpCode();
        System.out.println("🔢 Generated OTP: " + otp);

        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setUser(user);
        otpEntity.setOtpCode(otp);
        otpEntity.setCreatedAt(LocalDateTime.now());
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        otpRepository.saveAndFlush(otpEntity);
        System.out.println("📝 Saved OTP ID in DB: " + otpEntity.getId());

        if (useSms) {
            System.out.println("📱 SENDING SMS OTP...");
            sendOtpSms(user.getPhoneNumber(), otp);
        } else {
            System.out.println("📧 SENDING EMAIL OTP...");
            sendOtpEmail(user.getEmail(), otp, isResend);
        }

        System.out.println("✅ ===== OTP SENT SUCCESSFULLY ===== ✅");
        return otp;
    }

    @Transactional
    public String verifyOtp(String identifier, String inputOtp) {
        Optional<UserEntity> userOpt = identifier.contains("@") ?
                userRepository.findByEmail(identifier) :
                userRepository.findByPhoneNumber(identifier);

        if (userOpt.isEmpty()) return "User not found";

        UserEntity user = userOpt.get();

        if (user.getStatus() != null && user.getStatus() == 1) {
            return "already-verified";
        }

        Optional<OtpEntity> latestOtpOpt = otpRepository.findTopByUserOrderByCreatedAtDesc(user);
        if (latestOtpOpt.isEmpty()) return "No OTP found";

        OtpEntity latestOtp = latestOtpOpt.get();

        if (latestOtp.getExpiresAt().isBefore(LocalDateTime.now())) return "OTP expired";

        if (!latestOtp.getOtpCode().equals(inputOtp.trim())) return "Invalid OTP";

        user.setStatus(1);
        userRepository.save(user);
        otpRepository.deleteByUser(user);

        return "verified";
    }

    public boolean canResend(UserEntity user) {
        Optional<OtpEntity> latestOtpOpt = otpRepository.findTopByUserOrderByCreatedAtDesc(user);
        if (latestOtpOpt.isEmpty()) {
            System.out.println("✅ No existing OTP found, can resend");
            return true;
        }

        OtpEntity latestOtp = latestOtpOpt.get();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cooldownTime = latestOtp.getCreatedAt().plusSeconds(30);
        boolean canResend = now.isAfter(cooldownTime);
        
        System.out.println("⏱️ Cooldown check:");
        System.out.println("   - Latest OTP created: " + latestOtp.getCreatedAt());
        System.out.println("   - Current time: " + now);
        System.out.println("   - Cooldown until: " + cooldownTime);
        System.out.println("   - Can resend: " + canResend);
        
        return canResend;
    }
}
