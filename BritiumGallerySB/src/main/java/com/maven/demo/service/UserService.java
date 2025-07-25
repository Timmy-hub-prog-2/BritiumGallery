package com.maven.demo.service;

import com.maven.demo.dto.AddressDTO;
import com.maven.demo.dto.LoginResponseDTO;
import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.dto.CustomerGrowthDTO;
import com.maven.demo.entity.CustomerTypeEntity;
import com.maven.demo.entity.PasswordResetToken;
import com.maven.demo.entity.RoleEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.CustomerTypeRepository;
import com.maven.demo.repository.PasswordResetTokenRepository;
import com.maven.demo.repository.RoleRepository;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.util.PasswordGenerator;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AddressService addressService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private CustomerTypeRepository customerTypeRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EmailService emailService;

    public String registerUser(UserDTO dto) {
        String phone = dto.getPhoneNumber().trim();
        if (phone.startsWith("+959")) {
            phone = phone.replaceFirst("\\+959", "09");
        }

        if (userRepository.existsByEmail(dto.getEmail())) {
            return "Email already exists";
        }

        if (userRepository.existsByPhoneNumber(phone)) {
            return "Phone number already exists";
        }

        if (!phone.matches("^09[0-9]{7,9}$")) {
            return "Invalid phone number format";
        }

        RoleEntity role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        CustomerTypeEntity defaultType = customerTypeRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Default customer type not found"));

        List<String> imageUrls = dto.getImageUrls();
        if (imageUrls == null || imageUrls.isEmpty()) {
            imageUrls = List.of("https://res.cloudinary.com/dmbwaqjta/image/upload/v1748967961/Default_Photo_k8ihoe.png");
        }

        UserEntity user = new UserEntity();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setPhoneNumber(phone);
        user.setImageUrls(imageUrls);
        user.setGender(dto.getGender());
        user.setStatus(0);
        user.setRole(role);

        user.setCustomerType(defaultType);
        user.setCreatedAt(java.time.LocalDateTime.now());

        userRepository.save(user);

        UserEntity savedUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after save"));
        System.out.println("🔍 Saved user ID: " + savedUser.getId());

        boolean useSms = false;
        otpService.generateAndSendOtp(savedUser, useSms, false);

        return "User registered successfully";
    }


    public LoginResponseDTO login(String email, String password) {
        Optional<UserEntity> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) throw new RuntimeException("Invalid email");

        UserEntity user = userOpt.get();
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        if (!encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        // Only require status == 1 for customers (roleId 3)
        Integer status = user.getStatus();
        Long roleIdLong = (user.getRole() != null) ? user.getRole().getId() : null;
        int roleId = (roleIdLong != null) ? roleIdLong.intValue() : -1;

        if (status == null || status == 0) {
            boolean useSms = false;
            try {
                otpService.generateAndSendOtp(user, useSms, true);
            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("Failed to send OTP: " + e.getMessage());
            }
            // Instead of throwing, throw a custom exception with phone number
            throw new EmailNotVerifiedException("Email not verified", user.getPhoneNumber());
        }

        return new LoginResponseDTO(user);
    }

    // Custom exception for email not verified
    public static class EmailNotVerifiedException extends RuntimeException {
        private final String phoneNumber;
        public EmailNotVerifiedException(String message, String phoneNumber) {
            super(message);
            this.phoneNumber = phoneNumber;
        }
        public String getPhoneNumber() {
            return phoneNumber;
        }
    }


    public Optional<UserResponseDTO> updateUserProfile(Long id, UserDTO userDto) {
        return userRepository.findById(id).map(existingUser -> {

            // Update basic fields if present
            if (userDto.getName() != null) {
                existingUser.setName(userDto.getName());
            }

            if (userDto.getEmail() != null) {
                existingUser.setEmail(userDto.getEmail());
            }

            if (userDto.getPhoneNumber() != null) {
                existingUser.setPhoneNumber(userDto.getPhoneNumber());
            }

            if (userDto.getGender() != null) {
                existingUser.setGender(userDto.getGender());
            }

            // Replace image URLs only if new ones are sent
            if (userDto.getImageUrls() != null && !userDto.getImageUrls().isEmpty()) {
                existingUser.setImageUrls(new ArrayList<>(userDto.getImageUrls()));
            }

            // Optionally update role and status if provided
            if (userDto.getRoleId() != null) {
                roleRepository.findById(userDto.getRoleId()).ifPresent(existingUser::setRole);
            }

            if (userDto.getStatus() != null) {
                existingUser.setStatus(userDto.getStatus());
            }

            // Save updated entity
            UserEntity updatedUser = userRepository.save(existingUser);

            AddressDTO dto =  addressService.getMainAddressByUserId(id);



            // Manually map entity to response DTO
            UserResponseDTO response = new UserResponseDTO();
            response.setId(updatedUser.getId());
            response.setName(updatedUser.getName());
            response.setEmail(updatedUser.getEmail());
            response.setPhoneNumber(updatedUser.getPhoneNumber());
            response.setImageUrls(updatedUser.getImageUrls());
            response.setGender(updatedUser.getGender());
            response.setStatus(updatedUser.getStatus());
            response.setRoleId(updatedUser.getRole() != null ? updatedUser.getRole().getId() : null);
            // Set customerType if present
            if (updatedUser.getCustomerType() != null) {
                response.setCustomerType(updatedUser.getCustomerType().getType());
            }
            // Set totalSpend (sum all, or use first if only one)
            if (updatedUser.getTotalSpends() != null && !updatedUser.getTotalSpends().isEmpty()) {
                int total = updatedUser.getTotalSpends().stream().mapToInt(ts -> ts.getAmount()).sum();
                response.setTotalSpend(total);
            } else {
                response.setTotalSpend(0);
            }
            return response;
        });
    }

    public boolean changePassword(Long userId, String currentPassword, String newPassword) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        UserEntity user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    public java.util.List<CustomerGrowthDTO> getCustomerGrowth(java.time.LocalDate from, java.time.LocalDate to, String groupBy) {
        java.util.List<UserEntity> users = userRepository.findAll();
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        DateTimeFormatter weekFmt = DateTimeFormatter.ofPattern("YYYY-'W'ww");
        java.util.Map<String, Integer> periodMap = new TreeMap<>();
        for (UserEntity user : users) {
            if (user.getCreatedAt() == null) continue;
            java.time.LocalDate date = user.getCreatedAt().toLocalDate();
            if ((from != null && date.isBefore(from)) || (to != null && date.isAfter(to))) continue;
            String period;
            switch (groupBy == null ? "day" : groupBy) {
                case "month": period = date.format(monthFmt); break;
                case "week": period = date.format(weekFmt); break;
                default: period = date.format(dayFmt); break;
            }
            periodMap.put(period, periodMap.getOrDefault(period, 0) + 1);
        }
        java.util.List<CustomerGrowthDTO> result = new java.util.ArrayList<>();
        int cumulative = 0;
        for (java.util.Map.Entry<String, Integer> entry : periodMap.entrySet()) {
            cumulative += entry.getValue();
            result.add(new CustomerGrowthDTO(entry.getKey(), entry.getValue(), cumulative));
        }
        return result;
    }



    public String createAdmin(UserDTO userDto) {
        String phone = userDto.getPhoneNumber().trim();
        if (phone.startsWith("+959")) {
            phone = phone.replaceFirst("\\+959", "09");
        }

        if (userRepository.existsByEmail(userDto.getEmail())) {
            return "Email already exists";
        }

        if (userRepository.existsByPhoneNumber(phone)) {
            return "Phone number already exists";
        }

        if (!phone.matches("^09[0-9]{7,9}$")) {
            return "Invalid phone number format";
        }

        String generatedPassword = PasswordGenerator.generateRandomPassword(10);

        UserEntity user = new UserEntity();
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPhoneNumber(phone);
        user.setImageUrls(userDto.getImageUrls());
        user.setPassword(passwordEncoder.encode(generatedPassword));

        RoleEntity role = roleRepository.findById(userDto.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);

        userRepository.save(user);

        // ✅ HTML Email Content
        String subject = "Your Britium Admin Account Details";

        String htmlContent = "<div style='font-family:Arial,sans-serif;padding:10px;'>"
                + "<h3>Hello " + user.getName() + ",</h3>"
                + "<p> Your "+role.getType()+" account has been successfully created.</p>"
                + "<p><strong>Role:</strong> " + role.getType() + "</p>"
                + "<p><strong>Email:</strong> " + user.getEmail() + "</p>"
                + "<p><strong>Temporary Password:</strong> <span style='color:blue;'>" + generatedPassword + "</span></p>"
                + "<p>📌 Please log in and change your password for security reasons.</p>"
                + "<br/><p>Thanks,<br/>Britium Gallery Team</p>"
                + "</div>";

        try {
            emailService.sendHtmlEmail(user.getEmail(), subject, htmlContent);
        } catch (MessagingException e) {
            return "Admin created but failed to send email.";
        }

        return "Admin created successfully. Login details sent to email.";
    }

    public void processForgotPassword(String email) {
        // Find the user by email
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Generate a 6-digit code (or any length)
        String verificationCode = generateVerificationCode();

        // You can also save the code in a temporary table or directly in the database if you want to track expiry.
        // Save the verification code into the PasswordResetToken entity.
        passwordResetTokenRepository.save(new PasswordResetToken(verificationCode, user));

        // Send the verification code to the user's email
        String subject = "Your Verification Code";
        String message = "Your verification code is: " + verificationCode;
        try {
            emailService.sendHtmlEmail(user.getEmail(), subject, message);
        } catch (MessagingException e) {
            e.printStackTrace(); // Handle error sending email
        }
    }

    private String generateVerificationCode() {
        // Generates a 6-digit numeric code
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(random.nextInt(10)); // Append a random digit
        }
        return code.toString();
    }

    public void validateVerificationCode(String code, String newPassword) {
        System.out.println("Received code: " + code);
        System.out.println("New password: " + newPassword);

        PasswordResetToken token = passwordResetTokenRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code expired");
        }

        UserEntity user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.delete(token);
    }
    public boolean checkCode(String code) {
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByCode(code);

        if (tokenOpt.isEmpty()) return false;

        PasswordResetToken token = tokenOpt.get();

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            return false;
        }

        return true;
    }
    public void resendVerificationCode(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Create or update the token
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByUser(user);
        PasswordResetToken token = tokens.isEmpty() ? new PasswordResetToken() : tokens.get(0); // use first or create new

        token.setUser(user);
        token.setCode(generate6DigitCode()); // Implement this method to return a random 6-digit string
        token.setExpiryDate(LocalDateTime.now().plusMinutes(10));

        passwordResetTokenRepository.save(token);

        // Send email with new code
        emailService.sendResetCode(email, token.getCode()); // make sure this method exists
    }
    private String generate6DigitCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000–999999
        return String.valueOf(code);
    }

    public void resetPassword(String code, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code expired");
        }

        UserEntity user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.delete(token); // Invalidate token after use
    }

}