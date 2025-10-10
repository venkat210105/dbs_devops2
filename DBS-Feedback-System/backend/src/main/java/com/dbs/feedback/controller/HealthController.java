package com.dbs.feedback.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"}, 
             allowCredentials = "true",
             maxAge = 3600)
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/")
    public String home() {
        return "DBS Feedback System is running!";
    }
}