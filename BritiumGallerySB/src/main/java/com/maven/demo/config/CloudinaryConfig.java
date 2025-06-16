package com.maven.demo.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dytzqzsr8",
                "api_key", "965399842118843",
                "api_secret", "kgArAvZ2KhpZUodlkG8Z94YWgEM"
        ));
    }
}
