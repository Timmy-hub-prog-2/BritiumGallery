package com.maven.demo.controller;

import com.maven.demo.service.EmailValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
public class EmailValidationController {

    @Autowired
    private EmailValidationService emailValidationService;

    @GetMapping("/check")
    public ResponseEntity<String> checkEmail(@RequestParam String email) {
        boolean isValid = emailValidationService.isEmailValid(email);
        return ResponseEntity.ok("Email valid: " + isValid);
    }
}
