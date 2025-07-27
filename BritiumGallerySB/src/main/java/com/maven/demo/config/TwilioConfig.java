package com.maven.demo.config;

import com.twilio.Twilio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class TwilioConfig {

    @Value("${twilio.account_sid}")
    private String accountSid;

    @Value("${twilio.auth_token}")
    private String authToken;

    @Value("${twilio.from_phone}")
    private String fromPhone;

    public static String FROM_PHONE;

    @PostConstruct
    public void init() {
        try {
            System.out.println("🔧 Initializing Twilio with Account SID: " + accountSid.substring(0, 10) + "...");
            System.out.println("📱 From Phone: " + fromPhone);
            
            Twilio.init(accountSid, authToken);
            FROM_PHONE = fromPhone;
            
            System.out.println("✅ Twilio initialized successfully!");
        } catch (Exception e) {
            System.err.println("❌ Failed to initialize Twilio: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
