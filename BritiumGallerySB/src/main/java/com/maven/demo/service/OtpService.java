package com.maven.demo.service;

import com.maven.demo.entity.OtpEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.OtpRepository;
import com.maven.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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

    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your OTP Code");
        message.setText("Your OTP is: " + otpCode);
        message.setFrom("noreply@yourshop.com");

        mailSender.send(message);
    }

    private String generateOtpCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    @Transactional
    public String generateAndSendOtp(UserEntity user) {
        otpRepository.deleteByUser(user);

        String otp = generateOtpCode();

        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setUser(user);
        otpEntity.setOtpCode(otp);
        otpEntity.setCreatedAt(LocalDateTime.now());
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        OtpEntity savedOtp = otpRepository.save(otpEntity);
        otpRepository.flush();
        System.out.println("📝 Saved OTP ID in DB: " + savedOtp.getId());

        sendOtpEmail(user.getEmail(), otp);
        return otp;
    }

    @Transactional
    public String verifyOtp(String email, String inputOtp) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);
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
        return true; // you can re-enable cooldown logic here
    }
}
