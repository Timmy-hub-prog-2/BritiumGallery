package com.maven.demo.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;

@Configuration
public class WebConfig {

    @Bean
    public ModelMapper mapper(){
        return new ModelMapper();
    }
}
