package com.universal.feedback.admin;

import com.universal.feedback.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true",
        maxAge = 3600)
public class NotifyController {
    private final EmailService emailService;

    public NotifyController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/notify")
    public ResponseEntity<?> notifyTeam(@RequestBody Map<String, Object> payload) {
        String to = (String) payload.getOrDefault("to", "venkatmariserla02@gmail.com");
        String subject = (String) payload.getOrDefault("subject", "Universal Notification");
        String body = (String) payload.getOrDefault("body", "");
        try {
            emailService.sendEmail(to, subject, body);
            return ResponseEntity.ok(Map.of("status", "sent", "to", to));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
