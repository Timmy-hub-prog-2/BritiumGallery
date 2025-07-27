package com.maven.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.demo.dto.EmailValidationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EmailValidationService {

    @Value("${abstractapi.email_validation_api_key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    @Autowired
    public EmailValidationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isEmailValid(String email) {
        String url = "https://emailvalidation.abstractapi.com/v1/?api_key=" + apiKey + "&email=" + email;

        try {
            String jsonResponse = restTemplate.getForObject(url, String.class);
            System.out.println("Raw API response: " + jsonResponse);

            // Now manually deserialize using ObjectMapper (Jackson)
            ObjectMapper mapper = new ObjectMapper();
            EmailValidationResponse response = mapper.readValue(jsonResponse, EmailValidationResponse.class);

            // Your validation logic...
            return response != null &&
                    response.getIsValidFormat().isValue() &&
                    response.getIsMxFound().isValue() &&
                    response.getIsSmtpValid().isValue(); // optional strict check


        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }



}
