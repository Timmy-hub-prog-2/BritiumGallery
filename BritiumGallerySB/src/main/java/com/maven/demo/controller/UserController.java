    package com.maven.demo.controller;

    import com.maven.demo.dto.LoginRequestDTO;
    import com.maven.demo.dto.LoginResponseDTO;
    import com.maven.demo.dto.UserDTO;
    import com.maven.demo.dto.UserResponseDTO;
    import com.maven.demo.service.CloudinaryUploadService;
    import com.maven.demo.service.UserService;
    import com.maven.demo.service.UserService1;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.web.multipart.MultipartFile;

    import java.io.IOException;
    import java.util.ArrayList;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;

    @CrossOrigin(origins = "http://localhost:4200")
    @RestController
    @RequestMapping("/gallery/users")
    public class UserController {

        @Autowired
        private UserService userService;

        @Autowired
        private CloudinaryUploadService cloudinaryUploadService;

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

    }
