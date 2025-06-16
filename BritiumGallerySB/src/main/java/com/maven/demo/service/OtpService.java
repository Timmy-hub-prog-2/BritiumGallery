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
            <p>If you didn’t request this, just ignore the email.</p>
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

        Message.creator(
                new PhoneNumber(toPhone),
                new PhoneNumber(TwilioConfig.FROM_PHONE),
                "Your OTP is: " + otpCode
        ).create();
    }

    @Transactional
    public String generateAndSendOtp(UserEntity user, boolean useSms, boolean isResend) {
        otpRepository.deleteByUser(user);

        String otp = generateOtpCode();

        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setUser(user);
        otpEntity.setOtpCode(otp);
        otpEntity.setCreatedAt(LocalDateTime.now());
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        otpRepository.saveAndFlush(otpEntity);
        System.out.println("📝 Saved OTP ID in DB: " + otpEntity.getId());

        if (useSms) {
            sendOtpSms(user.getPhoneNumber(), otp);
        } else {
            sendOtpEmail(user.getEmail(), otp, isResend);
        }

        return otp;
    }

    @Transactional
    public String verifyOtp(String identifier, String inputOtp) {
        Optional<UserEntity> userOpt = identifier.contains("@") ?
                userRepository.findByEmail(identifier) :
                userRepository.findByPhoneNumber(identifier);

        if (userOpt.isEmpty()) return "User not found";

        UserEntity user = userOpt.get();

        if (user.getStatus() == 1) return "already-verified";

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
        if (latestOtpOpt.isEmpty()) return true;

        OtpEntity latestOtp = latestOtpOpt.get();
        return LocalDateTime.now().isAfter(latestOtp.getCreatedAt().plusSeconds(30));
    }
}
