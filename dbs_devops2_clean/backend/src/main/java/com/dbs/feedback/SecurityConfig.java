package com.dbs.feedback;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("SecurityConfig loaded!"); // Log to confirm config is active
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/feedback/submit", "/authorize", "/**").permitAll() // Allow all for testing
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable());
        return http.build();
    }
}
