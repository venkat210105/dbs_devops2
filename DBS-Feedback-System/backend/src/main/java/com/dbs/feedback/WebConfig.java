package com.dbs.feedback;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Allow all endpoints
                        .allowedOrigins(
                            "http://localhost:3000",     // React dev server default
                            "http://localhost:3001",     // React dev server alternative
                            "http://127.0.0.1:3000",    // Localhost alternative
                            "http://127.0.0.1:3001"     // Localhost alternative
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                        .allowedHeaders("*")           // Allow all headers
                        .allowCredentials(true)        // Allow credentials
                        .maxAge(3600);                // Cache preflight for 1 hour
            }
        };
    }
}
