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
            } catch (RuntimeException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
            }
        }

        @GetMapping("/admins")
        public List<UserResponseDTO> viewAdmins() {
            return userService1.getAdmins();
        }

        @GetMapping("/customers")
        public List<UserResponseDTO> viewCustomers() {
            return userService1.getCustomers();
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
        public ResponseEntity<?> validateCode(@RequestBody ResetPasswordRequest request) {
            System.out.println("Code: " + request.getCode());  // ✅ should be 6 digits
            System.out.println("New Password: " + request.getNewPassword());

            userService.validateVerificationCode(request.getCode(), request.getNewPassword());
            return ResponseEntity.ok("Password has been reset");
        }


    }
