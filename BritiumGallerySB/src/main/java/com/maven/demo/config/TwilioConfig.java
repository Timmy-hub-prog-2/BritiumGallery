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
        Twilio.init(accountSid, authToken);
        FROM_PHONE = fromPhone;
    }
}
