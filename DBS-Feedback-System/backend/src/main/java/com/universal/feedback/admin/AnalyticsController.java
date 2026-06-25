package com.universal.feedback.admin;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
             allowCredentials = "true",
             maxAge = 3600)
public class AnalyticsController {
    @Autowired
    private com.universal.feedback.service.FeedbackAgentService feedbackAgentService;

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> analytics = feedbackAgentService.getFeedbackAnalytics();
        return new ResponseEntity<>(analytics, HttpStatus.OK);
    }
}
