    package com.maven.demo.controller;

    import java.io.IOException;
    import java.util.ArrayList;
    import java.util.Collections;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;
    import java.util.Optional;

    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.CrossOrigin;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.PathVariable;
    import org.springframework.web.bind.annotation.PostMapping;
    import org.springframework.web.bind.annotation.PutMapping;
    import org.springframework.web.bind.annotation.RequestBody;
    import org.springframework.web.bind.annotation.RequestMapping;
    import org.springframework.web.bind.annotation.RequestParam;
    import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.maven.demo.dto.CustomerGrowthDTO;
import com.maven.demo.dto.LoginRequestDTO;
import com.maven.demo.dto.LoginResponseDTO;
import com.maven.demo.dto.PeopleDTO;
import com.maven.demo.dto.UserDTO;
import com.maven.demo.dto.UserResponseDTO;
import com.maven.demo.entity.AddressEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.entity.UserOnlineStatusEntity;
import com.maven.demo.repository.UserOnlineStatusRepository;
import com.maven.demo.repository.UserRepository;
import com.maven.demo.service.AddressService;
import com.maven.demo.service.CloudinaryUploadService;
import com.maven.demo.service.UserService;
import com.maven.demo.service.UserService1;
    import com.maven.demo.dto.*;
    import com.maven.demo.service.AddressService;
    import com.maven.demo.service.CloudinaryUploadService;
    import com.maven.demo.service.UserService;
    import com.maven.demo.service.UserService1;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.web.multipart.MultipartFile;

    import java.io.IOException;
    import java.util.*;
    import java.time.LocalDateTime;

    @CrossOrigin(origins = "http://localhost:4200")
    @RestController
    @RequestMapping("/gallery/users")
    public class UserController {

        @Autowired
        private UserService userService;

        @Autowired
        private CloudinaryUploadService cloudinaryUploadService;

        @Autowired
        private AddressService addressService;

        @Autowired
        private UserService1 userService1;

        @Autowired
        private UserRepository userRepository;
        @Autowired
        private UserOnlineStatusRepository userOnlineStatusRepository;

        @PostMapping("/register")
        public ResponseEntity<Map<String, String>> registerUser(
                @RequestPart("user") UserDTO userDto,
                @RequestPart(value = "images",  required = false) MultipartFile[] imageFiles) throws IOException {

            List<String> imageUrls = new ArrayList<>();

            if (imageFiles != null && imageFiles.length > 0 && !imageFiles[0].isEmpty()) {
                for (MultipartFile file : imageFiles) {
                    String url = cloudinaryUploadService.uploadToCloudinary(file, "user");
                    imageUrls.add(url);
                }
            } else {

                imageUrls.add("https://res.cloudinary.com/dmbwaqjta/image/upload/v1748967961/Default_Photo_k8ihoe.png");
            }

            userDto.setImageUrls(imageUrls);

            String result = userService.registerUser(userDto);

            Map<String, String> response = new HashMap<>();
            response.put("message", result);

            if ("Email already exists".equals(result) || "Phone number already exists".equals(result)) {
                return ResponseEntity.badRequest().body(response);
            }

            return ResponseEntity.ok(response);
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequestDTO dto) {
            try {
                LoginResponseDTO response = userService.login(dto.getEmail(), dto.getPassword());
                return ResponseEntity.ok(response);
            } catch (UserService.EmailNotVerifiedException ex) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", ex.getMessage());
                errorResponse.put("phoneNumber", ex.getPhoneNumber());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            } catch (RuntimeException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
            }
        }

          @GetMapping("/admins")
        public List<UserResponseDTO> getAdmins(@RequestParam(required = false) String status) {
            return userService1.getAdmins(status);
        }
        @GetMapping("/customers")
        public List<UserResponseDTO> getCustomers(@RequestParam(required = false) String status) {
            return userService1.getCustomers(status);
        }

        @GetMapping(value = "/admin/customer-growth", produces = "application/json")
        public ResponseEntity<java.util.List<CustomerGrowthDTO>> getCustomerGrowth(
                @RequestParam String from,
                @RequestParam String to,
                @RequestParam(defaultValue = "day") String groupBy) {
            java.time.LocalDate fromDate = java.time.LocalDate.parse(from);
            java.time.LocalDate toDate = java.time.LocalDate.parse(to);
            java.util.List<CustomerGrowthDTO> result = userService.getCustomerGrowth(fromDate, toDate, groupBy);
            return ResponseEntity.ok(result);
        }


        @GetMapping("/profile/{id}")
        public ResponseEntity<UserResponseDTO> getUserProfileById(@PathVariable Long id) {

            return userService1.getUserProfileById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/profile/by-identifier")
        public ResponseEntity<UserResponseDTO> getUserProfileByIdentifier(@RequestParam String identifier) {
            Optional<UserEntity> userOpt;
            if (identifier.contains("@")) {
                userOpt = userRepository.findByEmail(identifier);
            } else {
                userOpt = userRepository.findByPhoneNumber(identifier);
            }
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            UserEntity user = userOpt.get();
            // Map to UserResponseDTO (reuse your mapping logic)
            UserResponseDTO dto = new UserResponseDTO();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            dto.setPhoneNumber(user.getPhoneNumber());
            dto.setImageUrls(user.getImageUrls());
            dto.setGender(user.getGender());
            dto.setStatus(user.getStatus());
            dto.setRoleId(user.getRole() != null ? user.getRole().getId() : null);
            if (user.getCustomerType() != null) {
                dto.setCustomerType(user.getCustomerType().getType());
            }
            if (user.getTotalSpends() != null && !user.getTotalSpends().isEmpty()) {
                int total = user.getTotalSpends().stream().mapToInt(ts -> ts.getAmount()).sum();
                dto.setTotalSpend(total);
            } else {
                dto.setTotalSpend(0);
            }
            return ResponseEntity.ok(dto);
        }

        @GetMapping("/people/{id}")
        public ResponseEntity<PeopleDTO> getPeopleById(@PathVariable Long id) {
            Optional<UserEntity> userOpt = userService1.getUserEntityById(id);
            if (userOpt.isEmpty()) return ResponseEntity.notFound().build();
            UserEntity user = userOpt.get();
            PeopleDTO dto = new PeopleDTO();
            dto.id = user.getId();
            dto.name = user.getName();
            dto.email = user.getEmail();
            dto.gender = user.getGender();
            dto.phoneNumber = user.getPhoneNumber();
            // Set profilePic (first image URL if available)
            if (user.getImageUrls() != null && !user.getImageUrls().isEmpty()) {
                dto.profilePic = user.getImageUrls().get(0);
            }
            // Set customerType
            if (user.getCustomerType() != null) {
                dto.customerType = user.getCustomerType().getType();
            }
            // Find main address
            AddressEntity mainAddr = null;
            if (user.getAddresses() != null) {
                mainAddr = user.getAddresses().stream().filter(AddressEntity::isMainAddress).findFirst().orElse(null);
            }
            if (mainAddr != null) {
                PeopleDTO.Address addr = new PeopleDTO.Address();
                addr.houseNumber = mainAddr.getHouseNumber();
                addr.wardName = mainAddr.getWardName();
                addr.street = mainAddr.getStreet();
                addr.township = mainAddr.getTownship();
                addr.city = mainAddr.getCity();
                addr.state = mainAddr.getState();
                addr.country = mainAddr.getCountry();
                addr.latitude = mainAddr.getLatitude();
                addr.longitude = mainAddr.getLongitude();
                dto.address = addr;
            }
            // Set online status
            UserOnlineStatusEntity status = userOnlineStatusRepository.findByUser(user)
                    .orElseGet(() -> {
                        UserOnlineStatusEntity s = new UserOnlineStatusEntity();
                        s.setUser(user);
                        return s;
                    });
            if (status != null) {
                dto.setIsOnline(status.isOnline());
                if (status.isOnline()) {
                    if (status.getUpdatedAt() != null) {
                        dto.setLastSeenAt(status.getUpdatedAt().format(java.time.format.DateTimeFormatter.ISO_DATE_TIME));
                    }
                } else {
                    if (status.getLastOnlineAt() != null) {
                        dto.setLastSeenAt(status.getLastOnlineAt().format(java.time.format.DateTimeFormatter.ISO_DATE_TIME));
                    } else if (status.getUpdatedAt() != null) {
                        dto.setLastSeenAt(status.getUpdatedAt().format(java.time.format.DateTimeFormatter.ISO_DATE_TIME));
                    } else {
                        dto.setLastSeenAt(null);
                    }
                }
            } else {
                dto.setIsOnline(false);
                dto.setLastSeenAt(null);
            }
            return ResponseEntity.ok(dto);
        }

        @PutMapping("/profile/{id}")
        public ResponseEntity<UserResponseDTO> updateUserProfile(
                @PathVariable Long id,
                @RequestPart("user") UserDTO userDto,
                @RequestPart(value = "images", required = false) MultipartFile imageFile) {

            System.out.println("sent data : " + userDto);
            System.out.println("images : " + imageFile);

            // Upload image if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    String imageUrl = cloudinaryUploadService.uploadToCloudinary(imageFile, "user");
                    List<String> imageUrls = new ArrayList<>();
                    imageUrls.add(imageUrl);
                    userDto.setImageUrls(imageUrls);
                } catch (IOException e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                }
            }

            System.out.println("user dto : " + userDto);

            Optional<UserResponseDTO> updatedUser = userService.updateUserProfile(id, userDto);

            return updatedUser.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        @PutMapping("/profile/{id}/change-password")
        public ResponseEntity<?> changePassword(
                @PathVariable Long id,
                @RequestBody Map<String, String> payload) {
            try {
                String currentPassword = payload.get("currentPassword");
                String newPassword = payload.get("newPassword");
                String confirmPassword = payload.get("confirmPassword");

                if (newPassword == null || !newPassword.equals(confirmPassword)) {
                    return ResponseEntity.badRequest()
                            .body(Collections.singletonMap("message", "New password and confirm password do not match"));
                }

                boolean success = userService.changePassword(id, currentPassword, newPassword);

                return ResponseEntity.ok(Collections.singletonMap("message", "Password changed successfully"));

            } catch (RuntimeException ex) {
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("message", ex.getMessage()));
            }
        }
        @PostMapping("/superadmin/createAdmin")
        public ResponseEntity<Map<String, String>> createAdmin(@RequestBody UserDTO userDto) {
            String result = userService.createAdmin(userDto);

            Map<String, String> response = new HashMap<>();
            response.put("message", result);

            if ("Email already exists".equals(result) || "Phone number already exists".equals(result)) {
                return ResponseEntity.badRequest().body(response);
            }

            return ResponseEntity.ok(response);
        }

        @PostMapping("/auth/forgot-password")
        public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
            String email = request.get("email");
            userService.processForgotPassword(email);
            return ResponseEntity.ok("Reset code sent");
        }

        @PostMapping("/auth/validate-code")
        public ResponseEntity<?> validateCodeOnly(@RequestBody Map<String, String> body) {
            String code = body.get("code");
            System.out.println("Verifying code: " + code);

            boolean valid = userService.checkCode(code);
            if (valid) {
                return ResponseEntity.ok("Code is valid");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid code");
            }
        }

        @PostMapping("/auth/resend-code")
        public ResponseEntity<?> resendCode(@RequestBody Map<String, String> request) {
            String email = request.get("email");
            System.out.println("📩 Resend requested for email: " + email); // 🔍 Debug
            try {
                userService.resendVerificationCode(email);
                return ResponseEntity.ok("Verification code resent.");
            } catch (Exception ex) {
                ex.printStackTrace(); // 🔍 see exact cause
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to resend code.");
            }
        }

        @PostMapping("/auth/reset-password")
        public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
            System.out.println("🔐 Received reset-password request:");
            System.out.println("Code: " + request.getCode());
            System.out.println("New Password: " + request.getNewPassword());

            userService.resetPassword(request.getCode(), request.getNewPassword());
            return ResponseEntity.ok("Password reset successful");
        }



        @PostMapping("/heartbeat")
        public ResponseEntity<?> heartbeat(@RequestBody Map<String, Long> body) {
            Long userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body("Missing userId");
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) return ResponseEntity.badRequest().body("User not found");
            UserOnlineStatusEntity status = userOnlineStatusRepository.findByUser(user)
                    .orElseGet(() -> {
                        UserOnlineStatusEntity s = new UserOnlineStatusEntity();
                        s.setUser(user);
                        return s;
                    });
            if (status == null) {
                status = new UserOnlineStatusEntity();
                status.setUser(user);
            }
            status.setOnline(true);
            status.setUpdatedAt(LocalDateTime.now());
            userOnlineStatusRepository.save(status);
            return ResponseEntity.ok().build();
        }

        @PostMapping("/logout")
        public ResponseEntity<?> logout(@RequestBody Map<String, Long> body) {
            Long userId = body.get("userId");
            if (userId == null) return ResponseEntity.badRequest().body("Missing userId");
            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user == null) return ResponseEntity.badRequest().body("User not found");
            UserOnlineStatusEntity status = userOnlineStatusRepository.findByUser(user)
                    .orElseGet(() -> {
                        UserOnlineStatusEntity s = new UserOnlineStatusEntity();
                        s.setUser(user);
                        return s;
                    });
            if (status == null) {
                status = new UserOnlineStatusEntity();
                status.setUser(user);
            }
            status.setOnline(false);
            status.setLastOnlineAt(java.time.LocalDateTime.now());
            status.setUpdatedAt(java.time.LocalDateTime.now());
            userOnlineStatusRepository.save(status);
            return ResponseEntity.ok().build();
        }


    }
